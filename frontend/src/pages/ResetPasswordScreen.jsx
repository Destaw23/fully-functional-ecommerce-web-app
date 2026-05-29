import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { Store } from '../context/Store';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Key } from 'lucide-react';

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  useEffect(() => {
    if (countdown <= 0) {
      setExpired(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const getErrorMessage = (error) => {
    const data = error.response?.data;
    if (!data) return error.message || 'Reset failed';
    if (data.detail) return data.detail;
    if (data.token) return data.token;
    if (data.message) return data.message;
    if (Array.isArray(data.email)) return data.email[0];
    return data.email || error.message || 'Reset failed';
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        '/api/auth/reset-password/',
        {
          email,
          token: resetCode,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success(data.message || 'Your password has been reset successfully.');
      navigate('/signin');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <Helmet>
        <title>Reset Password</title>
      </Helmet>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-sm">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-blue-600">
            <Key size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset Password</h1>
          <p className="text-sm text-slate-500">
            Enter your email, verification code and a new password to recover your account.
          </p>
        </div>

        <form onSubmit={submitHandler} className="space-y-4 mt-6">
          <div>
            <label className="input-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label" htmlFor="token">
              Verification code
            </label>
            <input
              id="token"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={resetCode}
              required
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter code from your email"
              className="input-field"
              disabled={expired}
            />
            <p className="mt-2 text-sm text-slate-500">
              Paste the six-digit verification code you received by email.
            </p>
            <div className="mt-2 text-sm">
              {expired ? (
                <span className="text-red-600">The verification code has expired. Please request a new code.</span>
              ) : (
                <span className="text-slate-600">Code expires in {countdown}s.</span>
              )}
            </div>
          </div>
          <div>
            <label className="input-label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              required
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading || expired} className="btn-primary w-full">
            {loading ? 'Resetting password...' : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Remembered your password?{' '}
            <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
