import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import VimixDarkLogo from '../images/VimixDark.png';
import VimixLightLogo from '../images/VimixLight.png';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/apiClient';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login({username,password});

      // You'll receive { token } from backend
      const { token,role,name } = res.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);

      // Call the onLogin callback to update authentication state
      onLogin();
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Invalid username or password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      {/* --- animated background (unchanged) --- */}
      <div className="absolute inset-0">
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

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl flex items-center justify-between">
          {/* Left Side */}
          <div className="hidden lg:flex flex-col justify-center flex-1 pr-12">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <img src={VimixLightLogo} alt="Vimix" className="h-12" />
              </div>
            </div>
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Welcome to <br />
                <span className="text-orange-300">Vimix CRM</span>
              </h1>
              <p className="text-xl mb-4 text-blue-100 font-medium">
                Your Next Business Growth Starts Here
              </p>
              <p className="text-lg text-blue-200 leading-relaxed max-w-lg">
                Streamline your client relationships, track your sales pipeline,
                and grow your business with our comprehensive CRM solution.
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full mx-auto max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <img src={VimixDarkLogo} alt="Vimix" className="h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Admin Login
                </h2>
              </div>

              {error && (
                <div className="mb-4 text-red-600 text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white"
                    placeholder="admin"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Logging in…' : 'Log in'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;