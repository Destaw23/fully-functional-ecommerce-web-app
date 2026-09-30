import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';
import {
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  UserCheck,
  Edit2,
  X,
  Save,
  UserPlus,
  Truck,
  UserX,
  Shield,
  Filter,
} from 'lucide-react';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, users: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'ACTION_REQUEST':
      return { ...state, loadingAction: true };
    case 'ACTION_SUCCESS':
      return { ...state, loadingAction: false };
    case 'ACTION_FAIL':
      return { ...state, loadingAction: false };
    default:
      return state;
  }
};

export default function UserManagement() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [{ loading, error, users, loadingAction }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    users: [],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Edit Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('customer');
  const [editIsActive, setEditIsActive] = useState(true);

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState('customer');
  const [addPhone, setAddPhone] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  const fetchUsers = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      const { data } = await axios.get(`/api/admin/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userList = data.results || data;
      dispatch({ type: 'FETCH_SUCCESS', payload: Array.isArray(userList) ? userList : [] });
    } catch (err) {
      dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchUsers();
    }
  }, [userInfo]);

  const deleteHandler = async (user) => {
    const userId = user.id || user._id;
    const userName = user.name || user.username || user.email;
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        dispatch({ type: 'ACTION_REQUEST' });
        const token = userInfo?.token || localStorage.getItem('accessToken');
        await axios.delete(`/api/admin/users/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('User account deleted successfully');
        dispatch({ type: 'ACTION_SUCCESS' });
        fetchUsers();
      } catch (err) {
        toast.error(getError(err));
        dispatch({ type: 'ACTION_FAIL' });
      }
    }
  };

  const toggleUserActive = async (user) => {
    const userId = user.id || user._id;
    const userName = user.name || user.username || user.email;
    const newActiveState = !user.is_active;

    try {
      dispatch({ type: 'ACTION_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.patch(
        `/api/admin/users/${userId}/`,
        { is_active: newActiveState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`User "${userName}" ${newActiveState ? 'activated' : 'deactivated'}.`);
      dispatch({ type: 'ACTION_SUCCESS' });
      fetchUsers();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'ACTION_FAIL' });
    }
  };

  const handleRoleChange = async (user, newRole) => {
    const userId = user.id || user._id;
    const userName = user.name || user.username || user.email;
    try {
      dispatch({ type: 'ACTION_REQUEST' });
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.patch(
        `/api/admin/users/${userId}/`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Role for "${userName}" updated to ${newRole.replace('_', ' ')}.`);
      dispatch({ type: 'ACTION_SUCCESS' });
      fetchUsers();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'ACTION_FAIL' });
    }
  };


  const startEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name || user.username || '');
    setEditRole(user.role || (user.isAdmin ? 'admin' : 'customer'));
    setEditIsActive(user.is_active !== undefined ? user.is_active : true);
  };

  const cancelEdit = () => {
    setEditingUser(null);
  };

  const saveEditHandler = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      dispatch({ type: 'ACTION_REQUEST' });
      const userId = editingUser.id || editingUser._id;
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.patch(
        `/api/admin/users/${userId}/`,
        {
          username: editName,
          role: editRole,
          is_active: editIsActive,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User updated successfully');
      dispatch({ type: 'ACTION_SUCCESS' });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'ACTION_FAIL' });
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!addEmail || !addPassword) return;

    try {
      setAddingUser(true);
      const token = userInfo?.token || localStorage.getItem('accessToken');
      await axios.post(
        `/api/auth/register/`,
        {
          username: addUsername || addEmail.split('@')[0],
          email: addEmail,
          password: addPassword,
          password2: addPassword,
          role: addRole,
          phone_number: addPhone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`New account for "${addEmail}" created as ${addRole}.`);
      setShowAddModal(false);
      setAddUsername('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('customer');
      setAddPhone('');
      fetchUsers();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setAddingUser(false);
    }
  };

  const getEffectiveRole = (u) => {
    if (u.role && u.role.trim() !== '') {
      return u.role.toLowerCase();
    }
    if (u.isAdmin || u.is_admin || u.is_superuser || u.isSuperuser) {
      return 'admin';
    }
    return 'customer';
  };


  const filteredUsers = users.filter((u) => {
    const nameStr = u.name || u.username || '';
    const emailStr = u.email || '';
    const idStr = (u.id || u._id || '').toString();

    const matchesSearch =
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idStr.includes(searchTerm);

    const effectiveRole = getEffectiveRole(u);
    const matchesRole = roleFilter === 'all' || effectiveRole === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase inline-flex items-center gap-1">
            <ShieldCheck size={12} /> Admin
          </span>
        );
      case 'delivery':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase inline-flex items-center gap-1">
            <Truck size={12} /> Delivery Personnel
          </span>
        );
      case 'store_owner':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase inline-flex items-center gap-1">
            <Shield size={12} /> Store Merchant
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1">
            <UserCheck size={12} /> Customer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Users Registry & Accounts Management</title>
      </Helmet>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Accounts & Roles Directory</h2>
          <p className="text-slate-500 text-xs font-semibold">Manage user credentials, assign roles (Customer, Delivery, Admin), and deactivate accounts.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <UserPlus size={15} />
            <span>Add New User</span>
          </button>

          <button
            onClick={fetchUsers}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Reload Registry</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
          <Search className="absolute left-6 top-6 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by ID, Username, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1"><Filter size={13} /> Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="delivery">Delivery Personnel</option>
            <option value="admin">Administrator</option>
            <option value="store_owner">Store Merchant</option>
          </select>
        </div>
      </div>

      {loadingAction && <LoadingBox />}

      {loading ? (
        <LoadingBox message="Fetching user accounts..." />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : filteredUsers.length === 0 ? (
        <MessageBox variant="info">No user registrations recorded matching filter criteria.</MessageBox>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                  <th className="p-4">User ID</th>
                  <th className="p-4">Username / Name</th>
                  <th className="p-4">Email / Contact</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((user) => {
                  const uId = user.id || user._id;
                  const isActive = user.is_active !== false;

                  return (
                    <tr key={uId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs text-slate-500">#{uId}</td>

                      <td className="p-4 font-semibold text-slate-800">{user.name || user.username}</td>

                      <td className="p-4 font-medium text-slate-600 text-xs">
                        <div>{user.email}</div>
                        {user.phone_number && <div className="text-slate-400 font-mono">{user.phone_number}</div>}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1.5 min-w-[130px]">
                          <div>{getRoleBadge(getEffectiveRole(user))}</div>
                          <select
                            value={getEffectiveRole(user)}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                            className="w-full text-[11px] font-bold border border-slate-200 rounded-lg py-1 px-1.5 bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                            title="Change role for this user"
                          >
                            <option value="customer">Customer</option>
                            <option value="delivery">Delivery Personnel</option>
                            <option value="store_owner">Store Merchant</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </div>
                      </td>


                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => toggleUserActive(user)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              isActive
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Deactivate account' : 'Activate account'}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          <button
                            onClick={() => startEdit(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 bg-white"
                            title="Edit User Role"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => deleteHandler(user)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100 bg-red-50/20"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <h3 className="text-base font-black text-slate-800">Edit User Permissions</h3>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEditHandler} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Read Only)</label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  <option value="customer">Customer</option>
                  <option value="delivery">Delivery Personnel</option>
                  <option value="admin">Administrator</option>
                  <option value="store_owner">Store Merchant</option>
                </select>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 cursor-pointer select-none" htmlFor="editActiveChk">
                  Is Active Account
                </label>
                <input
                  type="checkbox"
                  id="editActiveChk"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Save size={16} />
                  <span>Save Modifications</span>
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <UserPlus className="text-brand-600" size={20} />
                <span>Create New User Account</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                <input
                  type="text"
                  placeholder="e.g. courier_john"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+251 900 000000"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-brand-500 outline-none"
                >
                  <option value="customer">Customer</option>
                  <option value="delivery">Delivery Personnel</option>
                  <option value="admin">Administrator</option>
                  <option value="store_owner">Store Merchant</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={addingUser}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60"
                >
                  <UserPlus size={16} />
                  <span>{addingUser ? 'Creating...' : 'Create Account'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
