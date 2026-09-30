import React, { useContext, useEffect, useReducer, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Loader, X, Save, FileText, Image as ImageIcon, Upload, Store as StoreIcon } from 'lucide-react';
import { Store } from '../../context/Store';
import { getError, getMediaUrl } from '../../utils/helpers';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import useCategories from '../../hooks/useCategories';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'MUTATE_REQUEST':
      return { ...state, loadingMutate: true };
    case 'MUTATE_SUCCESS':
      return { ...state, loadingMutate: false };
    case 'MUTATE_FAIL':
      return { ...state, loadingMutate: false };
    default:
      return state;
  }
};

export default function ProductForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { id: productId } = params;
  const isEditMode = !!productId;

  const queryStore = new URLSearchParams(location.search).get('store');

  const { state } = useContext(Store);
  const { userInfo } = state;
  const [{ loading, error, loadingMutate }, dispatch] = useReducer(reducer, {
    loading: isEditMode,
    error: '',
  });

  // Fields State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [sku, setSku] = useState('');
  const [condition, setCondition] = useState('new');
  const [warrantyMonths, setWarrantyMonths] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState('');
  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [storeId, setStoreId] = useState('');
  const [storesList, setStoresList] = useState([]);
  const [countInStock, setCountInStock] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');

  // Image Upload File & Local Preview State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [additionalMeta, setAdditionalMeta] = useState([]); // [{alt_text, is_primary}]
  const [existingImages, setExistingImages] = useState([]); // [{id,image,is_primary,alt_text}]
  const [deletedExistingIds, setDeletedExistingIds] = useState([]);
  const [primarySelection, setPrimarySelection] = useState(null); // id or `new-<idx>`

  // Active Tab
  const [activeTab, setActiveTab] = useState('general');

  // Categories Loader Hook
  const { categories, loading: loadingCats } = useCategories();

  // Load Stores List
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const token = userInfo?.token || localStorage.getItem('accessToken');
        const { data } = await axios.get('/api/stores/admin/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = data.results || data;
        if (Array.isArray(list)) setStoresList(list);
      } catch (err) {
        console.error('Failed to load store list:', err);
      }
    };
    if (userInfo) {
      fetchStores();
    }
  }, [userInfo]);

  // Pre-select store from URL query param if available
  useEffect(() => {
    if (queryStore && !isEditMode) {
      setStoreId(queryStore);
    }
  }, [queryStore, isEditMode]);

  // Load details in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchData = async () => {
        try {
          dispatch({ type: 'FETCH_REQUEST' });
          const token = userInfo?.token || localStorage.getItem('accessToken');
          const { data } = await axios.get(`/api/admin/products/${productId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setName(data.name);
          setSlug(data.slug);
          setPrice(data.price);
          setComparePrice(data.comparePrice || data.compare_price || '');
          setSku(data.sku || '');
          setCondition(data.condition || 'new');
          setWarrantyMonths(data.warrantyMonths || data.warranty_months || 0);
          setIsFeatured(data.isFeatured || data.is_featured || false);
          setIsActive(data.isActive !== undefined ? data.isActive : data.is_active !== undefined ? data.is_active : true);
          setImage(data.image || data.main_image || '');
          const existingGallery = [];
          if (data.images && Array.isArray(data.images)) existingGallery.push(...data.images);
          setImages(existingGallery);

          // map additional_images objects
          const mapped = (data.additional_images || []).map((ai) => ({
            id: ai.id,
            image: ai.image,
            is_primary: ai.is_primary || false,
            alt_text: ai.alt_text || '',
          }));
          setExistingImages(mapped);
          // set primary selection if any
          const primaryExisting = mapped.find((m) => m.is_primary);
          if (primaryExisting) setPrimarySelection(primaryExisting.id);
          setCategory(data.category || '');
          setStoreId(data.store || data.store_id || '');
          const parsedStock =
            data.countInStock !== undefined
              ? data.countInStock
              : data.stock_quantity !== undefined
                ? data.stock_quantity
                : 0;
          setCountInStock(Number(parsedStock));
          setBrand(data.brand || '');
          setDescription(data.description || '');
          dispatch({ type: 'FETCH_SUCCESS' });
        } catch (err) {
          dispatch({
            type: 'FETCH_FAIL',
            payload: getError(err),
          });
        }
      };
      fetchData();
    } else {
      // Auto pre-populate SKU in create mode
      setSku(`SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    }
  }, [productId, isEditMode]);

  // Auto-fill slug from title if in create mode
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (!isEditMode) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g)
      );
    }
  };

  const isValidImageFile = (file) => {
    const validMime = file?.type?.startsWith('image/');
    const validExtension = /\.(jpe?g|png|gif|webp|svg)$/i.test(file?.name || '');
    return Boolean(file) && (validMime || validExtension);
  };

  // Local File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      e.target.value = '';
      toast.error('Only image files are allowed for product uploads.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    toast.success('Local file loaded. Preview available in Media tab.');
  };

  const handleMultipleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!isValidImageFile(file)) {
        toast.error(`Skipped non-image file: ${file.name}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setAdditionalFiles((prev) => [...prev, ...validFiles]);
    setAdditionalPreviews((prev) => [...prev, ...validFiles.map((f) => URL.createObjectURL(f))]);
    setAdditionalMeta((prev) => [...prev, ...validFiles.map(() => ({ alt_text: '', is_primary: false }))]);
    toast.success(`${validFiles.length} image file(s) added to gallery`);
    e.target.value = '';
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!category) {
      toast.error('Please select a product category');
      return;
    }

    try {
      dispatch({ type: 'MUTATE_REQUEST' });

      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('price', price);
      if (comparePrice) {
        formData.append('compare_price', comparePrice);
      }
      formData.append('sku', sku);
      formData.append('condition', condition);
      formData.append('warranty_months', warrantyMonths);
      formData.append('is_featured', isFeatured ? 'true' : 'false');
      formData.append('is_active', isActive ? 'true' : 'false');
      formData.append('category', category);
      formData.append('brand', brand);
      formData.append('countInStock', countInStock);
      formData.append('description', description);
      formData.append('images', JSON.stringify(images));

      if (imageFile) {
        // Appends the raw File object to satisfy models.ImageField on the backend!
        formData.append('main_image', imageFile);
      } else if (image) {
        // Appends image URL string to be handled by the interceptor
        formData.append('image', image);
      }

      // Append any additional gallery files
      if (additionalFiles && additionalFiles.length > 0) {
        additionalFiles.forEach((f) => {
          formData.append('additional_images_files', f);
        });
      }

      // Build metadata for existing and new images
      const meta = [];
      existingImages.forEach((ex) => {
        meta.push({ id: ex.id, alt_text: ex.alt_text || '', is_primary: ex.is_primary || false });
      });
      // deleted existing images
      deletedExistingIds.forEach((id) => meta.push({ id, delete: true }));
      // new files metadata
      additionalFiles.forEach((f, idx) => {
        const m = additionalMeta[idx] || { alt_text: '', is_primary: false };
        meta.push({ filename: f.name, alt_text: m.alt_text || '', is_primary: m.is_primary || false });
      });

      if (meta.length > 0) {
        formData.append('additional_images_meta', JSON.stringify(meta));
      }

      const token = userInfo?.token || localStorage.getItem('accessToken');
      // Let axios set multipart boundary; manual Content-Type breaks file uploads.
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (isEditMode) {
        formData.append('_id', productId);
        await axios.put(`/api/admin/products/${productId}/`, formData, { headers });
        toast.success('Product updated successfully');
      } else {
        await axios.post('/api/admin/products/', formData, { headers });
        toast.success('Product created successfully');
      }

      dispatch({ type: 'MUTATE_SUCCESS' });
      navigate('/admin/products');
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'MUTATE_FAIL' });
    }
  };

  const addImageUrlHandler = () => {
    const trimmedUrl = newImageUrl.trim();
    if (!trimmedUrl) return;
    setImages([...images, trimmedUrl]);
    setNewImageUrl('');
    toast.success('Image added to gallery');
  };

  const deleteFileHandler = (url) => {
    setImages(images.filter((x) => x !== url));
    toast.success('Image removed from gallery');
  };

  const removeExistingImage = (id) => {
    setExistingImages((prev) => prev.filter((x) => x.id !== id));
    setDeletedExistingIds((prev) => [...prev, id]);
    // clear primary selection if it was the removed one
    if (primarySelection === id) setPrimarySelection(null);
    toast.info('Removed existing image');
  };

  const setExistingAlt = (id, value) => {
    setExistingImages((prev) => prev.map((it) => (it.id === id ? { ...it, alt_text: value } : it)));
  };

  const togglePrimary = (key) => {
    // key is either existing id (number) or `new-<idx>`
    setPrimarySelection(key);
    // update existingImages flags
    setExistingImages((prev) => prev.map((it) => ({ ...it, is_primary: it.id === key })));
    // update additionalMeta
    setAdditionalMeta((prev) => prev.map((m, idx) => ({ ...m, is_primary: `new-${idx}` === key })));
  };

  const setAdditionalAlt = (idx, value) => {
    setAdditionalMeta((prev) => prev.map((m, i) => (i === idx ? { ...m, alt_text: value } : m)));
  };

  if (isEditMode && loading) return <LoadingBox />;
  if (isEditMode && error) return <MessageBox variant="danger">{error}</MessageBox>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Helmet>
        <title>{isEditMode ? `Edit Product #${productId}` : 'Create New Product'}</title>
      </Helmet>

      <div>
        <Link to="/admin/products" className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center space-x-1">
          <ArrowLeft size={14} />
          <span>Back to Products</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Title Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            {isEditMode && (
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded uppercase">
                SKU: #{productId}
              </span>
            )}
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {isEditMode ? name : 'New Catalog Listing'}
            </h2>
          </div>

          {slug && <span className="text-xs font-mono text-slate-400">Slug: {slug}</span>}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'general'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            <FileText size={14} />
            <span>Product Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'media'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            <ImageIcon size={14} />
            <span>Product Media</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={submitHandler} className="p-6 sm:p-8 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Product Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    required
                    placeholder="e.g. Ultra Wireless Headphones"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    placeholder="e.g. ultra-wireless-headphones"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-805"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stock SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    placeholder="e.g. SONY-WH1000-01"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Product Category</label>
                  {loadingCats ? (
                    <div className="h-10 animate-pulse bg-slate-100 rounded-lg" />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-700 font-medium cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sales Price (Br)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="e.g. 199.99"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Compare Price (Original Price - Br)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="e.g. 249.99 (Leave blank if no discount)"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Available Stock</label>
                  <input
                    type="number"
                    value={countInStock}
                    onChange={(e) => setCountInStock(e.target.value)}
                    required
                    placeholder="e.g. 50"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                    placeholder="e.g. Sony"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Item Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="new">New</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="used">Used</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Warranty Months</label>
                  <input
                    type="number"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <label className="flex items-center space-x-3 cursor-pointer py-2 bg-slate-50 border border-slate-200 rounded-xl px-4">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-brand-600 border-slate-350 rounded focus:ring-brand-550 cursor-pointer"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black text-slate-800">Featured Listing</span>
                    <span className="text-[10px] text-slate-400 leading-none">Feature this product in slideshow cards</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer py-2 bg-slate-50 border border-slate-200 rounded-xl px-4">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-brand-600 border-slate-350 rounded focus:ring-brand-550 cursor-pointer"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black text-slate-800">Publish Active Status</span>
                    <span className="text-[10px] text-slate-400 leading-none">Enable public viewing in search catalog</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Long Description</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Provide details about specs, condition, features..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Image upload sector */}
              <div className="space-y-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-soft">
                  <Upload size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800">Upload Product Image File</p>
                  <p className="text-[10px] text-slate-400">PNG, JPG, JPEG up to 5MB</p>
                </div>

                <input
                  type="file"
                  id="imageUpload"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <input
                  type="file"
                  id="additionalImagesUpload"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                  multiple
                  onChange={handleMultipleFilesChange}
                  className="hidden"
                />

                <label
                  htmlFor="imageUpload"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
                >
                  Select File
                </label>
                <label
                  htmlFor="additionalImagesUpload"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer ml-2"
                >
                  Select Gallery Files
                </label>
                {imageFile && (
                  <p className="text-xs font-semibold text-brand-655 font-mono truncate max-w-xs mx-auto">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>

              {/* Primary Image URL & Previews */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-4 border-t border-slate-100">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Primary Image URL (Alternative)</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Enter main image direct URL..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400">
                    Use high quality image links if you prefer linking directly instead of uploading a file.
                  </p>
                </div>

                <div className="md:col-span-1 border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-center min-h-[120px]">
                  {imagePreview || image ? (
                    <img
                      src={imagePreview || getMediaUrl(image)}
                      alt="Primary Preview"
                      className="max-h-24 max-w-full rounded-lg object-contain bg-white border border-slate-100 shadow-sm"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">No image loaded</span>
                  )}
                </div>
              </div>

              {/* Additional Images */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase">Additional Images Gallery</label>

                {(images.length === 0 && existingImages.length === 0) ? (
                  <div className="text-xs text-slate-400 italic py-2">No gallery images loaded yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {existingImages.map((it) => (
                      <div key={it.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2 gap-3">
                        <img
                          src={getMediaUrl(it.image)}
                          alt={it.alt_text || 'Gallery'}
                          className="h-12 w-12 rounded object-cover bg-white border border-slate-100 shrink-0"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <label className="flex items-center gap-2">
                              <input type="radio" name="primary" checked={primarySelection === it.id} onChange={() => togglePrimary(it.id)} />
                              <span className="text-xs font-bold">Primary</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            value={it.alt_text || ''}
                            onChange={(e) => setExistingAlt(it.id, e.target.value)}
                            placeholder="Alt text"
                            className="w-full border border-slate-200 rounded-lg p-1 text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(it.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Remove Image"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}

                    {images.map((imgUrl, i) => (
                      <div key={`url-${i}`} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2 gap-3">
                        <img
                          src={getMediaUrl(imgUrl)}
                          alt="Gallery Preview"
                          className="h-12 w-12 rounded object-cover bg-white border border-slate-100 shrink-0"
                        />
                        <span className="text-xs text-slate-655 truncate flex-1 font-mono">{imgUrl}</span>
                        <button
                          type="button"
                          onClick={() => deleteFileHandler(imgUrl)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Remove Image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {additionalPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    {additionalPreviews.map((p, idx) => (
                      <div key={idx} className="relative bg-slate-50 border border-slate-200 rounded-xl p-2">
                        <img src={p} alt={`preview-${idx}`} className="h-20 w-full rounded object-cover" />
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center gap-2">
                            <input type="radio" name="primary" checked={primarySelection === `new-${idx}`} onChange={() => togglePrimary(`new-${idx}`)} />
                            <span className="text-xs font-bold">Primary</span>
                          </label>
                          <input
                            type="text"
                            value={additionalMeta[idx]?.alt_text || ''}
                            onChange={(e) => setAdditionalAlt(idx, e.target.value)}
                            placeholder="Alt text"
                            className="w-full border border-slate-200 rounded-lg p-1 text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdditionalPreviews((prev) => prev.filter((_, i) => i !== idx));
                            setAdditionalFiles((prev) => prev.filter((_, i) => i !== idx));
                            setAdditionalMeta((prev) => prev.filter((_, i) => i !== idx));
                            // clear primary if it was the removed one
                            if (primarySelection === `new-${idx}`) setPrimarySelection(null);
                            toast.info('Removed selected gallery file');
                          }}
                          className="absolute top-1 right-1 text-white bg-red-500 rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter secondary image URL..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white sm:col-span-3"
                  />
                  <button
                    type="button"
                    onClick={addImageUrlHandler}
                    className="bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-xs font-bold transition-all sm:col-span-1"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loadingMutate}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow disabled:opacity-50"
            >
              {loadingMutate ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <>
                  <Save size={16} strokeWidth={2.5} />
                  <span>{isEditMode ? 'Save Modifications' : 'Publish Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
