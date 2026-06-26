'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import styles from './settings.module.css';
import { supabase } from '@/lib/supabase';

export default function AdminSettingsPage() {
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

  // Form State
  const [storeName, setStoreName] = useState('STOKY2');
  const [supportEmail, setSupportEmail] = useState('support@stoky.co');
  const [currency, setCurrency] = useState('INR');
  const [taxRate, setTaxRate] = useState(18);
  const [maintenanceMode, setMaintenanceMode] = useState('Disabled');
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('announcements');

  // Announcements Tab State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [originalAnnouncements, setOriginalAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Slideshow Tab State
  const [slides, setSlides] = useState<any[]>([]);
  const [originalSlides, setOriginalSlides] = useState<any[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [slidesError, setSlidesError] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load announcements from database
  const loadAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setAnnouncements(data || []);
      setOriginalAnnouncements(data || []);
    } catch (err: any) {
      console.error('Failed to load announcements:', err);
      showToast('Failed to load announcements from database.', 'error');
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Load slides from database
  const loadSlides = async () => {
    setLoadingSlides(true);
    setSlidesError(false);
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSlides(data || []);
      setOriginalSlides(data || []);
    } catch (err: any) {
      console.error('Failed to load slides:', err);
      if (err?.code === '42P01') {
        setSlidesError(true);
      } else {
        showToast('Failed to load slides from database.', 'error');
      }
    } finally {
      setLoadingSlides(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'announcements') {
      loadAnnouncements();
    } else if (activeTab === 'slideshow') {
      loadSlides();
    }
  }, [activeTab]);

  const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleAddAnnouncement = () => {
    const newAnn = {
      id: generateUUID(),
      text: '',
      link_text: '',
      link_url: '',
      is_active: true,
      sort_order: announcements.length + 1
    };
    setAnnouncements([...announcements, newAnn]);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...announcements];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setAnnouncements(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === announcements.length - 1) return;
    const updated = [...announcements];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setAnnouncements(updated);
  };

  const handleFieldChange = (id: string, field: string, value: any) => {
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleSaveAnnouncements = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Determine deleted IDs
      const currentIds = announcements.map(a => a.id);
      const deletedIds = originalAnnouncements
        .filter(oa => !currentIds.includes(oa.id))
        .map(oa => oa.id);

      // 2. Perform deletions
      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('announcements')
          .delete()
          .in('id', deletedIds);

        if (deleteError) throw deleteError;
      }

      // 3. Perform upserts
      const upsertPayload = announcements.map((a, index) => ({
        id: a.id,
        text: a.text,
        link_text: a.link_text || '',
        link_url: a.link_url || '#',
        is_active: a.is_active,
        sort_order: index + 1
      }));

      if (upsertPayload.length > 0) {
        const { error: upsertError } = await supabase
          .from('announcements')
          .upsert(upsertPayload);

        if (upsertError) throw upsertError;
      }

      showToast('Announcements updated successfully!');
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Failed to save announcements. Full details:', {
        message: err?.message,
        details: err?.details,
        code: err?.code,
        hint: err?.hint,
        error: err
      });
      const errorMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      showToast(`Failed to save: ${errorMsg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSlide = (url = '/images/tshirt-black.png') => {
    const newSlide = {
      id: generateUUID(),
      image_url: url,
      sort_order: slides.length + 1
    };
    setSlides([...slides, newSlide]);
  };

  const handleDeleteSlide = (id: string) => {
    setSlides(slides.filter(s => s.id !== id));
  };

  const handleMoveSlideUp = (index: number) => {
    if (index === 0) return;
    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSlides(updated);
  };

  const handleMoveSlideDown = (index: number) => {
    if (index === slides.length - 1) return;
    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSlides(updated);
  };

  const handleSlideUrlChange = (id: string, value: string) => {
    setSlides(slides.map(s => s.id === id ? { ...s, image_url: value } : s));
  };

  const handleSaveSlides = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Determine deleted IDs
      const currentIds = slides.map(s => s.id);
      const deletedIds = originalSlides
        .filter(os => !currentIds.includes(os.id))
        .map(os => os.id);

      // 2. Perform deletions
      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('hero_slides')
          .delete()
          .in('id', deletedIds);

        if (deleteError) throw deleteError;
      }

      // 3. Perform upserts
      const upsertPayload = slides.map((s, index) => ({
        id: s.id,
        image_url: s.image_url,
        sort_order: index + 1
      }));

      if (upsertPayload.length > 0) {
        const { error: upsertError } = await supabase
          .from('hero_slides')
          .upsert(upsertPayload);

        if (upsertError) throw upsertError;
      }

      showToast('Hero slideshow updated successfully!');
      await loadSlides();
    } catch (err: any) {
      console.error('Failed to save slides:', err);
      showToast(`Failed to save: ${err.message || err}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call saving settings
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setIsSaving(false);
    showToast('Store settings updated successfully!');
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

  // Get Admin Initials
  const adminName = user.user_metadata?.full_name || 'Admin Surya';
  const adminEmail = user.email || 'garapatisurya07@gmail.com';
  const adminInitials = adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-black overflow-hidden selection:bg-white/20 selection:text-white grain">
      <Navbar />
      
      <main className={styles.container}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.headingArea}>
            <h1>Settings</h1>
            <div className={styles.subHeading}>Manage your shop settings and system parameters</div>
          </div>
        </div>

        {/* Sidebar & content grid */}
        <div className={styles.grid}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <button 
              className={`${styles.navItem} ${activeTab === 'general' ? styles.activeNavItem : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.39.43 1.007.093 1.45l-.526.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.336.444.296 1.06-.093 1.45l-.774.773a1.125 1.125 0 0 1-1.449.093l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.443.336-1.06.296-1.449-.093l-.773-.774a1.125 1.125 0 0 1-.093-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.527-.738a1.125 1.125 0 0 1 .093-1.45l.773-.773a1.125 1.125 0 0 1 1.449-.093l.738.527c.35.25.806.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              General Settings
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.activeNavItem : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              Admin Profile
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'announcements' ? styles.activeNavItem : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
              Announcements
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'slideshow' ? styles.activeNavItem : ''}`}
              onClick={() => setActiveTab('slideshow')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
              </svg>
              Hero Slideshow
            </button>
          </aside>

          {/* Main settings panel */}
          <div className={styles.panel}>
            {activeTab === 'general' && (
              <form onSubmit={handleSave}>
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px', color: '#8b5cf6' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                    </svg>
                    Store Configuration
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Store Name</label>
                      <input 
                        type="text" 
                        value={storeName} 
                        onChange={(e) => setStoreName(e.target.value)} 
                        className={styles.input} 
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Support Contact Email</label>
                      <input 
                        type="email" 
                        value={supportEmail} 
                        onChange={(e) => setSupportEmail(e.target.value)} 
                        className={styles.input}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Currency Unit</label>
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)} 
                        className={styles.select}
                      >
                        <option value="INR">INR (₹) — Indian Rupee</option>
                        <option value="USD">USD ($) — US Dollar</option>
                        <option value="EUR">EUR (€) — Euro</option>
                        <option value="GBP">GBP (£) — British Pound</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Standard Tax Rate (%)</label>
                      <input 
                        type="number" 
                        value={taxRate} 
                        onChange={(e) => setTaxRate(Number(e.target.value))} 
                        className={styles.input}
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px', color: '#8b5cf6' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                    </svg>
                    System Status
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Maintenance Mode</label>
                    <select 
                      value={maintenanceMode} 
                      onChange={(e) => setMaintenanceMode(e.target.value)} 
                      className={styles.select}
                    >
                      <option value="Disabled">Disabled (Storefront Active)</option>
                      <option value="Enabled">Enabled (Maintenance Splash Page)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button 
                    type="submit" 
                    className={styles.saveButton}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px', color: '#8b5cf6' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    Administrator Details
                  </div>

                  <div className={styles.profileHeader}>
                    <div className={styles.avatar}>
                      {user.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt={adminName} 
                          className={styles.avatarImg}
                        />
                      ) : (
                        adminInitials
                      )}
                    </div>
                    <div className={styles.profileInfo}>
                      <h3>{adminName}</h3>
                      <p>{adminEmail}</p>
                      <span className={styles.badge}>Super Administrator</span>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Account ID</label>
                      <input 
                        type="text" 
                        value={user.id} 
                        className={styles.input} 
                        disabled 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Role Privileges</label>
                      <input 
                        type="text" 
                        value="Full Access (All Permissions)" 
                        className={styles.input} 
                        disabled 
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>OAuth Identity Provider</label>
                      <input 
                        type="text" 
                        value={user.app_metadata?.provider ? user.app_metadata.provider.toUpperCase() : 'EMAIL & PASSWORD'} 
                        className={styles.input} 
                        disabled 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Last Logged In</label>
                      <input 
                        type="text" 
                        value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'} 
                        className={styles.input} 
                        disabled 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <form onSubmit={handleSaveAnnouncements}>
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px', color: '#8b5cf6' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                    Announcement Bar Settings
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '24px', lineHeight: '1.5' }}>
                    Control the rotating messages displayed in the announcement bar at the top of the storefront. Active announcements are rotated automatically. If no active announcements exist, the bar is hidden.
                  </p>

                  {loadingAnnouncements ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'rgba(255, 255, 255, 0.3)' }}>
                      <span>Loading announcements...</span>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'rgba(255, 255, 255, 0.3)' }}>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13.5px' }}>No announcements defined yet.</p>
                      <button type="button" onClick={handleAddAnnouncement} className={styles.addBtn} style={{ margin: '0 auto' }}>
                        Create First Announcement
                      </button>
                    </div>
                  ) : (
                    <div>
                      {announcements.map((a, index) => (
                        <div key={a.id} className={styles.announcementCard}>
                          <div className={styles.announcementCardHeader}>
                            <span className={styles.announcementTitle}>
                              Announcement #{index + 1}
                            </span>
                            <div className={styles.announcementControls}>
                              {/* Move Up */}
                              <button
                                type="button"
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className={styles.iconButton}
                                title="Move Up"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                              </button>
                              
                              {/* Move Down */}
                              <button
                                type="button"
                                onClick={() => handleMoveDown(index)}
                                disabled={index === announcements.length - 1}
                                className={styles.iconButton}
                                title="Move Down"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteAnnouncement(a.id)}
                                className={`${styles.iconButton} ${styles.deleteBtn}`}
                                title="Delete"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Message input */}
                          <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                            <label className={styles.label}>Message Text *</label>
                            <input
                              type="text"
                              required
                              value={a.text}
                              placeholder="e.g. Up to 50% off Sale ends Sunday."
                              onChange={(e) => handleFieldChange(a.id, 'text', e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          {/* Link Row */}
                          <div className={styles.formRow} style={{ gap: '16px' }}>
                            <div className={styles.formGroup} style={{ marginBottom: '0' }}>
                              <label className={styles.label}>Link Label (Optional)</label>
                              <input
                                type="text"
                                value={a.link_text || ''}
                                placeholder="e.g. Shop Sale"
                                onChange={(e) => handleFieldChange(a.id, 'link_text', e.target.value)}
                                className={styles.input}
                              />
                            </div>
                            <div className={styles.formGroup} style={{ marginBottom: '0' }}>
                              <label className={styles.label}>Link Destination (Optional)</label>
                              <input
                                type="text"
                                value={a.link_url || ''}
                                placeholder="e.g. #collection or /sales"
                                onChange={(e) => handleFieldChange(a.id, 'link_url', e.target.value)}
                                className={styles.input}
                              />
                            </div>
                          </div>

                          {/* Toggle Active Switch */}
                          <div style={{ marginTop: '4px' }}>
                            <label className={styles.activeToggle}>
                              <input
                                type="checkbox"
                                checked={a.is_active}
                                onChange={(e) => handleFieldChange(a.id, 'is_active', e.target.checked)}
                              />
                              <span style={{ fontSize: '13px', fontWeight: 500, color: a.is_active ? '#8b5cf6' : 'rgba(255, 255, 255, 0.4)' }}>
                                {a.is_active ? 'Active (Displaying in rotation)' : 'Inactive (Hidden)'}
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}

                      {/* Add button */}
                      <div className={styles.announcementAddRow}>
                        <button type="button" onClick={handleAddAnnouncement} className={styles.addBtn}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          Add Announcement
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  <button 
                    type="submit" 
                    className={styles.saveButton}
                    disabled={isSaving || loadingAnnouncements}
                  >
                    {isSaving ? 'Saving Announcements...' : 'Save Announcements'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'slideshow' && (
              <form onSubmit={handleSaveSlides}>
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px', color: '#8b5cf6' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
                    </svg>
                    Hero Slideshow Configuration
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '24px', lineHeight: '1.5' }}>
                    Manage the slides displayed in the main Hero slideshow on the homepage. You can choose from pre-defined local T-Shirt images, or insert custom image URLs.
                  </p>

                  {slidesError ? (
                    <div style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.04)', color: '#f87171', fontSize: '14px', lineHeight: '1.6' }}>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                        </svg>
                        Supabase Table Not Found
                      </div>
                      <p style={{ margin: '0 0 16px 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                        The <code>hero_slides</code> table does not exist in your Supabase database yet. Run the following SQL query in your Supabase dashboard SQL Editor to create it:
                      </p>
                      <pre style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', color: '#e5e7eb', fontFamily: 'monospace', margin: '0 0 16px 0' }}>
{`CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read hero_slides for anyone" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Allow write hero_slides for admin" ON public.hero_slides FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'garapatisurya07@gmail.com');`}
                      </pre>
                      <button 
                        type="button" 
                        onClick={loadSlides} 
                        className={styles.addBtn}
                        style={{ border: '1px solid rgba(255, 255, 255, 0.15)', background: 'transparent', color: '#ffffff' }}
                      >
                        Retry Connection
                      </button>
                    </div>
                  ) : loadingSlides ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'rgba(255, 255, 255, 0.3)' }}>
                      <span>Loading hero slides...</span>
                    </div>
                  ) : slides.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'rgba(255, 255, 255, 0.3)' }}>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13.5px' }}>No slides defined yet.</p>
                      <button type="button" onClick={() => handleAddSlide('/images/tshirt-black.png')} className={styles.addBtn} style={{ margin: '0 auto' }}>
                        Create First Slide
                      </button>
                    </div>
                  ) : (
                    <div>
                      {slides.map((s, index) => {
                        const isPreset = ['/images/tshirt-black.png', '/images/tshirt-white.png', '/images/tshirt-grey.png', '/images/tshirt-navy.png', '/images/tshirt-olive.png', '/images/tshirt-burgundy.png'].includes(s.image_url);
                        return (
                          <div key={s.id} className={styles.announcementCard}>
                            <div className={styles.announcementCardHeader}>
                              <span className={styles.announcementTitle}>
                                Slide #{index + 1}
                              </span>
                              <div className={styles.announcementControls}>
                                {/* Move Up */}
                                <button
                                  type="button"
                                  onClick={() => handleMoveSlideUp(index)}
                                  disabled={index === 0}
                                  className={styles.iconButton}
                                  title="Move Up"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15"></polyline>
                                  </svg>
                                </button>
                                
                                {/* Move Down */}
                                <button
                                  type="button"
                                  onClick={() => handleMoveSlideDown(index)}
                                  disabled={index === slides.length - 1}
                                  className={styles.iconButton}
                                  title="Move Down"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                  </svg>
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSlide(s.id)}
                                  className={`${styles.iconButton} ${styles.deleteBtn}`}
                                  title="Delete"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Image Selector / Input */}
                            <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                              <label className={styles.label}>Select Slide Image *</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <select
                                  className={styles.select}
                                  value={isPreset ? s.image_url : 'custom'}
                                  onChange={(e) => {
                                    if (e.target.value !== 'custom') {
                                      handleSlideUrlChange(s.id, e.target.value);
                                    } else {
                                      handleSlideUrlChange(s.id, '');
                                    }
                                  }}
                                >
                                  <option value="/images/tshirt-black.png">Black T-Shirt (Local Preset)</option>
                                  <option value="/images/tshirt-white.png">White T-Shirt (Local Preset)</option>
                                  <option value="/images/tshirt-grey.png">Grey T-Shirt (Local Preset)</option>
                                  <option value="/images/tshirt-navy.png">Navy T-Shirt (Local Preset)</option>
                                  <option value="/images/tshirt-olive.png">Olive T-Shirt (Local Preset)</option>
                                  <option value="/images/tshirt-burgundy.png">Burgundy T-Shirt (Local Preset)</option>
                                  <option value="custom">Custom Image URL...</option>
                                </select>

                                {!isPreset && (
                                  <input
                                    type="text"
                                    required
                                    value={s.image_url}
                                    placeholder="e.g. https://example.com/image.jpg"
                                    onChange={(e) => handleSlideUrlChange(s.id, e.target.value)}
                                    className={styles.input}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Quick Preview Thumbnail */}
                            {s.image_url && (
                              <div style={{ marginTop: '12px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden', width: '120px', height: '120px', position: 'relative', background: '#111' }}>
                                <img
                                  src={s.image_url}
                                  alt="Slide Preview"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add button */}
                      <div className={styles.announcementAddRow}>
                        <button type="button" onClick={() => handleAddSlide('/images/tshirt-black.png')} className={styles.addBtn}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          Add Slide Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  <button 
                    type="submit" 
                    className={styles.saveButton}
                    disabled={isSaving || loadingSlides || slidesError}
                  >
                    {isSaving ? 'Saving Slideshow...' : 'Save Slideshow'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Toast alert */}
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
