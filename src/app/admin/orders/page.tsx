'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import styles from './orders.module.css';
import { Order, OrderItem, OrderStatus, PaymentStatus, TimelineStep } from './types';

// Predefined mock products for generating realistic order items
const MOCK_PRODUCTS = [
  { name: 'Premium Heavyweight Box Tee', price: 1499, slug: 'premium-heavyweight-box-tee', image: '/images/tshirt-black.png', variants: ['S / Black', 'M / Black', 'L / Black', 'XL / Black'] },
  { name: 'Oversized Knit Sweater', price: 3499, slug: 'oversized-knit-sweater', image: '/images/tshirt-grey.png', variants: ['M / Grey', 'L / Grey', 'XL / Grey'] },
  { name: 'Relaxed Fit Cargo Pants', price: 2499, slug: 'relaxed-fit-cargo-pants', image: '/images/tshirt-olive.png', variants: ['30 / Olive', '32 / Olive', '34 / Olive'] },
  { name: 'Mercerized Cotton Tee', price: 1299, slug: 'mercerized-cotton-tee', image: '/images/tshirt-white.png', variants: ['M / White', 'L / White', 'XL / White'] },
  { name: 'Structured Blazer Jacket', price: 5999, slug: 'structured-blazer-jacket', image: '/images/tshirt-navy.png', variants: ['40 / Navy', '42 / Navy', '44 / Navy'] }
];

