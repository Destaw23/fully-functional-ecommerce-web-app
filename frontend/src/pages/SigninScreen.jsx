import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Store } from '../context/Store';
import { toast } from 'react-toastify';
import { LogIn, Loader } from 'lucide-react';
import { getError } from '../utils/helpers';

export default function SigninScreen() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get('redirect');
  const redirect = redirectInUrl ? redirectInUrl : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login/', {
        email,
        password,
      });
      ctxDispatch({ type: 'USER_SIGNIN', payload: data });
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      navigate(redirect || '/');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-8 animate-fade-in">
      <Helmet>
        <title>Sign In — ElectroMerce</title>
      </Helmet>

      <div className="auth-card">
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
            <LogIn size={22} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 text-yellow-900 font-bold">Sign in to track orders and checkout faster.</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="input-label" htmlFor="email" font-bold>
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label font-bold" htmlFor="password" >
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

          <div className="text-right">
            <Link to="/forget-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader className="animate-spin" size={18} /> : <LogIn size={18} />}
            <span>{loading ? 'Signing in...' : 'Sign in'}</span>
          </button>
        </form>

        <div className="space-y-2 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          <p>
            New here?{' '}
            <Link to={`/signup?redirect=${redirect}`} className="link-brand">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
