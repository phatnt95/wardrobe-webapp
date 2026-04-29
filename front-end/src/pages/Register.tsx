import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, Loader2, CheckCircle2, XCircle } from 'lucide-react';

import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import type { RegisterDto } from '../api/model';

import { authControllerRegister  } from '../api/endpoints/auth/auth';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Password strength indicator thresholds
const checkPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Weak', color: 'bg-red-400' },
    { score: 2, label: 'Fair', color: 'bg-orange-400' },
    { score: 3, label: 'Good', color: 'bg-yellow-400' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
  ];
  return levels[score] ?? levels[0];
};

export const Register = () => {
  const navigate = useNavigate();
  const login = useStore((state) => state.login);

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'email') setEmailError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: RegisterDto = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      };

      const response = await authControllerRegister(payload);
      const token = (response as unknown as { access_token: string }).access_token;

      if (token) {
        localStorage.setItem('token', token);
        const decoded = JSON.parse(atob(token.split('.')[1]));
        login({ id: decoded.sub, name: form.email, username: form.email });
        toast.success('Account created! Welcome 🎉');
        navigate('/');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })
        ?.response?.status;
      if (status === 409) {
        setEmailError('This email is already registered. Try logging in instead.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const strength = checkPasswordStrength(form.password);
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-surface p-8 rounded-3xl shadow-soft-lg border border-gray-100">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center mb-4 text-primary-600 shadow-inner">
            <Shirt className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-sm text-gray-500">Join to organize your wardrobe smartly</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={form.firstName}
                onChange={handleChange('firstName')}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={form.lastName}
                onChange={handleChange('lastName')}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange('email')}
              className={`appearance-none rounded-xl relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                emailError
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-200 focus:ring-primary-500'
              }`}
              placeholder="john@example.com"
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange('password')}
              className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Create a password"
            />
            {/* Strength bar */}
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        seg <= strength.score ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">Strength: <span className="font-medium">{strength.label}</span></p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className={`appearance-none rounded-xl relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-10 ${
                  passwordsMismatch
                    ? 'border-red-400 focus:ring-red-400'
                    : passwordsMatch
                    ? 'border-green-400 focus:ring-green-400'
                    : 'border-gray-200 focus:ring-primary-500'
                }`}
                placeholder="Repeat your password"
              />
              {passwordsMatch && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
              {passwordsMismatch && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none ring-2 ring-primary-500 ring-offset-2 transition-all shadow-md mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500">Already have an account? </span>
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