const MOCK_CUSTOMERS = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', phone: '+91 98123 45678', address: 'Flat 402, Skyline Residency, Bandra West, Mumbai, MH - 400050' },
  { name: 'Meera Nair', email: 'meera.nair@yahoo.com', phone: '+91 98456 12309', address: 'Plot 89, Sector 15, Vashi, Navi Mumbai, MH - 400703' },
  { name: 'Aditya Verma', email: 'aditya.verma@outlook.com', phone: '+91 99100 88221', address: '12-A, Golf Links, New Delhi, DL - 110003' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', phone: '+91 90044 55112', address: 'No 45, 8th Main Road, Indiranagar, Bengaluru, KA - 560038' },
  { name: 'Rohan Gupta', email: 'rohan.gupta@gmail.com', phone: '+91 91677 88990', address: 'Flat 205, Silver Oak Apartments, Gachibowli, Hyderabad, TS - 500032' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', phone: '+91 99555 44332', address: 'Door 4-11, Jubilee Hills, Road No. 3, Hyderabad, TS - 500033' },
  { name: 'Kabir Malhotra', email: 'kabir.malhotra@gmail.com', phone: '+91 98711 00223', address: 'C-34, Greater Kailash I, New Delhi, DL - 110048' },
  { name: 'Surya Garapati', email: 'garapatisurya07@gmail.com', phone: '+91 99887 76655', address: 'Flat 901, Royal Palms, Banjara Hills, Hyderabad, TS - 500034' }
];

export default function AdminOrdersPage() {
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

  // Main Page States
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Filtering & Searching States
  const [activeTab, setActiveTab] = useState<OrderStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Form Fulfill States
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  
  // Feedback states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Generate 25 premium mock orders
  const generateMockOrders = (): Order[] => {
    const list: Order[] = [];
    const statuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const pStatuses: PaymentStatus[] = ['Paid', 'Pending', 'Refunded'];
    
    let baseOrderNum = 1001;
    const now = new Date();
    
    for (let i = 0; i < 25; i++) {
      // Pick random customer
      const cust = MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length];
      
      // Determine date (random within last 30 days)
      const orderDate = new Date();
      orderDate.setDate(now.getDate() - Math.floor(Math.random() * 28));
      orderDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      
      // Select 1 to 3 items
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const orderItems: OrderItem[] = [];
      let subtotal = 0;
      
      for (let j = 0; j < itemsCount; j++) {
        const prod = MOCK_PRODUCTS[(i + j) % MOCK_PRODUCTS.length];
        const qty = Math.floor(Math.random() * 2) + 1;
        const variant = prod.variants[Math.floor(Math.random() * prod.variants.length)];
        
        orderItems.push({
          id: `item-${i}-${j}`,
          product_name: prod.name,
          product_slug: prod.slug,
          variant,
          quantity: qty,
          unit_price: prod.price * 100, // stored in paise
          image_url: prod.image
        });
        subtotal += (prod.price * 100) * qty;
      }
      
      const shipping = subtotal > 300000 ? 0 : 15000; // Free shipping over ₹3,000
      const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.1) : 0; // 10% discount sometimes
      const total = subtotal + shipping - discount;
      
      // Decide statuses
      let status: OrderStatus = statuses[i % statuses.length];
      let pStatus: PaymentStatus = 'Paid';
      
      if (status === 'Pending') {
        pStatus = Math.random() > 0.5 ? 'Pending' : 'Paid';
      } else if (status === 'Cancelled') {
        pStatus = Math.random() > 0.5 ? 'Refunded' : 'Pending';
      }
      
      // Vertical timeline setup
      const timeline: TimelineStep[] = [
        { status: 'Order Placed', date: orderDate.toLocaleString(), description: 'Order was successfully submitted by the customer.', completed: true },
        { status: 'Payment Verification', date: orderDate.toLocaleString(), description: pStatus === 'Paid' ? 'Payment was successfully captured.' : 'Payment is pending verification.', completed: pStatus === 'Paid' }
      ];
      
      let tracking_number = '';
      
      if (status === 'Processing' || status === 'Shipped' || status === 'Delivered') {
        const procDate = new Date(orderDate);
        procDate.setHours(procDate.getHours() + 4);
        timeline.push({ status: 'Processing', date: procDate.toLocaleString(), description: 'Order is packed and ready for dispatch.', completed: true });
      }
      
      if (status === 'Shipped' || status === 'Delivered') {
        const shipDate = new Date(orderDate);
        shipDate.setDate(shipDate.getDate() + 1);
        tracking_number = `STK-TRK-${8763428 + i}`;
        timeline.push({ status: 'Shipped', date: shipDate.toLocaleString(), description: `Dispatched via BlueDart. Tracking ID: ${tracking_number}`, completed: true });
      }
      
      if (status === 'Delivered') {
        const delDate = new Date(orderDate);
        delDate.setDate(delDate.getDate() + 3);
        timeline.push({ status: 'Delivered', date: delDate.toLocaleString(), description: 'Package was signed and delivered.', completed: true });
      }
      
      if (status === 'Cancelled') {
        const cancelDate = new Date(orderDate);
        cancelDate.setHours(cancelDate.getHours() + 2);
        timeline.push({ status: 'Cancelled', date: cancelDate.toLocaleString(), description: 'Order was cancelled by the administrator.', completed: true });
        if (pStatus === 'Refunded') {
          timeline.push({ status: 'Refund Issued', date: cancelDate.toLocaleString(), description: 'Refund of full order amount was processed back to original source.', completed: true });
        }
      }
      
      list.push({
        id: `ord-${baseOrderNum}`,
        order_number: `STK-ORD-${baseOrderNum}`,
        customer_name: cust.name,
        customer_email: cust.email,
        customer_phone: cust.phone,
        customer_address: cust.address,
        map_pin_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cust.address)}`,
        created_at: orderDate.toISOString(),
        status,
        payment_status: pStatus,
        subtotal,
        shipping,
        discount,
        total,
        items: orderItems,
        timeline,
        notes: i % 4 === 0 ? 'Customer requested eco-friendly packaging.' : '',
        tracking_number: tracking_number || undefined
      });
      
      baseOrderNum++;
    }
    
    // Sort newest first
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Bootstrap data loading
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Query orders table in Supabase
        const { data: dbOrders, error } = await supabase
          .from('orders')
          .select('*, order_items(*)');
          
        if (error) {
          console.warn('Supabase fetch failed, falling back to mock orders:', error.message);
        }
        
        // If DB has data, we can use it. Since it has 0 rows, we use mock orders!
        if (dbOrders && dbOrders.length > 0) {
          // Parse columns from DB schema
          const parsed: Order[] = dbOrders.map((o: any) => {
            const itemsList: OrderItem[] = (o.order_items || []).map((i: any) => ({
              id: i.id,
              product_name: i.product_name,
              product_slug: i.product_slug,
              variant: i.variant || 'Standard',
              quantity: i.quantity || 1,
              unit_price: i.unit_price || o.total,
              image_url: i.image_url || '/images/tshirt-black.png'
            }));
            
            return {
              id: o.id,
              order_number: o.order_number || `STK-ORD-${o.id.slice(0, 4).toUpperCase()}`,
              customer_name: 'Customer Name',
              customer_email: 'customer@gmail.com',
              customer_phone: '+91 99000 11000',
              customer_address: 'Shipping address not provided',
              map_pin_url: '#',
              created_at: o.created_at,
              status: (o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Pending') as OrderStatus,
              payment_status: 'Paid',
              subtotal: o.subtotal || o.total,
              shipping: o.shipping || 0,
              discount: o.discount || 0,
              total: o.total,
              items: itemsList,
              timeline: [
                { status: 'Order Placed', date: new Date(o.created_at).toLocaleString(), description: 'Submitted.', completed: true }
              ],
              notes: o.notes || ''
            };
          });
          setOrders(parsed);
        } else {
          // Check if mock orders are cached in local storage for persistency
          const cached = localStorage.getItem('stoky_mock_orders');
          if (cached) {
            setOrders(JSON.parse(cached));
          } else {
            const list = generateMockOrders();
            setOrders(list);
            localStorage.setItem('stoky_mock_orders', JSON.stringify(list));
          }
        }
      } catch (e) {
        console.error(e);
        const list = generateMockOrders();
        setOrders(list);
      } finally {
        setLoading(false);
      }
    }
    
    if (user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin]);

  // Sync back to localstorage when changes occur
  const saveOrdersState = (updatedList: Order[]) => {
    setOrders(updatedList);
    localStorage.setItem('stoky_mock_orders', JSON.stringify(updatedList));
  };

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Tab Status Filter
      if (activeTab !== 'All' && o.status !== activeTab) {
        return false;
      }
      
      // 2. Search Text (Order Number, Customer Name, or Email)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNum = o.order_number.toLowerCase().includes(query);
        const matchesName = o.customer_name.toLowerCase().includes(query);
        const matchesEmail = o.customer_email.toLowerCase().includes(query);
        if (!matchesNum && !matchesName && !matchesEmail) {
          return false;
        }
      }
      
      // 3. Date Range Filter
      if (dateFilter) {
        const oDate = new Date(o.created_at).toISOString().split('T')[0];
        if (oDate !== dateFilter) {
          return false;
        }
      }
      
      return true;
    });
  }, [orders, activeTab, searchQuery, dateFilter]);

  // Tab Badge count calculations
  const tabCounts = useMemo(() => {
    const counts = {
      All: orders.length,
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0
    };
    
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    
    return counts;
  }, [orders]);

  // CSV Exporter handler
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      showToast('No orders to export', 'error');
      return;
    }
    
    const headers = ['Order #', 'Customer Name', 'Email', 'Phone', 'Date', 'Items Count', 'Total (INR)', 'Payment Status', 'Fulfillment Status'];
    const rows = filteredOrders.map((o) => [
      o.order_number,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      new Date(o.created_at).toLocaleDateString(),
      o.items.reduce((sum, item) => sum + item.quantity, 0),
      (o.total / 100).toFixed(2),
      o.payment_status,
      o.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `STOKY_Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Successfully exported ${filteredOrders.length} orders!`);
  };

  // Open Detail Page Sub-view
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumberInput(order.tracking_number || '');
    setAdminNotesInput(order.notes || '');
  };

  // active detail actions
  const handleMarkAsShipped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!trackingNumberInput.trim()) {
      showToast('Please enter a tracking number', 'error');
      return;
    }
    
    const updated = orders.map((o) => {
      if (o.id === selectedOrder.id) {
        const newTimeline = [...o.timeline];
        newTimeline.push({
          status: 'Shipped',
          date: new Date().toLocaleString(),
          description: `Dispatched via BlueDart. Tracking ID: ${trackingNumberInput}`,
          completed: true
        });
        
        const updatedOrder: Order = {
          ...o,
          status: 'Shipped',
          tracking_number: trackingNumberInput,
          timeline: newTimeline
        };
        
        setSelectedOrder(updatedOrder);
        return updatedOrder;
      }
      return o;
    });
    
    saveOrdersState(updated);
    showToast(`Order marked as Shipped. Tracking ID: ${trackingNumberInput}`);
  };

  const handleIssueRefund = () => {
    if (!selectedOrder) return;
    
    const updated = orders.map((o) => {
      if (o.id === selectedOrder.id) {
        const newTimeline = [...o.timeline];
        newTimeline.push({
          status: 'Refund Processed',
          date: new Date().toLocaleString(),
          description: 'A refund of full order amount was processed back to original source.',
          completed: true
        });
        
        const updatedOrder: Order = {
          ...o,
          payment_status: 'Refunded',
          status: 'Cancelled', // Refunding cancels order if not done
          timeline: newTimeline
        };
        
        setSelectedOrder(updatedOrder);
        return updatedOrder;
      }
      return o;
    });
    
    saveOrdersState(updated);
    showToast('Payment refund initiated successfully.');
  };

  const handleCancelOrder = () => {
    if (!selectedOrder) return;
    
    const updated = orders.map((o) => {
      if (o.id === selectedOrder.id) {
        const newTimeline = [...o.timeline];
        newTimeline.push({
          status: 'Cancelled',
          date: new Date().toLocaleString(),
          description: 'Order was cancelled by the administrator.',
          completed: true
        });
        
        const updatedOrder: Order = {
          ...o,
          status: 'Cancelled',
          timeline: newTimeline
        };
        
        setSelectedOrder(updatedOrder);
        return updatedOrder;
      }
      return o;
    });
    
    saveOrdersState(updated);
    showToast('Order cancelled successfully.', 'error');
  };

  const handleSaveNotes = () => {
    if (!selectedOrder) return;
    
    const updated = orders.map((o) => {
      if (o.id === selectedOrder.id) {
        const updatedOrder = {
          ...o,
          notes: adminNotesInput
        };
        setSelectedOrder(updatedOrder);
        return updatedOrder;
      }
      return o;
    });
    
    saveOrdersState(updated);
    showToast('Admin notes saved successfully!');
  };

  const formatPrice = (paise: number) => {
    return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

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
    <div className="min-h-screen bg-black overflow-hidden selection:bg-white/20 selection:text-white grain">
      <Navbar />
      
      <main className={styles.container}>
        {!selectedOrder ? (
          /* ═══════════════════════════════════════════════════════════
             1. Orders list view
             ═══════════════════════════════════════════════════════════ */
          <>
            {/* Top Bar */}
            <div className={styles.topBar}>
              <div className={styles.headingArea}>
                <h1>Orders Management</h1>
                <div className={styles.subHeading}>Monitor customer fulfillments, track payments, and verify refunds</div>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabsContainer}>
              {(['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  <span className={styles.countBadge}>{tabCounts[tab]}</span>
                </button>
              ))}
            </div>

            {/* Filters Row */}
            <div className={styles.filterRow}>
              {/* Search */}
              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.603Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by order ID, customer name, or email..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Date Filter */}
              <input
                type="date"
                className={styles.dateInput}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />

              {/* Export CSV */}
              <button className={styles.exportButton} onClick={handleExportCSV}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export CSV
              </button>
            </div>

            {/* Orders Table */}
            <div className={styles.tableContainer}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '64px', color: 'rgba(255,255,255,0.35)' }}>
                  Loading catalog transactions...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  No orders found matching the filter query.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Fulfillment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
                      const totalQty = o.items.reduce((sum, item) => sum + item.quantity, 0);
                      
                      // Payment style badge
                      let pClass = styles.pendingPayment;
                      if (o.payment_status === 'Paid') pClass = styles.paid;
                      if (o.payment_status === 'Refunded') pClass = styles.refunded;
                      
                      // Fulfillment style badge
                      let fClass = styles.statusPending;
                      if (o.status === 'Processing') fClass = styles.statusProcessing;
                      if (o.status === 'Shipped') fClass = styles.statusShipped;
                      if (o.status === 'Delivered') fClass = styles.statusDelivered;
                      if (o.status === 'Cancelled') fClass = styles.statusCancelled;
                      
                      return (
                        <tr key={o.id}>
                          <td className={styles.orderNum}>{o.order_number}</td>
                          <td>
                            <div className={styles.customerInfo}>
                              <span className={styles.customerName}>{o.customer_name}</span>
                              <span className={styles.customerEmail}>{o.customer_email}</span>
                            </div>
                          </td>
                          <td>{new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td>{totalQty} {totalQty === 1 ? 'item' : 'items'}</td>
                          <td>{formatPrice(o.total)}</td>
                          <td>
                            <span className={`${styles.badge} ${pClass}`}>
                              <span className={styles.badgeDot} />
                              {o.payment_status}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${fClass}`}>
                              <span className={styles.badgeDot} />
                              {o.status}
                            </span>
                          </td>
                          <td>
                            <button className={styles.viewBtn} onClick={() => handleViewDetails(o)}>
                              View
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
             2. Order detail page (Sub-view)
             ═══════════════════════════════════════════════════════════ */
          <>
            {/* Back Button */}
            <button className={styles.backButton} onClick={() => setSelectedOrder(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back to Orders
            </button>

            {/* Title Header */}
            <div className={styles.detailsHeader}>
              <div className={styles.detailsTitleBlock}>
                <h2>Order details: {selectedOrder.order_number}</h2>
                <div className={styles.detailsMetaRow}>
                  <span>Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span>•</span>
                  <div className={styles.detailsBadges}>
                    <span className={`${styles.badge} ${selectedOrder.payment_status === 'Paid' ? styles.paid : selectedOrder.payment_status === 'Refunded' ? styles.refunded : styles.pendingPayment}`}>
                      <span className={styles.badgeDot} />
                      Payment: {selectedOrder.payment_status}
                    </span>
                    <span className={`${styles.badge} ${selectedOrder.status === 'Delivered' ? styles.statusDelivered : selectedOrder.status === 'Shipped' ? styles.statusShipped : selectedOrder.status === 'Processing' ? styles.statusProcessing : selectedOrder.status === 'Cancelled' ? styles.statusCancelled : styles.statusPending}`}>
                      <span className={styles.badgeDot} />
                      Fulfillment: {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Split View Grid */}
            <div className={styles.detailsGrid}>
              {/* LEFT COLUMN: Customer Info Card & Timeline */}
              <div className={styles.leftCol}>
                {/* Customer Card */}
                <div className={styles.card}>
                  <div className={styles.cardTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px', color: '#c9a96e' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    Customer Details
                  </div>
                  <div className={styles.customerCardInfo}>
                    <div className={styles.infoGroup}>
                      <span className={styles.infoLabel}>Name</span>
                      <span className={styles.infoValue}>{selectedOrder.customer_name}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <span className={styles.infoLabel}>Email address</span>
                      <span className={styles.infoValue}>{selectedOrder.customer_email}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <span className={styles.infoLabel}>Phone number</span>
                      <span className={styles.infoValue}>{selectedOrder.customer_phone}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <span className={styles.infoLabel}>Shipping Address</span>
                      <span className={styles.infoValue} style={{ lineHeight: 1.4 }}>{selectedOrder.customer_address}</span>
                      <a href={selectedOrder.map_pin_url} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '14px', height: '14px' }}>
                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9.5 17 5.91 14.09 3 10 3 5.91 3 3 5.91 3 9.5c0 2.993 1.698 5.488 3.363 7.087.83.799 1.654 1.381 2.273 1.765.312.193.572.337.758.433.11.057.198.098.254.126l.024.011.006.003zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                </div>

                {/* Timeline Card */}
                <div className={styles.card}>
                  <div className={styles.cardTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px', color: '#c9a96e' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Order Timeline
                  </div>
                  <div className={styles.timeline}>
                    {selectedOrder.timeline.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`${styles.timelineStep} ${step.completed ? styles.timelineStepCompleted : ''} ${idx < selectedOrder.timeline.length - 1 && selectedOrder.timeline[idx+1].completed ? styles.timelineStepActive : ''}`}
                      >
                        <span className={`${styles.timelineDot} ${step.completed ? styles.timelineDotCompleted : ''}`} />
                        <div className={styles.timelineStepHeader}>
                          <span className={styles.timelineStepTitle}>{step.status}</span>
                          <span className={styles.timelineStepDate}>{step.date.split(',')[0]}</span>
                        </div>
                        <div className={styles.timelineStepDesc}>{step.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Items Table, Pricing Breakdowns, Active Actions, Notes */}
              <div className={styles.rightCol}>
                {/* Items details table */}
                <div className={styles.card}>
                  <div className={styles.cardTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px', color: '#c9a96e' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5h6.75" />
                    </svg>
                    Items Summary
                  </div>
                  <div>
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className={styles.itemRow}>
                        <div className={styles.thumbWrapper}>
                          <Image
                            src={item.image_url}
                            alt={item.product_name}
                            fill
                            sizes="60px"
                            className={styles.itemImg}
                          />
                        </div>
                        <div className={styles.itemMeta}>
                          <div className={styles.itemName}>{item.product_name}</div>
                          <div className={styles.itemVariant}>Variant: {item.variant}</div>
                        </div>
                        <div className={styles.itemPriceQty}>
                          <div className={styles.itemPrice}>{formatPrice(item.unit_price)}</div>
                          <div className={styles.itemQty}>Qty: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                    <div className={styles.breakdownRow}>
                      <span>Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className={styles.breakdownRow}>
                      <span>Shipping Fees</span>
                      <span>{selectedOrder.shipping === 0 ? 'Free' : formatPrice(selectedOrder.shipping)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className={`${styles.breakdownRow} ${styles.breakdownRowDiscount}`}>
                        <span>Store discount code (10% OFF)</span>
                        <span>-{formatPrice(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className={styles.breakdownTotal}>
                      <span>Total Invoice</span>
                      <span>{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Fulfillment Actions Card */}
                <div className={styles.card}>
                  <div className={styles.cardTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px', color: '#c9a96e' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A1.5 1.5 0 0 0 19.5 21l2.25-2.25a1.5 1.5 0 0 0 0-2.12l-5.83-5.83m-4.5 4.5V18m0-2.83 5.83-5.83m-5.83 5.83h2.83m2.17-2.17 5.83-5.83m-5.83 5.83V12m0-2.83 5.83-5.83m-5.83 5.83h2.83M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
                    </svg>
                    Fulfillment Controls
                  </div>
                  <div className={styles.actionsGrid}>
                    {/* Mark as Shipped Form */}
                    <div>
                      <label className={styles.formFieldLabel}>Mark Shipment</label>
                      <form className={styles.shippingActionRow} onSubmit={handleMarkAsShipped}>
                        <input
                          type="text"
                          placeholder="Enter BlueDart/Delhivery Tracking Code..."
                          className={styles.shippingInput}
                          value={trackingNumberInput}
                          onChange={(e) => setTrackingNumberInput(e.target.value)}
                          disabled={selectedOrder.status === 'Shipped' || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled'}
                        />
                        <button 
                          type="submit" 
                          className={styles.shipBtn}
                          disabled={selectedOrder.status === 'Shipped' || selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled'}
                        >
                          Mark as Shipped
                        </button>
                      </form>
                      {selectedOrder.tracking_number && (
                        <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                          Current active tracking ID: <strong style={{ color: '#ffffff' }}>{selectedOrder.tracking_number}</strong>
                        </div>
                      )}
                    </div>

                    {/* Issue Refund / Cancel Buttons */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                      <label className={styles.formFieldLabel} style={{ marginBottom: '12px' }}>Order Status Controls</label>
                      <div className={styles.actionButtonsRow}>
                        <button
                          className={`${styles.actionBtn} ${styles.refundBtn}`}
                          onClick={handleIssueRefund}
                          disabled={selectedOrder.payment_status === 'Refunded' || selectedOrder.status === 'Cancelled'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                          </svg>
                          Issue Refund
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.cancelBtn}`}
                          onClick={handleCancelOrder}
                          disabled={selectedOrder.status === 'Cancelled'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Text Area */}
                <div className={styles.card}>
                  <div className={styles.cardTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px', color: '#c9a96e' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.613a4.5 4.5 0 0 1-1.653 1.059L2.75 22.375l.7-2.385a4.5 4.5 0 0 1 1.059-1.653L16.862 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    Administrative Notes
                  </div>
                  <div className={styles.notesArea}>
                    <textarea
                      placeholder="Add system notes for this transaction (e.g. delivery preferences, customer history)..."
                      className={styles.textarea}
                      value={adminNotesInput}
                      onChange={(e) => setAdminNotesInput(e.target.value)}
                    />
                    <button className={styles.saveNotesBtn} onClick={handleSaveNotes}>
                      Save Notes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Toast Alert popup */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
