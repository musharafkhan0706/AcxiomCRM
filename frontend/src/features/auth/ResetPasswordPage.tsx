import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Sparkles, Lock, Eye, EyeOff, CheckCircle2, ShieldAlert, ArrowLeft, Check, X } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password complexity checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[@#$%^&+=!._-]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is missing from the URL. Please request a new recovery link.');
      return;
    }
    if (!isFormValid) {
      setError('Please satisfy all password complexity criteria before proceeding.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Unable to connect to CRM backend service. Please verify backend is running.'
          : 'Failed to reset password. The recovery link may have expired or already been used.');
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
              Create New <span className="text-[#097C87]">Password</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Choose a strong, unique password to secure your CRM workspace account.
            </p>
          </div>

          {!token && (
            <div className="mb-6 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Missing Recovery Token
              </div>
              <p>No valid reset token was detected in the web address. Please click the recovery link from your email or request a new one.</p>
              <Link to="/forgot-password" className="inline-block text-[#097C87] font-semibold hover:underline mt-1">
                Request new recovery link &rarr;
              </Link>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Password Reset Complete</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Your password has been securely updated. Any existing active sessions have been invalidated for security.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  className="w-full"
                >
                  Sign In with New Password
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="pointer-events-auto hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Password Complexity Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px]">
                <span className="font-bold text-slate-700 block mb-1">Password Requirements:</span>
                <div className="grid grid-cols-2 gap-1.5 text-slate-600">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasLower ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasDigit ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasDigit ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Special character</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 font-semibold' : ''}`}>
                    {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 py-2.5 text-sm font-semibold tracking-wide"
                isLoading={isLoading}
                disabled={!isFormValid || !token}
              >
                Reset Password
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-[#097C87] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
