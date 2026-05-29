import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import LoadingBox from '../common/LoadingBox';
import MessageBox from '../common/MessageBox';
import { Store } from '../../context/Store';
import { getError } from '../../utils/helpers';
import { Trash2, ShieldAlert, ShieldCheck, Search, RefreshCw, UserCheck, Edit2, X, Save } from 'lucide-react';

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
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const fetchUsers = async () => {
    try {
      dispatch({ type: 'FETCH_REQUEST' });
      const { data } = await axios.get(`/api/users`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
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
    if (window.confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      try {
        dispatch({ type: 'ACTION_REQUEST' });
        await axios.delete(`/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success('User deleted successfully');
        dispatch({ type: 'ACTION_SUCCESS' });
        fetchUsers();
      } catch (err) {
        toast.error(getError(err));
        dispatch({ type: 'ACTION_FAIL' });
      }
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditIsAdmin(user.isAdmin);
  };

  const cancelEdit = () => {
    setEditingUser(null);
  };

  const saveEditHandler = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      dispatch({ type: 'ACTION_REQUEST' });
      await axios.put(
        `/api/users/${editingUser._id}`,
        {
          _id: editingUser._id,
          name: editName,
          email: editingUser.email,
          isAdmin: editIsAdmin,
        },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
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

  const toggleAdminPrivilege = async (user) => {
    const actionLabel = user.isAdmin ? 'demote' : 'promote';
    if (window.confirm(`Are you sure you want to ${actionLabel} user "${user.name}"?`)) {
      try {
        dispatch({ type: 'ACTION_REQUEST' });
        await axios.put(
          `/api/users/${user._id}`,
          {
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: !user.isAdmin,
          },
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );
        toast.success(`User updated to ${!user.isAdmin ? 'Admin' : 'Customer'}`);
        dispatch({ type: 'ACTION_SUCCESS' });
        fetchUsers();
      } catch (err) {
        toast.error(getError(err));
        dispatch({ type: 'ACTION_FAIL' });
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    return u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u._id.toString().includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Users</title>
      </Helmet>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Accounts Directory</h2>
          <p className="text-red-950 text-xs font-semibold font-medium">Manage user credentials, groups, and authorization roles.</p>
        </div>

        <button
          onClick={fetchUsers}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Reload Registry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* User edit sidebar if editing */}
        {editingUser && (
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-6 space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Edit Account Permissions</span>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-650 transition-colors">
                <X size={16} />
              </button>
            </h3>

            <form onSubmit={saveEditHandler} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Username</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email (Read Only)</label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed select-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 cursor-pointer select-none" htmlFor="editAdminChk">
                  Is Administrator
                </label>
                <input
                  type="checkbox"
                  id="editAdminChk"
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-blue-655 border-slate-300 rounded cursor-pointer"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-655 font-bold py-2.5 px-4 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={editingUser ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
          {/* Search box input */}
          <div className="relative w-full max-w-md bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
            <Search className="absolute left-6 top-6 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by SKU, Name or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-850 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {loadingAction && <LoadingBox />}

          {loading ? (
            <LoadingBox />
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : filteredUsers.length === 0 ? (
            <MessageBox>No user registrations recorded.</MessageBox>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                      <th className="p-4">User ID</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-500">#{user._id}</td>
                        
                        <td className="p-4 font-semibold text-slate-800">{user.name}</td>
                        
                        <td className="p-4 font-medium text-slate-600">{user.email}</td>

                        {/* Role status badge */}
                        <td className="p-4">
                          {user.isAdmin ? (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase inline-flex items-center gap-1">
                              <ShieldCheck size={12} />
                              Admin
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1">
                              <UserCheck size={12} />
                              Customer
                            </span>
                          )}
                        </td>

                        {/* Actions buttons */}
                        <td className="p-4 text-right flex justify-end items-center gap-2">
                          <button
                            onClick={() => toggleAdminPrivilege(user)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              user.isAdmin
                                ? 'text-amber-600 border-amber-100 bg-amber-50/20 hover:bg-amber-50'
                                : 'text-brand-655 border-brand-100 bg-brand-50/20 hover:bg-brand-50'
                            }`}
                            title={user.isAdmin ? 'Demote to Customer' : 'Promote to Admin'}
                          >
                            <ShieldAlert size={16} />
                          </button>

                          <button
                            onClick={() => startEdit(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100 bg-slate-50/50"
                            title="Edit profile inline"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => deleteHandler(user)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-50/50 bg-red-50/10"
                            title="Delete User"
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
