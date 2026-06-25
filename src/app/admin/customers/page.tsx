'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import styles from './customers.module.css';
import { Customer, CustomerRole, CustomerStatus, CustomerActivity, CustomerOrder, CustomerAddress } from './types';

export default function AdminCustomersPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/account');
      }
    }
  }, [user, authLoading, router, isAdmin]);

  // States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'addresses' | 'activity'>('orders');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch customer lists from Supabase DB
  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      try {
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profError) {
          console.error('Error fetching profiles:', profError.message);
          return;
        }

        const dbProfiles = profiles || [];
        const initialized: Customer[] = [];

        for (const prof of dbProfiles) {
          // Fetch actual orders for this profile
          const { data: dbOrders } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', prof.id);

          // Fetch actual addresses for this profile
          const { data: dbAddresses } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', prof.id);

          const customerOrders: CustomerOrder[] = (dbOrders || []).map((o: any) => ({
            id: o.id,
            order_number: o.order_number || `STK-ORD-${o.id.slice(0, 4).toUpperCase()}`,
            date: new Date(o.created_at).toLocaleDateString(),
            items_count: o.order_items ? o.order_items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : 0,
            total: o.total || 0,
            status: o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Pending'
          }));

          const customerAddresses: CustomerAddress[] = (dbAddresses || []).map((addr: any) => ({
            id: addr.id,
            label: addr.label || 'Home',
            address: `${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}, ${addr.city}, ${addr.state} ${addr.postal_code}, ${addr.country}`,
            is_default: addr.is_default || false
          }));

          const lifetimeSpend = customerOrders.reduce((sum, ord) => sum + ord.total, 0);

          // Format last active based on updated_at
          const lastActiveStr = prof.updated_at 
            ? new Date(prof.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) 
            : 'N/A';

          initialized.push({
            id: prof.id,
            name: prof.full_name || 'User',
            email: prof.email || 'user@stoky.co',
            phone: prof.phone || 'N/A',
            avatar_url: prof.avatar_url || null,
            join_date: prof.created_at ? new Date(prof.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
            total_orders: customerOrders.length,
            lifetime_spend: lifetimeSpend,
            last_active: lastActiveStr,
            role: (prof.role ? prof.role.charAt(0).toUpperCase() + prof.role.slice(1) : 'Customer') as CustomerRole,
            status: (prof.status || 'Active') as CustomerStatus,
            orders: customerOrders,
            addresses: customerAddresses,
            activityLog: [] // Activity log is empty as it is not stored in DB
          });
        }

        setCustomers(initialized);
      } catch (e) {
        console.error('Exception during customers loading:', e);
      } finally {
        setLoading(false);
      }
    }

    if (user && isAdmin) {
      loadCustomers();
    }
  }, [user, isAdmin]);

  // Suspend/Banning Toggles
  const handleToggleStatus = async (target: Customer) => {
    const nextStatus: CustomerStatus = target.status === 'Active' ? 'Suspended' : 'Active';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus })
        .eq('id', target.id);
        
      if (error) {
        console.warn('Could not persist status change in Supabase (status column may be missing):', error.message);
      }
    } catch (e) {
      console.warn('Supabase status update crash:', e);
    }

    const updated = customers.map((c) => {
      if (c.id === target.id) {
        const updatedCustomer = {
          ...c,
          status: nextStatus
        };
        setSelectedCustomer(updatedCustomer);
        return updatedCustomer;
      }
      return c;
    });

    setCustomers(updated);
    if (nextStatus === 'Suspended') {
      showToast(`Account for ${target.name} has been suspended.`, 'error');
    } else {
      showToast(`Account for ${target.name} is now active.`);
    }
  };

  // Search logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query);
    });
  }, [customers, searchQuery]);

  const handleViewProfile = (c: Customer) => {
    setSelectedCustomer(c);
    setActiveSubTab('orders');
  };

  const formatPrice = (paise: number) => {
    return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  // Metric averages
  const avgOrderValue = useMemo(() => {
    if (!selectedCustomer || selectedCustomer.total_orders === 0) return 0;
    return Math.round(selectedCustomer.lifetime_spend / selectedCustomer.total_orders);
  }, [selectedCustomer]);

  if (authLoading || !user || !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ fontSize: '16px', letterSpacing: '0.05em' }}>Verifying admin authorization...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden selection:bg-black/10 selection:text-black">
      <Navbar />
      
      <main className={styles.container}>
        {!selectedCustomer ? (
          /* ═══════════════════════════════════════════════════════════
             1. Customers Table View
             ═══════════════════════════════════════════════════════════ */
          <>
            {/* Header */}
            <div className={styles.topBar}>
              <div className={styles.headingArea}>
                <h1>
                  Customers 
                  <span className={styles.customerCount}>({loading ? '...' : filteredCustomers.length})</span>
                </h1>
              </div>
            </div>

            {/* Search filter */}
            <div className={styles.filterRow}>
              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.603Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search customers by name or email address..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Data Table */}
            <div className={styles.tableContainer}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', fontSize: '13.5px' }}>
                  Loading customer records...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', fontSize: '13.5px' }}>
                  No customer records match your query.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Customer Details</th>
                      <th>Joined Date</th>
                      <th>Orders</th>
                      <th>Total Spend</th>
                      <th>Last Active</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c) => {
                      const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      
                      // Role Styling
                      let rClass = styles.roleCustomer;
                      if (c.role === 'VIP') rClass = styles.roleVIP;
                      if (c.role === 'Admin') rClass = styles.roleAdmin;

                      // Status Styling
                      const sClass = c.status === 'Active' ? styles.statusActive : styles.statusSuspended;

                      return (
                        <tr key={c.id}>
                          <td>
                            <div className={styles.identityCell}>
                              <div className={styles.avatar}>
                                {c.avatar_url ? (
                                  <img src={c.avatar_url} alt={c.name} className={styles.avatarImg} />
                                ) : (
                                  initials
                                )}
                              </div>
                              <div className={styles.nameBlock}>
                                <span className={styles.name}>{c.name}</span>
                                <span className={styles.email}>{c.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>{c.join_date}</td>
                          <td>{c.total_orders}</td>
                          <td>{formatPrice(c.lifetime_spend)}</td>
                          <td>{c.last_active}</td>
                          <td>
                            <span className={`${styles.badge} ${rClass}`}>
                              {c.role}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${sClass}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <button className={styles.viewProfileBtn} onClick={() => handleViewProfile(c)}>
                              View Profile
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* ═══════════════════════════════════════════════════════════
             2. Full Customer Detail Page
             ═══════════════════════════════════════════════════════════ */
          <>
            {/* Back Button */}
            <button className={styles.backButton} onClick={() => setSelectedCustomer(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '15px', height: '15px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back to Customers
            </button>

            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.profileHeaderLeft}>
                <div className={styles.profileAvatar}>
                  {selectedCustomer.avatar_url ? (
                    <img src={selectedCustomer.avatar_url} alt={selectedCustomer.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    selectedCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className={styles.profileMeta}>
                  <h2>{selectedCustomer.name}</h2>
                  <div className={styles.profileSubMeta}>
                    <span>Email: <strong>{selectedCustomer.email}</strong></span>
                    <span>•</span>
                    <span>Phone: <strong>{selectedCustomer.phone}</strong></span>
                    <span>•</span>
                    <span>Joined: <strong>{selectedCustomer.join_date}</strong></span>
                    <span>•</span>
                    <span className={`${styles.badge} ${selectedCustomer.role === 'VIP' ? styles.roleVIP : selectedCustomer.role === 'Admin' ? styles.roleAdmin : styles.roleCustomer}`}>
                      {selectedCustomer.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banning button action */}
              <div>
                {selectedCustomer.status === 'Active' ? (
                  <button className={styles.banButton} onClick={() => handleToggleStatus(selectedCustomer)}>
                    Suspend Account
                  </button>
                ) : (
                  <button className={styles.unbanButton} onClick={() => handleToggleStatus(selectedCustomer)}>
                    Activate Account
                  </button>
                )}
              </div>
            </div>

            {/* Metrics cards */}
            <div className={styles.metricsRow}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Orders</div>
                <div className={styles.metricValue}>{selectedCustomer.total_orders}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Lifetime Spend</div>
                <div className={styles.metricValue}>{formatPrice(selectedCustomer.lifetime_spend)}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Average Order Value</div>
                <div className={styles.metricValue}>{formatPrice(avgOrderValue)}</div>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className={styles.tabsContainer}>
              <button 
                className={`${styles.tabButton} ${activeSubTab === 'orders' ? styles.activeTab : ''}`}
                onClick={() => setActiveSubTab('orders')}
              >
                Orders history
              </button>
              <button 
                className={`${styles.tabButton} ${activeSubTab === 'addresses' ? styles.activeTab : ''}`}
                onClick={() => setActiveSubTab('addresses')}
              >
                Saved Addresses
              </button>
              <button 
                className={`${styles.tabButton} ${activeSubTab === 'activity' ? styles.activeTab : ''}`}
                onClick={() => setActiveSubTab('activity')}
              >
                Activity Log
              </button>
            </div>

            {/* Tab Panels */}
            {activeSubTab === 'orders' && (
              <div className={styles.tabTableContainer}>
                {selectedCustomer.orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '13px' }}>
                    No order transactions recorded for this user.
                  </div>
                ) : (
                  <table className={styles.tabTable}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Transaction Date</th>
                        <th>Items Count</th>
                        <th>Total Invoice</th>
                        <th>Fulfillment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.orders.map((o) => (
                        <tr key={o.id}>
                          <td className={styles.orderNumLink}>{o.order_number}</td>
                          <td>{o.date}</td>
                          <td>{o.items_count}</td>
                          <td>{formatPrice(o.total)}</td>
                          <td>
                            <span className={`${styles.badge} ${o.status === 'Delivered' ? styles.statusDelivered : o.status === 'Shipped' ? styles.statusShipped : o.status === 'Processing' ? styles.statusProcessing : styles.statusPending}`}>
                              <span className={styles.badgeDot} />
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeSubTab === 'addresses' && (
              <div className={styles.tabTableContainer}>
                {selectedCustomer.addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '13px' }}>
                    No shipping addresses saved by this customer.
                  </div>
                ) : (
                  <table className={styles.tabTable}>
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Full Address</th>
                        <th>Default Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.addresses.map((addr) => (
                        <tr key={addr.id}>
                          <td style={{ fontWeight: 600 }}>{addr.label}</td>
                          <td>{addr.address}</td>
                          <td>
                            {addr.is_default ? (
                              <span className={styles.badge} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>Default</span>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeSubTab === 'activity' && (
              <div className={styles.activityList}>
                {selectedCustomer.activityLog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '13px' }}>
                    No system log timestamps recorded.
                  </div>
                ) : (
                  selectedCustomer.activityLog.map((log) => (
                    <div key={log.id} className={styles.activityRow}>
                      <span className={styles.activityMain}>{log.action}</span>
                      <div className={styles.activityMeta}>
                        <span>IP Address: <code>{log.ip}</code></span>
                        <span>•</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Toast alert popups */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
