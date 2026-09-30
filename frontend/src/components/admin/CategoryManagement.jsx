import React, { useContext, useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Loader, Save, FolderOpen } from 'lucide-react';
import { Store } from '../../context/Store';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { getError } from '../../utils/helpers';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, categories: action.payload, loading: false };
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

export default function CategoryManagement() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [{ loading, error, categories, loadingMutate }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    categories: [],
  });

  // Form State
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('');

  const fetchCategories = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const { data } = await axios.get('/api/admin/categories/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoryList = data.results || data;
      dispatch({ type: 'FETCH_SUCCESS', payload: Array.isArray(categoryList) ? categoryList : [] });
    } catch (err) {
      dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchCategories();
    }
  }, [userInfo]);

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setParent('');
  };

  const editHandler = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setParent(cat.parent || '');
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      dispatch({ type: 'MUTATE_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      
      const payload = {
        name,
        slug: slug.trim() || undefined,
        description,
        parent: parent ? Number(parent) : null,
      };

      if (editingCategory) {
        // Edit Mode
        await axios.put(`/api/admin/categories/${editingCategory.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Category updated successfully');
      } else {
        // Create Mode
        await axios.post('/api/admin/categories/', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Category created successfully');
      }
      
      dispatch({ type: 'MUTATE_SUCCESS' });
      resetForm();
      fetchCategories();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'MUTATE_FAIL' });
    }
  };

  const deleteHandler = async (cat) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      try {
        dispatch({ type: 'MUTATE_REQUEST' });
        const token = userInfo?.token || localStorage.getItem('accessToken');
        await axios.delete(`/api/admin/categories/${cat.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Category deleted successfully');
        dispatch({ type: 'MUTATE_SUCCESS' });
        fetchCategories();
      } catch (err) {
        toast.error(getError(err));
        dispatch({ type: 'MUTATE_FAIL' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Categories</title>
      </Helmet>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create / Edit Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-6 space-y-5">
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FolderOpen className="text-brand-600" size={20} />
              <span>{editingCategory ? 'Edit Category' : 'Create Category'}</span>
            </h2>

            <form onSubmit={submitHandler} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Headphones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Slug (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. headphones"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Parent Category</label>
                <select
                  value={parent}
                  onChange={(e) => setParent(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter short description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loadingMutate}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  {loadingMutate ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{editingCategory ? 'Update' : 'Create'}</span>
                    </>
                  )}
                </button>

                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Categories List */}
        <div className="lg:col-span-2">
          {loading ? (
            <LoadingBox />
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : categories.length === 0 ? (
            <MessageBox>No categories created yet.</MessageBox>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-auto">
                <table className="w-full text-left border-collapse text-sm relative">
                  <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                      <th className="p-4">ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Description</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-500">#{cat.id}</td>
                        <td className="p-4 font-semibold text-slate-800">
                          {cat.name}
                          {cat.parent_name && (
                            <span className="ml-2 bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              Sub of {cat.parent_name}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-655">{cat.slug}</td>
                        <td className="p-4 text-slate-500 max-w-[200px] truncate">
                          {cat.description || <span className="text-slate-300 italic">No description</span>}
                        </td>
                        <td className="p-4 text-right flex justify-end items-center gap-2">
                          <button
                            onClick={() => editHandler(cat)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100 bg-slate-50/50"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteHandler(cat)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-50/50 bg-red-50/10"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
