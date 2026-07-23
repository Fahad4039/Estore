import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { generateOTP, localRegister, localSetSession } from '../lib/localAuth';

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name is required')
    .regex(/^[^\d]+$/, 'Name cannot contain numbers'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

/* ── Password strength ── */
function getStrength(p: string) {
  if (!p) return { score: 0, label: '', color: '' };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return { score: 1, label: 'Weak',   color: '#ef4444' };
  if (s === 2) return { score: 2, label: 'Fair',   color: '#f97316' };
  if (s === 3) return { score: 3, label: 'Good',   color: '#eab308' };
  return         { score: 4, label: 'Strong', color: '#22c55e' };
}

const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i <= score ? color : 'var(--border)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={label} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-xs font-medium" style={{ color }}>{label}</motion.p>
      </AnimatePresence>
    </div>
  );
};

/* ── Email status indicator ── */
type EmailStatus = 'idle' | 'checking' | 'available' | 'invalid';

const EmailStatusIcon: React.FC<{ status: EmailStatus }> = ({ status }) => (
  <AnimatePresence mode="wait">
    {status === 'checking' && (
      <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute right-3 top-1/2 -translate-y-1/2">
        <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
      </motion.div>
    )}
    {status === 'available' && (
      <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
        <FiCheck className="w-3 h-3 text-white stroke-[3]" />
      </motion.div>
    )}
    {status === 'invalid' && (
      <motion.div key="err" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
        <FiX className="w-3 h-3 text-white stroke-[3]" />
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── OTP 6-box input ── */
const OTPInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, idx) => idx === i ? '' : d).join('').slice(0, 6);
      onChange(next);
      if (i > 0) inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, idx) => idx === i ? char : d).join('');
    onChange(next);
    if (char && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-lg font-bold rounded-lg border bg-secondary/50 focus:outline-none transition-all
            ${d ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}
            focus:ring-2 focus:ring-primary focus:border-primary`}
        />
      ))}
    </div>
  );
};

/* ── Main component ── */
type Step = 'form' | 'otp' | 'success';

const RegisterPage: React.FC = () => {
  const { signUp, currentUser, setCurrentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // OTP state
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingData, setPendingData] = useState<RegisterFormValues | null>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);

  React.useEffect(() => {
    if (currentUser) setLocation('/dashboard');
  }, [currentUser, setLocation]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (emailTimer.current) clearTimeout(emailTimer.current);
    if (!val) { setEmailStatus('idle'); return; }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!valid) { setEmailStatus('invalid'); return; }
    setEmailStatus('checking');
    emailTimer.current = setTimeout(() => setEmailStatus('available'), 800);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      // Create user in localStorage but don't set session yet (wait for OTP)
      const user = localRegister(data.email, data.password, data.fullName);
      const code = generateOTP();
      setGeneratedOtp(code);
      setPendingData(data);
      setPendingUser(user);
      setResendCooldown(60);
      setStep('otp');
      toast({ title: "OTP Sent!", description: `A verification code has been sent to ${data.email}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Registration failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) { setOtpError('Enter all 6 digits'); return; }
    setOtpError('');
    // Activate session
    localSetSession(pendingUser);
    setCurrentUser(pendingUser);
    setStep('success');
    setTimeout(() => setLocation('/dashboard'), 1800);
  };

  const handleResend = () => {
    const code = generateOTP();
    setGeneratedOtp(code);
    setOtp('');
    setOtpError('');
    setResendCooldown(60);
    toast({ title: "New code generated!", description: "Demo mode — check below for code." });
  };

  const handleGoogleSignIn = () => {
    toast({ variant: 'destructive', title: 'Google sign-in requires Firebase', description: 'Add your Firebase config to enable Google login.' });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <AnimatePresence mode="wait">

        {/* ── Step 1: Registration form ── */}
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl"
          >
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4">E</div>
              <h1 className="text-2xl font-bold">Create an Account</h1>
              <p className="text-muted-foreground mt-2">Start your premium shopping journey</p>
            </div>

            <button type="button" onClick={handleGoogleSignIn}
              className="w-full py-3 bg-card hover:bg-secondary border border-border text-foreground font-medium rounded-lg transition-all flex items-center justify-center gap-2">
              <FcGoogle className="text-xl" /> Continue with Google
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground uppercase font-medium">Or register with email</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <input {...register('fullName')} autoComplete="name"
                    className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    placeholder="John Doe" />
                </div>
                {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <input {...register('email', { onChange: handleEmailChange })} type="email" autoComplete="email"
                    className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-10 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    placeholder="you@example.com" />
                  <EmailStatusIcon status={emailStatus} />
                </div>
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                {emailStatus === 'available' && !errors.email && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 text-xs mt-1">✓ Email looks good</motion.p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <input type={showPassword ? 'text' : 'password'}
                    {...register('password', { onChange: (e) => setPasswordValue(e.target.value) })}
                    autoComplete="new-password"
                    className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-11 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
                <PasswordStrengthMeter password={passwordValue} />
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-70 flex justify-center items-center h-12 mt-6">
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Create Account →'}
              </button>
            </form>

            <p className="text-center mt-8 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
          </motion.div>
        )}

        {/* ── Step 2: OTP Verification ── */}
        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl"
          >
            <button onClick={() => setStep('form')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
              <FiArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FiMail className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-bold">Verify your email</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Enter the 6-digit code sent to<br />
                <span className="font-semibold text-foreground">{pendingData?.email}</span>
              </p>
            </div>

            <OTPInput value={otp} onChange={v => { setOtp(v); setOtpError(''); }} />

            {otpError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-destructive text-sm text-center mt-3">{otpError}</motion.p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length < 6}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex justify-center items-center h-12 mt-6"
            >
              Verify & Create Account
            </button>

            <div className="text-center mt-4">
              {resendCooldown > 0 ? (
                <p className="text-sm text-muted-foreground">Resend code in <span className="font-bold text-foreground">{resendCooldown}s</span></p>
              ) : (
                <button onClick={handleResend} className="text-sm text-primary hover:underline font-medium">
                  Resend Code
                </button>
              )}
            </div>

            <div className="text-center mt-3">
              <button
                onClick={() => {
                  localSetSession(pendingUser);
                  setCurrentUser(pendingUser);
                  setStep('success');
                  setTimeout(() => setLocation('/dashboard'), 1800);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Skip verification
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Success ── */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-12 shadow-2xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 15 }}
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiCheck className="w-10 h-10 text-green-500 stroke-[2.5]" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">You're in! 🎉</h1>
            <p className="text-muted-foreground">Account created. Redirecting to your dashboard…</p>
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;
