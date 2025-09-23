import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { signIn, signUp, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await signUp(email, password);
      }
      navigate('/');
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    try {
      await signInAnonymously();
      navigate('/');
    } catch (error: any) {
      setError(error.message || 'Failed to continue as guest');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">NagarSetu</h1>
          <p className="text-neutral-600">Report civic problems efficiently</p>
        </div>

        {/* Auth Form */}
        <div className="card">
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-center font-medium rounded-lg transition-colors ${
                isLogin
                  ? 'bg-primary-800 text-white'
                  : 'text-neutral-600 hover:text-primary-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-center font-medium rounded-lg transition-colors ${
                !isLogin
                  ? 'bg-primary-800 text-white'
                  : 'text-neutral-600 hover:text-primary-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="input-field pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : null}
              {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-neutral-300"></div>
            <span className="px-4 text-sm text-neutral-500">OR</span>
            <div className="flex-1 h-px bg-neutral-300"></div>
          </div>

          {/* Guest Mode */}
          <button
            onClick={handleGuestMode}
            className="btn-outline w-full"
          >
            Continue as Guest
          </button>

          {/* Info */}
          <div className="mt-6 text-center text-sm text-neutral-500">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="text-center text-xs text-neutral-500 mt-6 space-y-1">
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">
              Privacy Policy
            </a>
          </p>
          <p>Guest users can submit reports but won't receive notifications</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;






