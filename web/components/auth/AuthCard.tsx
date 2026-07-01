'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  Check
} from 'lucide-react';

interface AuthCardProps {
  onSuccess: () => void;
}

export default function AuthCard({ onSuccess }: AuthCardProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Error States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Dynamic Password Strength Evaluation
  const evaluatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-zinc-800' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2: return { score: 50, label: 'Medium', color: 'bg-amber-500' };
      case 3: return { score: 75, label: 'Strong', color: 'bg-emerald-500' };
      case 4: return { score: 100, label: 'Elite', color: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' };
      default: return { score: 0, label: 'None', color: 'bg-zinc-800' };
    }
  };

  const passwordStrength = evaluatePasswordStrength(password);

  // Validation Action
  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      tempErrors.email = 'Corporate email is required';
    } else if (!emailRegex.test(email)) {
      tempErrors.email = 'Provide a valid corporate email';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Must be at least 6 characters';
    }

    if (!isLogin) {
      if (!name.trim()) {
        tempErrors.name = 'Full name is required';
      }
      if (password !== confirmPassword) {
        tempErrors.confirmPassword = 'Passwords do not match';
      }
      if (!agreeTerms) {
        tempErrors.terms = 'You must authorize security guidelines';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate real high-speed Firebase authentication token validation
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1800);
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    // Simulate OAuth2 popup flow with federated tokens
    setTimeout(() => {
      setIsGoogleLoading(false);
      onSuccess();
    }, 2000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* 1. Backdrop Ambient glow circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-cyber-blue to-cyber-cyan opacity-20 blur-[60px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-gradient-to-br from-cyber-purple to-cyber-pink opacity-25 blur-[60px] rounded-full pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 glass-card rounded-3xl p-8 backdrop-blur-2xl border border-white/[0.08]"
      >
        {/* Enclave Status Header */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
              Secure Enclave Active
            </span>
          </div>
        </div>

        {/* Dynamic Titles */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            {isLogin ? 'Access Workspace' : 'Setup Profile'}
          </h1>
          <p className="text-xs text-zinc-400 px-4">
            {isLogin 
              ? 'Authorized dashboard for advanced real-time interview simulations' 
              : 'Configure sandbox credentials and deploy your AI pipeline'
            }
          </p>
        </div>

        {/* Dynamic Form Loader State */}
        <AnimatePresence mode="wait">
          {isLoading || isGoogleLoading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-2 border-cyan-500/10 border-t-cyan-400 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-white mb-1.5">
                {isLoading ? 'Authorizing secure access...' : 'Initiating OAuth2 handshake...'}
              </p>
              <p className="text-[11px] text-zinc-500">
                {isLoading ? 'Decrypting profile payload' : 'Verifying federated SSO parameters'}
              </p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Full Name input (Signup only) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-[11px] font-bold tracking-wide text-zinc-400 mb-1.5 uppercase">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setErrors(prev => ({ ...prev, name: '' }));
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input bg-white/[0.02] border border-white/[0.08] focus:border-cyan-400/50 text-white outline-none"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                        <AlertTriangle className="w-3 h-3" /> {errors.name}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold tracking-wide text-zinc-400 mb-1.5 uppercase">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input bg-white/[0.02] border border-white/[0.08] focus:border-cyan-400/50 text-white outline-none"
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertTriangle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold tracking-wide text-zinc-400 mb-1.5 uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm glass-input bg-white/[0.02] border border-white/[0.08] focus:border-cyan-400/50 text-white outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertTriangle className="w-3 h-3" /> {errors.password}
                  </p>
                )}

                {/* Password Strength Analyzer (Signup only) */}
                {!isLogin && password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">Security Index</span>
                      <span className="font-bold text-zinc-300">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password input (Signup only) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-[11px] font-bold tracking-wide text-zinc-400 mb-1.5 uppercase">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm glass-input bg-white/[0.02] border border-white/[0.08] focus:border-cyan-400/50 text-white outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                        <AlertTriangle className="w-3 h-3" /> {errors.confirmPassword}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms Checklist (Signup only) */}
              {!isLogin && (
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }}
                      className="mt-0.5 rounded border-white/[0.08] bg-zinc-900 text-cyan-500 focus:ring-0 outline-none"
                    />
                    <span className="text-[11px] text-zinc-400 leading-normal">
                      I authorize AI sandbox workspace provisioning under active corporate confidentiality guidelines.
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="text-[10px] text-rose-400 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3" /> {errors.terms}
                    </p>
                  )}
                </div>
              )}

              {/* Forgot password trigger (Login only) */}
              {isLogin && (
                <div className="flex justify-end pt-1">
                  <button 
                    type="button"
                    onClick={() => alert("Secret key instructions dispatched to your email address.")}
                    className="text-[11px] font-bold text-cyan-400 hover:underline outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                className="w-full group mt-6 bg-gradient-to-r from-cyber-blue to-cyan-400 hover:from-cyan-400 hover:to-cyber-blue py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none"
              >
                <span>{isLogin ? 'Authorize Credentials' : 'Deploy Pipeline Account'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Federated Login Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-[1px] flex-1 bg-white/[0.05]" />
          <span className="text-[9px] font-extrabold tracking-widest text-zinc-500 uppercase">
            Federated Passkey ID
          </span>
          <div className="h-[1px] flex-1 bg-white/[0.05]" />
        </div>

        {/* Beautiful Google Federated Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] text-white transition-all outline-none"
        >
          {/* Custom Google Visual G */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google Core Account</span>
        </button>

        {/* Dynamic Account Switch Toggles */}
        <div className="text-center mt-6">
          <p className="text-xs text-zinc-500">
            {isLogin ? 'New secure operator?' : 'Already enrolled inside the pipeline?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="ml-1.5 font-bold text-cyber-purple hover:underline outline-none"
            >
              {isLogin ? 'Register Credentials' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
