import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const { login, verify2FA } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.error) {
        setError(res.error);
      } else if (res.requires2FA && res.tempToken) {
        setRequires2FA(true);
        setTempToken(res.tempToken);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await verify2FA(tempToken, twoFactorCode);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError('2FA verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mb-4 shadow-sm">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          RemitBD Administrative Gateway
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          admin.remitbd.com &bull; Multi-Factor Authenticated Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white border border-slate-200 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3.5 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!requires2FA ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="admin@remitbd.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Encrypted Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Admin Portal'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-sm flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Two-Factor Authentication Required</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Enter the 6-digit TOTP code generated by your Authenticator app (e.g. Google Authenticator) for <span className="font-mono text-slate-900 font-semibold">{email}</span>.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white border border-blue-300 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  placeholder="123456"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRequires2FA(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length < 6}
                  className="w-2/3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
            Administrator accounts are provisioned and verified by the backend. No demo credentials are available in this portal.
          </div>
        </div>
      </div>
    </div>
  );
};
