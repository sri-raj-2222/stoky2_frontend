'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import styles from './products.module.css';
import { Product, CategoryType, StatusType, SortOption } from './types';

// Predefined colors for swatches
const SWATCH_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Charcoal', hex: '#3a3a3a' },
  { name: 'Navy', hex: '#1a2744' },
  { name: 'Olive', hex: '#4a5d3a' },
  { name: 'Burgundy', hex: '#6b2137' },
  { name: 'Amber', hex: '#c9a96e' },
  { name: 'Grey', hex: '#999999' },
];

export default function AdminProductsPage() {
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
  }, [user, authLoading, router]);

  // Page States
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('Newest');

  // Selection Checkboxes
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Drawer Panel State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCompareAtPrice, setFormCompareAtPrice] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<CategoryType>('Classic Fit');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState('');
  const [formStock, setFormStock] = useState<number>(0);
  const [formSku, setFormSku] = useState('');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [formSizeInput, setFormSizeInput] = useState('');
  const [formColors, setFormColors] = useState<string[]>(['#000000']);
  const [customColor, setCustomColor] = useState('#ff0000');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<StatusType>('Active');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Generate mock items to reach exactly 248
  const buildProductCatalog = (dbProducts: Product[]): Product[] => {
    // Basic mock names and descriptions
    const mockNames = [
      'Classic Linen Shirt', 'Oversized Knit Sweater', 'Tailored Denim Jacket', 
      'Structured Blazer', 'Active Fleece Joggers', 'Silk Wrap Dress', 
      'Wool Blend Overcoat', 'Slim Fit Chinos', 'Ribbed Crop Top', 
      'Leather Chelsea Boots', 'Canvas Tote Bag', 'Minimalist Belt',
      'Puffer Vest', 'Pleated Trousers', 'Mercerized Cotton Tee',
      'Breton Stripe Shirt', 'Relaxed Cargo Pants', 'Cashmere Beanie'
    ];

    const mockImages = [
      '/images/tshirt-black.png',
      '/images/tshirt-white.png',
      '/images/tshirt-olive.png',
      '/images/tshirt-navy.png',
      '/images/tshirt-burgundy.png',
      '/images/tshirt-grey.png'
    ];

    const categories: CategoryType[] = ['Classic Fit', 'Oversized Fit', 'Heavyweight Tee', 'Graphic Tee', 'Polo Tee', 'Henley Tee', 'V-Neck Tee', 'Long Sleeve'];
    const statuses: StatusType[] = ['Active', 'Draft', 'Archived'];

    // Combine database products
    const combined = [...dbProducts];

    // Seed mock products to fill remaining slots up to 248
    let idCounter = 10000;
    while (combined.length < 248) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const nameBase = mockNames[Math.floor(Math.random() * mockNames.length)];
      const colorOption = SWATCH_COLORS[Math.floor(Math.random() * SWATCH_COLORS.length)];
      const name = `${nameBase} — ${colorOption.name}`;
      
      const price = [1299, 1499, 1599, 1899, 2499, 3499, 4999][Math.floor(Math.random() * 7)];
      const comparePrice = Math.random() > 0.5 ? Math.round(price * 1.3) : 0;
      
      // Stock can be low for testing (stock < 5)
      const stock = Math.floor(Math.random() * 85); 

      // Create a slug
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Create realistic mock product
      combined.push({
        id: idCounter++,
        name,
        price,
        compare_at_price: comparePrice,
        color: colorOption.hex,
        image: mockImages[Math.floor(Math.random() * mockImages.length)],
        slug,
        category,
        status: statuses[Math.floor(Math.random() * 1.8)], // mostly Active & Draft
        stock,
        sku: `STK-${category.slice(0, 2).toUpperCase()}-${idCounter}`,
        tags: [category.toLowerCase(), 'essential', 'apparel'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [colorOption.hex],
        images: [mockImages[Math.floor(Math.random() * mockImages.length)]],
        description: `Premium essential clothing item designed for comfort and durability. Crafted with long-staple cotton, this features a clean outline suitable for casual or smart-casual wear.`
      });
    }

    return combined;
  };

  // Fetch products from database
  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        showToast('Error loading from Supabase. Using mock fallback.', 'error');
      }

      const dbList: Product[] = (data || []).map((p: any) => {
        // Retrieve local storage fallback fields
        const localExt = typeof window !== 'undefined' ? localStorage.getItem(`prod_ext_${p.slug}`) : null;
        const ext = localExt ? JSON.parse(localExt) : {};

        return {
          id: p.id,
          name: p.name,
          price: p.price,
          color: p.color || '#000000',
          image: p.image || '/images/tshirt-black.png',
          slug: p.slug,
          created_at: p.created_at,
          // Merge extended schema properties
          description: p.description ?? ext.description ?? 'Premium heavyweight tee.',
          compare_at_price: p.compare_at_price ?? ext.compare_at_price ?? 0,
          category: p.category ?? ext.category ?? 'Men',
          status: p.status ?? ext.status ?? 'Active',
          stock: p.stock ?? ext.stock ?? 12,
          sku: p.sku ?? ext.sku ?? `STK-TEE-${p.id}`,
          tags: p.tags ?? ext.tags ?? ['tee', 'cotton'],
          sizes: p.sizes ?? ext.sizes ?? ['S', 'M', 'L', 'XL'],
          colors: p.colors ?? ext.colors ?? [p.color || '#000000'],
          images: p.images ?? ext.images ?? [p.image || '/images/tshirt-black.png']
        };
      });

      // Build catalog up to 248
      const fullCatalog = buildProductCatalog(dbList);
      setProducts(fullCatalog);
    } catch (e: any) {
      console.error(e);
      showToast('Unexpected diagnostic error.', 'error');
      setProducts(buildProductCatalog([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter and Sort logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Newest') {
      // Real database products (id < 10000) go first, then by id descending
      return b.id - a.id;
    }
    if (sortBy === 'Price') {
      return a.price - b.price;
    }
    if (sortBy === 'Stock') {
      return (a.stock ?? 0) - (b.stock ?? 0);
    }
    return 0;
  });

  // Checkbox selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Action: Add Button clicked
  const handleOpenAddDrawer = () => {
    setIsEditing(false);
    setCurrentProductId(null);
    
    // Reset Form Fields
    setFormName('');
    setFormDescription('');
    setFormPrice(0);
    setFormCompareAtPrice(0);
    setFormCategory('Classic Fit');
    setFormTags(['new', 'clothing']);
    setFormTagInput('');
    setFormStock(15);
    setFormSku('');
    setFormSizes(['S', 'M', 'L', 'XL']);
    setFormSizeInput('');
    setFormColors(['#000000']);
    setFormImages(['/images/tshirt-black.png']);
    setFormStatus('Active');

    setIsDrawerOpen(true);
  };

  // Action: Edit Button clicked
  const handleOpenEditDrawer = (product: Product) => {
    setIsEditing(true);
    setCurrentProductId(product.id);

    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormPrice(product.price);
    setFormCompareAtPrice(product.compare_at_price || 0);
    setFormCategory((product.category as CategoryType) || 'Classic Fit');
    setFormTags(product.tags || []);
    setFormStock(product.stock ?? 0);
    setFormSku(product.sku || '');
    setFormSizes(product.sizes || []);
    setFormColors(product.colors || []);
    setFormImages(product.images || [product.image]);
    setFormStatus((product.status as StatusType) || 'Active');

    setIsDrawerOpen(true);
  };

  // Action: Delete Product
  const handleDeleteProduct = async (id: number, slug: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      // If it's a database product (mock products have ID >= 10000)
      if (id < 10000) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        
        // Remove local storage fallback
        localStorage.removeItem(`prod_ext_${slug}`);
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast('Product deleted successfully');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    }
  };

  // Chip logic: add Tag
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ' ' || e.key === ',') && formTagInput.trim()) {
      e.preventDefault();
      const cleaned = formTagInput.trim().toLowerCase().replace(/,/g, '');
      if (cleaned && !formTags.includes(cleaned)) {
        setFormTags((prev) => [...prev, cleaned]);
      }
      setFormTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Chip logic: add Size
  const handleAddSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formSizeInput.trim()) {
      e.preventDefault();
      const size = formSizeInput.trim().toUpperCase();
      if (size && !formSizes.includes(size)) {
        setFormSizes((prev) => [...prev, size]);
      }
      setFormSizeInput('');
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setFormSizes((prev) => prev.filter((s) => s !== sizeToRemove));
  };

  // Color Swatch pick logic
  const handleToggleColorSwatch = (hex: string) => {
    setFormColors((prev) => 
      prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]
    );
  };

  const handleAddCustomColor = () => {
    if (!formColors.includes(customColor)) {
      setFormColors((prev) => [...prev, customColor]);
    }
  };

  // Image upload handling
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImageUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Create local URL for presentation
      const objectUrl = URL.createObjectURL(file);
      newImageUrls.push(objectUrl);
    }

    setFormImages((prev) => [...prev, ...newImageUrls]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === formImages.length - 1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const updated = [...formImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setFormImages(updated);
  };

  // Submit Drawer Form (Save and Publish / Save Draft)
  const handleSaveProduct = async (statusOverride?: StatusType) => {
    if (!formName.trim() || formPrice <= 0) {
      showToast('Please enter a product name and valid price.', 'error');
      return;
    }

    const finalStatus = statusOverride || formStatus;
    const finalSlug = formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const finalImage = formImages[0] || '/images/tshirt-black.png';
    const finalColor = formColors[0] || '#000000';

    setLoading(true);

    try {
      // Assemble fully populated product model
      const productPayload: Omit<Product, 'id'> = {
        name: formName,
        price: formPrice,
        color: finalColor,
        image: finalImage,
        slug: finalSlug,
        description: formDescription,
        compare_at_price: formCompareAtPrice,
        category: formCategory,
        status: finalStatus,
        stock: formStock,
        sku: formSku || `STK-${formCategory.slice(0, 2).toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
        tags: formTags,
        sizes: formSizes,
        colors: formColors,
        images: formImages
      };

      if (isEditing && currentProductId !== null) {
        // EDIT ACTION
        if (currentProductId < 10000) {
          // DATABASE OPERATION
          // Try inserting/updating all fields. If PostgreSQL schema hasn't been altered, catch the error.
          const { error: fullUpdateError } = await supabase
            .from('products')
            .update(productPayload as any)
            .eq('id', currentProductId);

          if (fullUpdateError) {
            console.warn('DB extended properties update failed, falling back to local storage schema mapping.', fullUpdateError.message);
            
            // Try updating only base columns
            const { error: baseUpdateError } = await supabase
              .from('products')
              .update({
                name: formName,
                price: formPrice,
                color: finalColor,
                image: finalImage,
                slug: finalSlug
              })
              .eq('id', currentProductId);

            if (baseUpdateError) throw baseUpdateError;

            // Save details to localStorage fallback
            localStorage.setItem(`prod_ext_${finalSlug}`, JSON.stringify(productPayload));
          }
        } else {
          // If editing a mock product, we can just save details locally
          localStorage.setItem(`prod_ext_${finalSlug}`, JSON.stringify(productPayload));
        }

        // Update visual table state
        setProducts((prev) => 
          prev.map((p) => p.id === currentProductId ? { ...p, ...productPayload } : p)
        );
        showToast('Product updated successfully');
      } else {
        // ADD ACTION
        let newId = Math.floor(Math.random() * 10000) + 20000; // default mock ID

        // Try inserting to DB
        const { data, error: fullInsertError } = await supabase
          .from('products')
          .insert([productPayload as any])
          .select('id');

        if (fullInsertError) {
          console.warn('DB extended properties insert failed, falling back to local storage schema mapping.', fullInsertError.message);

          const { data: baseData, error: baseInsertError } = await supabase
            .from('products')
            .insert([{
              name: formName,
              price: formPrice,
              color: finalColor,
              image: finalImage,
              slug: finalSlug
            }])
            .select('id');

          if (baseInsertError) throw baseInsertError;
          
          if (baseData && baseData.length > 0) {
            newId = baseData[0].id;
          }
          
          // Save details to localStorage fallback
          localStorage.setItem(`prod_ext_${finalSlug}`, JSON.stringify(productPayload));
        } else if (data && data.length > 0) {
          newId = data[0].id;
        }

        const newProduct: Product = {
          id: newId,
          ...productPayload
        };

        // Push new product to the beginning of the list
        setProducts((prev) => [newProduct, ...prev]);
        showToast('Product created successfully');
      }

      setIsDrawerOpen(false);
      loadProducts(); // Reload to sync with db/localstorage mappings
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show checking permissions loader
  if (authLoading || !user || !isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000000', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <span>Checking permissions...</span>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <main className={styles.container}>
        {/* ── Top Bar ────────────────────────────────────────── */}
        <div className={styles.topBar}>
          <div className={styles.headingArea}>
            <h1>
              Products <span className={styles.productCount}>({products.length})</span>
            </h1>
          </div>
          <button onClick={handleOpenAddDrawer} className={styles.addButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Product
          </button>
        </div>

        {/* ── Filter Row ─────────────────────────────────────── */}
        <div className={styles.filterRow}>
          {/* Search input */}
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by name, SKU..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <select
            className={styles.selectFilter}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Classic Fit">Classic Fit</option>
            <option value="Oversized Fit">Oversized Fit</option>
            <option value="Heavyweight Tee">Heavyweight Tee</option>
            <option value="Graphic Tee">Graphic Tee</option>
            <option value="Polo Tee">Polo Tee</option>
            <option value="Henley Tee">Henley Tee</option>
            <option value="V-Neck Tee">V-Neck Tee</option>
            <option value="Long Sleeve">Long Sleeve</option>
          </select>

          {/* Status Filter */}
          <select
            className={styles.selectFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            className={styles.selectFilter}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="Newest">Newest</option>
            <option value="Price">Sort by Price</option>
            <option value="Stock">Sort by Stock</option>
          </select>
        </div>

        {/* ── Products Table ─────────────────────────────────── */}
        <div className={styles.tableContainer}>
          {loading && products.length === 0 ? (
            <div className={styles.emptyState}>Loading products catalog...</div>
          ) : sortedProducts.length === 0 ? (
            <div className={styles.emptyState}>No products found matching the criteria.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      onChange={handleSelectAll}
                      checked={
                        sortedProducts.length > 0 && 
                        selectedIds.length === sortedProducts.length
                      }
                    />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  const isLowStock = (p.stock ?? 0) < 5;

                  return (
                    <tr key={p.id} className={styles.tableRow}>
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={isChecked}
                          onChange={() => handleSelectOne(p.id)}
                        />
                      </td>
                      <td>
                        <div className={styles.productCell}>
                          <div className={styles.thumbnailContainer}>
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              className={styles.thumbnail}
                              sizes="44px"
                            />
                          </div>
                          <div className={styles.productNameStack}>
                            <Link href={`/products/${p.slug}`} className={styles.productName}>
                              {p.name}
                            </Link>
                            <span className={styles.productSku}>{p.sku || `STK-TEE-${p.id}`}</span>
                          </div>
                        </div>
                      </td>
                      <td>{p.category || 'Men'}</td>
                      <td>₹{(p.price).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={isLowStock ? styles.stockAlert : styles.stockNormal}>
                          {isLowStock && (
                            <svg style={{ display: 'inline', marginRight: '4px' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                              <line x1="12" y1="9" x2="12" y2="13"></line>
                              <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                          )}
                          {p.stock ?? 0}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          p.status === 'Active' 
                            ? styles.badgeActive 
                            : p.status === 'Draft' 
                            ? styles.badgeDraft 
                            : styles.badgeArchived
                        }`}>
                          {p.status || 'Active'}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          onClick={() => handleOpenEditDrawer(p)}
                          className={styles.actionButton}
                          title="Edit Product"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.slug)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          title="Delete Product"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── Drawer Component ───────────────────────────────── */}
      <div 
        className={`${styles.backdrop} ${isDrawerOpen ? styles.backdropOpen : ''}`} 
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={() => setIsDrawerOpen(false)} className={styles.closeButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.drawerContent}>
          {/* Product Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Name *</label>
            <input
              type="text"
              placeholder="e.g. Essential Boxy Tee"
              className={styles.input}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              placeholder="Detailed description of materials, fit, design features..."
              className={`${styles.input} ${styles.textarea}`}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          {/* Pricing Row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price (INR) *</label>
              <input
                type="number"
                placeholder="1499"
                className={styles.input}
                value={formPrice || ''}
                onChange={(e) => setFormPrice(Number(e.target.value))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Compare-At Price (INR)</label>
              <input
                type="number"
                placeholder="1999"
                className={styles.input}
                value={formCompareAtPrice || ''}
                onChange={(e) => setFormCompareAtPrice(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select
                className={styles.selectFilter}
                style={{ width: '100%' }}
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CategoryType)}
              >
                <option value="Classic Fit">Classic Fit</option>
                <option value="Oversized Fit">Oversized Fit</option>
                <option value="Heavyweight Tee">Heavyweight Tee</option>
                <option value="Graphic Tee">Graphic Tee</option>
                <option value="Polo Tee">Polo Tee</option>
                <option value="Henley Tee">Henley Tee</option>
                <option value="V-Neck Tee">V-Neck Tee</option>
                <option value="Long Sleeve">Long Sleeve</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.selectFilter}
                style={{ width: '100%' }}
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as StatusType)}
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Stock & SKU */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Stock Quantity</label>
              <input
                type="number"
                placeholder="15"
                className={styles.input}
                value={formStock}
                onChange={(e) => setFormStock(Number(e.target.value))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>SKU</label>
              <input
                type="text"
                placeholder="STK-TEE-BLK-S"
                className={styles.input}
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
              />
            </div>
          </div>

          {/* Size Variants (Chip input) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Size Variants (Press Enter to add)</label>
            <div className={styles.chipContainer}>
              {formSizes.map((size) => (
                <span key={size} className={styles.chip}>
                  {size}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSize(size)} 
                    className={styles.chipDeleteButton}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={formSizes.length === 0 ? "Add size (e.g. S, M, L)..." : ""}
                className={styles.chipInput}
                value={formSizeInput}
                onChange={(e) => setFormSizeInput(e.target.value)}
                onKeyDown={handleAddSize}
              />
            </div>
          </div>

          {/* Tags (Chip input) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Tags (Press Enter / Space / Comma to add)</label>
            <div className={styles.chipContainer}>
              {formTags.map((tag) => (
                <span key={tag} className={styles.chip}>
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(tag)} 
                    className={styles.chipDeleteButton}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={formTags.length === 0 ? "Add tags..." : ""}
                className={styles.chipInput}
                value={formTagInput}
                onChange={(e) => setFormTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>

          {/* Color Swatch Picker */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Color Swatches</label>
            <div className={styles.swatchRow}>
              {SWATCH_COLORS.map((c) => {
                const isSelected = formColors.includes(c.hex);
                return (
                  <div
                    key={c.name}
                    className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => handleToggleColorSwatch(c.hex)}
                    title={c.name}
                  >
                    {isSelected && (
                      <svg className={styles.checkIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                );
              })}

              <div className={styles.colorPickerWrapper}>
                <input
                  type="color"
                  className={styles.colorInputPicker}
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCustomColor}
                  className={styles.actionButton}
                  style={{ fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px' }}
                >
                  Add Custom
                </button>
              </div>
            </div>
          </div>

          {/* Image Upload Zone */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Images (Multi-image, Reorder)</label>
            <div 
              className={styles.imageUploadZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className={styles.uploadIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span className={styles.uploadText}>Drag & drop images here or click to browse</span>
              <span className={styles.uploadHint}>Supports PNG, JPG, WEBP. First image will be primary.</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFileChange}
              />
            </div>

            {formImages.length > 0 && (
              <div className={styles.thumbnailGrid}>
                {formImages.map((imgUrl, index) => (
                  <div key={imgUrl + index} className={styles.imageThumbnailItem}>
                    <Image
                      src={imgUrl}
                      alt={`Product Thumbnail ${index + 1}`}
                      fill
                      className={styles.imageThumbnail}
                      sizes="100px"
                    />
                    
                    <div className={styles.imageDeleteOverlay}>
                      {index > 0 && (
                        <button
                          type="button"
                          className={styles.imageActionBtn}
                          onClick={() => handleMoveImage(index, 'left')}
                          title="Move Left"
                        >
                          ←
                        </button>
                      )}
                      {index < formImages.length - 1 && (
                        <button
                          type="button"
                          className={styles.imageActionBtn}
                          onClick={() => handleMoveImage(index, 'right')}
                          title="Move Right"
                        >
                          →
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${styles.imageActionBtn} ${styles.imageDeleteBtn}`}
                        onClick={() => handleRemoveImage(index)}
                        title="Remove Image"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>

                    <span className={styles.reorderLabel}>
                      {index === 0 ? 'Primary' : `#${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className={styles.drawerFooter}>
          <button 
            type="button" 
            onClick={() => handleSaveProduct('Draft')} 
            className={`${styles.btn} ${styles.btnSecondary}`}
            disabled={loading}
          >
            Save Draft
          </button>
          <button 
            type="button" 
            onClick={() => handleSaveProduct('Active')} 
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={loading}
          >
            {isEditing ? 'Save changes' : 'Save and Publish'}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={styles.toast}>
          {toast.type === 'error' ? (
            <svg style={{ color: '#ef4444' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          ) : (
            <svg style={{ color: '#10b981' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
