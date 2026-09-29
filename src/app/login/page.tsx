'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Check, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth?.() || {};

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        if (signIn) await signIn(email, password);
      } else {
        if (signUp) await signUp(email, password, fullName);
      }
      router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#0A0A0C] text-foreground flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-violet selection:text-white">
      {/* 1. Dynamic Poster Backdrop Collage (Bulletproof URLs & High Visibility) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 scale-105 opacity-50 filter saturate-120 contrast-110">
          {[
            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=600&auto=format&fit=crop',
          ].map((poster, index) => (
            <div key={index} className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={poster} 
                alt="Cinematic Poster" 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Cinematic Radial Vignette Overlay */}
        <div 
          className="absolute inset-0 z-10"
          style={{
            background: 'radial-gradient(circle at center, rgba(10,10,12,0.45) 0%, rgba(10,10,12,0.85) 70%, #0A0A0C 100%)'
          }}
        />
      </div>

      {/* 2. Layered Ambient Lighting */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] pointer-events-none rounded-full opacity-40 blur-[130px] z-10"
        style={{
          background: 'radial-gradient(circle, rgba(123,47,255,0.45) 0%, rgba(0,212,255,0.18) 55%, transparent 75%)',
        }}
      />

      {/* 3. Main Glass Form Container */}
      <div className="relative z-20 w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet to-violet-light flex items-center justify-center shadow-[0_0_25px_rgba(123,47,255,0.5)] group-hover:scale-105 transition-transform duration-200">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
              Stream
            </span>
          </Link>
        </div>

        {/* Auth Glass Card */}
        <div className="rounded-3xl p-8 bg-black/60 border border-white/10 backdrop-blur-2xl shadow-[0_30px_70px_rgba(0,0,0,0.85)]">
          {/* Mode Switcher Tabs */}
          <div className="relative p-1 mb-8 rounded-xl bg-white/[0.05] border border-white/10 flex">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                mode === 'signin'
                  ? 'bg-violet text-white shadow-lg shadow-violet/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-violet text-white shadow-lg shadow-violet/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field (Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & High-Contrast Forgot Password */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      rememberMe
                        ? 'bg-violet border-violet text-white'
                        : 'border-white/20 bg-white/[0.04] group-hover:border-violet'
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <span className="text-xs text-zinc-300 group-hover:text-white transition-colors font-medium">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs text-violet-light hover:text-white font-semibold transition-colors drop-shadow-sm"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-violet to-violet-light hover:brightness-110 text-white shadow-[0_0_20px_rgba(123,47,255,0.4)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#0A0A0C] text-[10px] font-bold uppercase tracking-widest text-zinc-400 rounded-full border border-white/5">
              Or continue with
            </span>
          </div>

          {/* High-Contrast Social Sign-In Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 hover:bg-white/[0.1] hover:border-white/30 transition-all text-xs font-semibold text-zinc-100 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 hover:bg-white/[0.1] hover:border-white/30 transition-all text-xs font-semibold text-zinc-100 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 0.6-2.65 1.36-.58.67-1.09 1.74-.95 2.78 1.01.08 2.05-.54 2.68-1.29z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stream</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
