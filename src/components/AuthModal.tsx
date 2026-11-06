import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, Loader2 } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode = 'login' }) => {
  const { login, register, quickLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Passenger' | 'Admin'>('Passenger');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ name, email, phone, password, role });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (targetRole: 'admin' | 'passenger') => {
    setError(null);
    try {
      setLoading(true);
      await quickLogin(targetRole);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Sign In to RailConnect' : 'Create RailConnect Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Access train reservations, PNR tracking, and booking history.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-1.5 rounded-md transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-slate-900 font-medium"
                  >
                    <option value="Passenger">Passenger Account</option>
                    <option value="Admin">Administrator (DBMS Demo)</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-slate-900"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          {/* 1-Click Quick Demo Switcher for Evaluation */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
              Quick Test / Evaluation Logins
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('passenger')}
                className="p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors text-center"
              >
                Demo Passenger
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="p-2 text-xs rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-900 font-bold transition-colors flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                Demo Admin
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
