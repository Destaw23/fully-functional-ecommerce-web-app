import React, { useContext, useEffect, useState } from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import axios from 'axios';

import { Helmet } from 'react-helmet-async';

import { Store } from '../context/Store';

import { toast } from 'react-toastify';

import { UserPlus, Loader } from 'lucide-react';



export default function SignupScreen() {

  const navigate = useNavigate();

  const { search } = useLocation();

  const redirectInUrl = new URLSearchParams(search).get('redirect');

  const redirect = redirectInUrl ? redirectInUrl : '/';



  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);



  const { state, dispatch: ctxDispatch } = useContext(Store);

  const { userInfo } = state;



  const [role, setRole] = useState('customer');

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register/', {
        username: name,
        email,
        password,
        password2: confirmPassword,
        role,
      });

      ctxDispatch({ type: 'USER_SIGNIN', payload: data });
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      navigate(redirect || (role === 'delivery' ? '/delivery' : '/'));
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = 'Sign-up failed';
      if (typeof errorData === 'string') {
        errorMsg = errorData;
      } else if (errorData?.detail) {
        errorMsg = errorData.detail;
      } else if (errorData) {
        const errors = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            errors.push(`${field}: ${messages.join(', ')}`);
          } else {
            errors.push(`${field}: ${messages}`);
          }
        }
        errorMsg = errors.join('; ');
      } else if (err.message) {
        errorMsg = err.message;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8 animate-fade-in">
      <Helmet>
        <title>Sign Up — ElectroMerce</title>
      </Helmet>

      <div className="auth-card max-w-md w-full">
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
            <UserPlus size={22} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-xs text-slate-500">Join ElectroMerce as a Customer or Delivery Partner.</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-4 mt-6">
          <div>
            <label className="input-label" htmlFor="role">
              I am registering as:
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field font-semibold bg-white text-slate-800 cursor-pointer"
            >
              <option value="customer">Shopper / Customer</option>
              <option value="delivery">Delivery Personnel / Courier Driver</option>
            </select>
          </div>

          <div>
            <label className="input-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader className="animate-spin" size={18} /> : <UserPlus size={18} />}
            <span>{loading ? 'Creating account...' : `Sign Up as ${role === 'delivery' ? 'Delivery Courier' : 'Customer'}`}</span>
          </button>
        </form>



        <div className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">

          Already have an account?{' '}

          <Link to={`/signin?redirect=${redirect}`} className="link-brand">

            Sign in

          </Link>

        </div>

      </div>

    </div>

  );

}

