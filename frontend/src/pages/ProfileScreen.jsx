import React, { useContext, useEffect, useReducer, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Store } from '../context/Store';
import { toast } from 'react-toastify';
import { getError } from '../utils/helpers';
import axios from 'axios';
import { User, Key, Loader, ChevronRight, ArrowLeft } from 'lucide-react';

const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_REQUEST':
      return { ...state, loadingUpdate: true };
    case 'UPDATE_SUCCESS':
      return { ...state, loadingUpdate: false };
    case 'UPDATE_FAIL':
      return { ...state, loadingUpdate: false };
    default:
      return state;
  }
};

export default function ProfileScreen() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get('section') === 'password' ? 'password' : 'profile';

  const [name, setName] = useState(userInfo.username || '');
  const [email] = useState(userInfo.email || '');
  const [phone, setPhone] = useState(userInfo.phone_number || '');
  const [address, setAddress] = useState(userInfo.address || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(
    userInfo.profile_picture || ''
  );
  const [profilePictureUrlObject, setProfilePictureUrlObject] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [{ loadingUpdate }, dispatch] = useReducer(reducer, {
    loadingUpdate: false,
  });

  const goToProfile = () => setSearchParams({});
  const goToPassword = () => setSearchParams({ section: 'password' });

  useEffect(() => {
    return () => {
      if (profilePictureUrlObject) {
        URL.revokeObjectURL(profilePictureUrlObject);
      }
    };
  }, [profilePictureUrlObject]);

  const profilePictureChangeHandler = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (profilePictureUrlObject) {
        URL.revokeObjectURL(profilePictureUrlObject);
      }
      const objectUrl = URL.createObjectURL(file);
      setProfilePicture(file);
      setProfilePicturePreview(objectUrl);
      setProfilePictureUrlObject(objectUrl);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    dispatch({ type: 'UPDATE_REQUEST' });
    try {
      const formData = new FormData();
      formData.append('username', name);
      formData.append('phone_number', phone);
      formData.append('address', address);
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }

      const { data } = await axios.put('/api/auth/profile/', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      dispatch({ type: 'UPDATE_SUCCESS' });
      const updatedUserInfo = { ...userInfo, ...data };
      ctxDispatch({
        type: 'USER_SIGNIN',
        payload: {
          user: updatedUserInfo,
          access: localStorage.getItem('accessToken'),
          refresh: localStorage.getItem('refreshToken'),
        },
      });
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      toast.success('Profile updated successfully');
    } catch (err) {
      dispatch({ type: 'UPDATE_FAIL' });
      toast.error(getError(err));
    }
  };

  const changePasswordHandler = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoadingPassword(true);
    try {
      await axios.post(
        '/api/auth/change-password/',
        {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }
      );
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      goToProfile();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-md animate-fade-in px-4 py-8">
      <Helmet>
        <title>
          {section === 'password' ? 'Change Password' : 'User Profile'} — ElectroMerce
        </title>
      </Helmet>

      <div className="auth-card">
        {section === 'profile' ? (
          <>
            <div className="space-y-2 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                <User size={22} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Edit profile</h1>
              <p className="text-sm text-slate-500">Update your name, phone, and address.</p>
            </div>

            <form onSubmit={submitHandler} className="space-y-4">
              <div>
                <label className="input-label" htmlFor="profile-name">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="profile-email">
                  Email address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  disabled
                  className="input-field cursor-not-allowed bg-slate-100 text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-400">Email cannot be changed here.</p>
              </div>

              <div>
                <label className="input-label" htmlFor="profile-phone">
                  Phone number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2519XXXXXXXX"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="profile-address">
                  Address
                </label>
                <input
                  id="profile-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your delivery address"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="profile-picture">
                  Profile picture
                </label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={profilePictureChangeHandler}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700"
                />
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile preview"
                    className="mt-3 h-28 w-28 rounded-2xl object-cover"
                  />
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Upload a profile photo to personalize your account.
                  </p>
                )}
              </div>

              <button type="submit" disabled={loadingUpdate} className="btn-primary w-full">
                {loadingUpdate ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <span>Save changes</span>
                )}
              </button>
            </form>

            <div className="border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={goToPassword}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-left transition-all hover:border-brand-200 hover:bg-brand-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Key size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Change password</p>
                    <p className="text-xs text-slate-500">Update your account password</p>
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-slate-400" />
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={goToProfile}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              <ArrowLeft size={16} />
              Back to profile
            </button>

            <div className="space-y-2 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                <Key size={22} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Change password</h1>
              <p className="text-sm text-slate-500">Enter your current password, then choose a new one.</p>
            </div>

            <form onSubmit={changePasswordHandler} className="space-y-4">
              <div>
                <label className="input-label" htmlFor="old-password">
                  Current password
                </label>
                <input
                  id="old-password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="new-password">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="confirm-password">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loadingPassword} className="btn-primary w-full">
                {loadingPassword ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <span>Update password</span>
                )}
              </button>

              <button type="button" onClick={goToProfile} className="btn-secondary w-full">
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
