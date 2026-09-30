import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { Store } from '../context/Store';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Key } from 'lucide-react';

export default function ForgetPasswordScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [email, setEmail] = useState('');
  const [debugToken, setDebugToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
      navigate('/');
    }
  }, [navigate, userInfo]);

  const getErrorMessage = (error) => {
    const data = error.response?.data;
    if (!data) return error.message || 'Unable to send reset link';
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (Array.isArray(data.email)) return data.email[0];
    return data.email || error.message || 'Unable to send reset link';
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDebugToken('');
    try {
      const { data } = await axios.post(
        '/api/auth/forget-password/',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success(data.message || 'Password reset email sent. Check your inbox.');
      setEmail('');
      if (data.debug_token) {
        setDebugToken(data.debug_token);
      }
      navigate('/reset-password');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <Helmet>
        <title>Forget Password</title>
      </Helmet>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-sm">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-blue-600">
            <Key size={24} />
          </div>
          <h1 className="text-2xl font-bold text-green-950">Forgot Password</h1>
          <p className="text-sm text-yellow-950">
            Enter your email address and we will send a reset code to set a new password.
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
              placeholder="Your email"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending reset email...' : 'Send reset email'}
          </button>
        </form>

        {debugToken ? (
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Debug reset token</p>
            <p className="break-words">{debugToken}</p>
            <p className="mt-2 text-slate-600">
              Use this code on the reset password page if email delivery is not available.
            </p>
          </div>
        ) : null}

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
