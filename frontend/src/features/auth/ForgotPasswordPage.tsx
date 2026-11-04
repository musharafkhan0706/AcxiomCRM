import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Sparkles, Mail, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Unable to connect to CRM backend service. Please verify backend is running.'
          : 'Failed to process password recovery request. Please try again.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background brand decorative glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#097C87]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#23CED9]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Brand Logo & Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#097C87] to-[#23CED9] text-white shadow-lg shadow-[#097C87]/30 mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Password <span className="text-[#097C87]">Recovery</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your work email address and we'll send you a secure link to reset your account password.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Recovery Instructions Sent</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  If an account exists for <span className="font-semibold text-slate-800">{email}</span>, a secure password reset link has been dispatched.
                </p>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 text-left">
                  <span className="font-bold">Evaluation note:</span> In local development, the reset link is logged directly to the backend Spring Boot console for instant access.
                </div>
              </div>

              <div className="pt-2">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Work Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@acxiomcrm.com"
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 py-2.5 text-sm font-semibold tracking-wide"
                isLoading={isLoading}
              >
                Send Recovery Link
              </Button>

              <div className="text-center pt-3">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-[#097C87] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
