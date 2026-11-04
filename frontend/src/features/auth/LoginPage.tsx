import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      let msg = 'Authentication failed. Please verify credentials.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Unable to connect to CRM backend at http://localhost:8085. Please ensure backend service is running.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background brand decorative glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#097C87]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#23CED9]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Brand Logo & Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#097C87] to-[#23CED9] text-white shadow-lg shadow-brand-teal/30 mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ACXIOM<span className="text-[#097C87]">CRM</span>
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#097C87] mt-0.5">
              Enterprise Sales & Relationship Management
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@acxiomcrm.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#097C87] hover:text-[#097C87]/80 hover:underline transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 py-2.5 text-sm font-semibold tracking-wide"
              isLoading={isLoading}
            >
              Secure Sign In
            </Button>
          </form>

          {/* Evaluation Quick-Fill Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#097C87]" /> Quick Role Logins
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@acxiomcrm.com', 'Admin@Acxiom2026!')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-teal-50 hover:border-brand-teal text-left transition-colors group"
              >
                <div className="font-bold text-slate-800 group-hover:text-brand-teal">Admin</div>
                <div className="text-[10px] text-slate-500 truncate">admin@acxiomcrm.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@acxiomcrm.com', 'Manager@Acxiom2026!')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-cyan-50 hover:border-brand-cyan text-left transition-colors group"
              >
                <div className="font-bold text-slate-800 group-hover:text-brand-cyan-700">Manager</div>
                <div className="text-[10px] text-slate-500 truncate">manager@acxiomcrm.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales1@acxiomcrm.com', 'Sales@Acxiom2026!')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-sage-50 hover:border-brand-sage text-left transition-colors group"
              >
                <div className="font-bold text-slate-800 group-hover:text-emerald-700">Sales Exec 1</div>
                <div className="text-[10px] text-slate-500 truncate">sales1@acxiomcrm.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales2@acxiomcrm.com', 'Sales@Acxiom2026!')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-yellow-50 hover:border-brand-yellow text-left transition-colors group"
              >
                <div className="font-bold text-slate-800 group-hover:text-amber-800">Sales Exec 2</div>
                <div className="text-[10px] text-slate-500 truncate">sales2@acxiomcrm.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Protected by AcxiomCRM Enterprise Security, JWT Auth &amp; BCrypt Hashing.
        </p>
      </div>
    </div>
  );
};

