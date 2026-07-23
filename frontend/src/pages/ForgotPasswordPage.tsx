import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl"
      >
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiCheckCircle className="w-8 h-8 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Check your email</h1>
            <p className="text-muted-foreground mb-8">
              We've sent a password reset link to your email address. Please check your inbox.
            </p>
            <Link href="/login" className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg block text-center">
              Return to Sign In
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 w-fit transition-colors">
                <FiArrowLeft /> Back
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
              <p className="text-muted-foreground mt-2">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-70 flex justify-center items-center h-12 mt-6"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
