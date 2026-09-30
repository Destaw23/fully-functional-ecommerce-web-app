import React, { useEffect, useState, useContext } from 'react';
import { storeService } from '../../services/storeService';
import { Store as ContextStore } from '../../context/Store';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { toast } from 'react-toastify';
import { getError } from '../../utils/helpers';
import {
  Store,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react';

export default function StoreManagement() {
  const { state } = useContext(ContextStore);
  const { userInfo } = state;

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storeService.getAdminStores();
      const list = data.results || data;
      setStores(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching admin stores:', err);
      setError('Failed to fetch store listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const openCreateModal = () => {
    setEditingStore(null);
    setName('');
    setSlug('');
    setDescription('');
    setAddress('');
    setCity('');
    setPhone('');
    setEmail('');
    setIsVerified(false);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setName(store.name || '');
    setSlug(store.slug || '');
    setDescription(store.description || '');
    setAddress(store.address || '');
    setCity(store.city || '');
    setPhone(store.phone_number || '');
    setEmail(store.email || '');
    setIsVerified(!!store.is_verified);
    setIsActive(!!store.is_active);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStore(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        name,
        slug: slug.trim() || undefined,
        description,
        address,
        city,
        phone_number: phone,
        email,
        is_verified: isVerified,
        is_active: isActive,
      };

      if (editingStore) {
        await storeService.updateAdminStore(editingStore.id, payload);
        toast.success(`Store "${name}" updated successfully.`);
      } else {
        await storeService.createAdminStore(payload);
        toast.success(`Store "${name}" created successfully.`);
      }

      closeModal();
      fetchStores();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStore = async (store) => {
    if (window.confirm(`Are you sure you want to delete store "${store.name}"? This action cannot be undone.`)) {
      try {
        await storeService.deleteAdminStore(store.id);
        toast.success(`Store "${store.name}" deleted successfully.`);
        fetchStores();
      } catch (err) {
        toast.error(getError(err));
      }
    }
  };

  const toggleVerification = async (store) => {
    try {
      const updated = await storeService.updateAdminStore(store.id, {
        is_verified: !store.is_verified,
      });
      toast.success(`Store "${store.name}" verification status updated.`);
      setStores(stores.map((s) => (s.id === store.id ? { ...s, is_verified: updated.is_verified } : s)));
    } catch (err) {
      console.error('Error updating store verification:', err);
      toast.error('Failed to update store verification status.');
    }
  };

  const toggleActiveStatus = async (store) => {
    try {
      const updated = await storeService.updateAdminStore(store.id, {
        is_active: !store.is_active,
      });
      toast.success(`Store "${store.name}" ${updated.is_active ? 'activated' : 'deactivated'}.`);
      setStores(stores.map((s) => (s.id === store.id ? { ...s, is_active: updated.is_active } : s)));
    } catch (err) {
      console.error('Error updating store status:', err);
      toast.error('Failed to toggle store active status.');
    }
  };

  const filteredStores = stores.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.city && s.city.toLowerCase().includes(term)) ||
      (s.owner_name && s.owner_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Electronic Store Merchants</h2>
          <p className="text-slate-500 text-xs font-semibold">Manage registered stores, create new merchant outlets, verify vendor accounts, and remove stores.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={openCreateModal}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add New Store</span>
          </button>

          <button
            onClick={fetchStores}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Reload Stores</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
        <Search className="absolute left-6 top-6 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search by Store Name, Owner or City..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>

      {loading ? (
        <LoadingBox message="Fetching store registry..." />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : filteredStores.length === 0 ? (
        <MessageBox variant="info">No registered stores found.</MessageBox>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                  <th className="p-4">Store Name</th>
                  <th className="p-4">Owner / Contact</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Products</th>
                  <th className="p-4">Verified</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <Store size={16} className="text-brand-600" />
                        <span>{store.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">/{store.slug}</span>
                    </td>

                    <td className="p-4 text-xs">
                      <div className="font-semibold text-slate-800">{store.owner_name || 'Unassigned'}</div>
                      <div className="text-slate-500">{store.phone_number || store.email || 'No contact info'}</div>
                    </td>

                    <td className="p-4 text-xs font-medium text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{store.address ? `${store.address}, ${store.city}` : store.city || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-800 text-xs">
                      {store.product_count || 0} items
                    </td>

                    <td className="p-4">
                      {store.is_verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <ShieldCheck size={12} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                          Unverified
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${store.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {store.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => toggleVerification(store)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            store.is_verified
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Toggle Verification"
                        >
                          {store.is_verified ? 'Revoke' : 'Verify'}
                        </button>

                        <button
                          onClick={() => toggleActiveStatus(store)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            store.is_active
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Toggle Active Status"
                        >
                          {store.is_active ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          onClick={() => openEditModal(store)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 bg-white"
                          title="Edit Store"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteStore(store)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 bg-red-50/20"
                          title="Delete Store"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Store Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Store className="text-brand-600" size={20} />
                <span>{editingStore ? 'Edit Store Details' : 'Add New Store Outlet'}</span>
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Store Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tekno Hub Addis"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Slug (Optional)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. tekno-hub-addis"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-mono focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe store specialization and electronics inventory..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Addis Ababa"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +251 911 000000"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Bole Road, House #402"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store@example.com"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded cursor-pointer"
                  />
                  <span>Is Verified Merchant</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded cursor-pointer"
                  />
                  <span>Is Active Store</span>
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : editingStore ? 'Update Store' : 'Create Store'}</span>
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
