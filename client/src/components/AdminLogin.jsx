import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminLogin } from '../services/api';

/**
 * AdminLogin component.
 * Provides a secure authentication form posting to /api/admin/login,
 * stores the JWT token in localStorage, and navigates to /admin.
 */
export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError('Please provide both username and password.');
      return;
    }

    if (trimmedUser.length > 50) {
      setError('Username must not exceed 50 characters.');
      return;
    }

    if (password.length > 128) {
      setError('Password must not exceed 128 characters.');
      return;
    }

    try {
      setLoading(true);
      const data = await adminLogin({
        username: trimmedUser,
        password,
      });

      if (data && data.token) {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin');
      } else {
        throw new Error('Authentication response did not contain a valid token.');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMsg = err.message;
      if (err.status === 429) {
        errorMsg =
          err.data?.error ||
          err.message ||
          'Too many login attempts. Please try again in 15 minutes.';
      } else if (err.status === 400) {
        if (err.data?.fieldErrors || err.data?.details) {
          const fieldObj = err.data.fieldErrors || err.data.details;
          const messages = Object.entries(fieldObj)
            .map(([_, msgs]) => (Array.isArray(msgs) ? msgs.join(', ') : msgs))
            .filter(Boolean)
            .join('. ');
          if (messages) errorMsg = messages;
        } else if (err.data?.error) {
          errorMsg = err.data.error;
        }
      }
      setError(errorMsg || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EEFCFA] flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif] text-mengede-dark relative overflow-hidden">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-mengede-sage/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-mengede-teal/20 blur-3xl pointer-events-none" />

      {/* Card Container */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_16px_40px_-8px_rgba(9,35,40,0.18)] border border-white/80 p-8 z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-mengede-primary flex items-center justify-center shadow-[0_8px_20px_rgba(42,131,95,0.35)] text-white">
            <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
          </div>
          <h1 className="text-[24px] font-bold text-mengede-dark tracking-tight">
            Admin Moderation Hub
          </h1>
          <p className="text-[13px] text-mengede-dark/60 mt-1">
            Sign in to moderate live routes and taxi terminal operations
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-[13px] animate-fade-in">
            <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0 mt-0.5">
              error
            </span>
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-[12px] font-bold text-mengede-dark/75 mb-1.5 uppercase tracking-wider"
            >
              Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-mengede-dark/40 material-symbols-outlined text-[20px] pointer-events-none">
                person
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                maxLength={50}
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3 bg-mengede-surface/60 border border-mengede-sage/40 rounded-xl text-[14px] text-mengede-dark placeholder-mengede-dark/40 outline-none focus:border-mengede-primary focus:ring-2 focus:ring-mengede-primary/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[12px] font-bold text-mengede-dark/75 mb-1.5 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-mengede-dark/40 material-symbols-outlined text-[20px] pointer-events-none">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                maxLength={128}
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3 bg-mengede-surface/60 border border-mengede-sage/40 rounded-xl text-[14px] text-mengede-dark placeholder-mengede-dark/40 outline-none focus:border-mengede-primary focus:ring-2 focus:ring-mengede-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 text-mengede-dark/40 hover:text-mengede-dark transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-mengede-primary text-white font-semibold text-[14px] shadow-[0_4px_16px_rgba(42,131,95,0.35)] hover:opacity-95 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Hub</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Back to Map */}
        <div className="mt-6 pt-5 border-t border-mengede-sage/20 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-mengede-teal hover:text-mengede-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Interactive Map</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
