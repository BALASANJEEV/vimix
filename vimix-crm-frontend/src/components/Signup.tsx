import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import VimixDarkLogo from '../images/VimixDark.png';
import VimixLightLogo from '../images/VimixLight.png';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../services/apiClient';

interface SignupProps {
  onLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'admin',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signup({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      });

      const { token, role, name } = res.data;
      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('role', role || formData.role);
        localStorage.setItem('name', name || formData.name || formData.username);

        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          onLogin();
          navigate('/dashboard');
        }, 1000);
      } else {
        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 py-8">
      {/* Decorative animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400 rounded-full opacity-20 transform translate-x-32 -translate-y-32"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-500 transform rotate-45 opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400 transform rotate-12 opacity-15 translate-x-48 translate-y-48"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-400 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-0 w-24 h-24 bg-blue-300 transform -translate-x-12 opacity-25"></div>
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Side Info */}
          <div className="hidden lg:flex flex-col justify-center flex-1 pr-12 text-white">
            <div className="mb-6">
              <img src={VimixLightLogo} alt="Vimix" className="h-12" />
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Join <span className="text-orange-300">Vimix CRM</span>
            </h1>
            <p className="text-xl mb-4 text-blue-100 font-medium">
              Start scaling your client relationships today
            </p>
            <p className="text-lg text-blue-200 leading-relaxed max-w-lg mb-8">
              Create your account to gain full access to client management, project pipeline tracking, automated analytics, and payment tracking.
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-blue-100">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <span>Modern MongoDB Cloud Database Integration</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <span>Instant Project Stage & Payment Monitoring</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <span>Role-based Partner & Admin Access Controls</span>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-3">
                  <img src={VimixDarkLogo} alt="Vimix" className="h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Create an Account
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in your details to get started
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium text-center">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium text-center">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm"
                      placeholder="johndoe"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1"
                    >
                      Account Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="partner">Partner</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white text-sm"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 mt-6 shadow-md hover:shadow-lg"
                >
                  <UserPlus size={18} />
                  <span>{isLoading ? 'Creating Account…' : 'Sign Up'}</span>
                </button>
              </form>

              <div className="mt-6 text-center border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 hover:text-purple-600 transition-colors"
                  >
                    Log in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
