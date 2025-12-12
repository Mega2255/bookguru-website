import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// ⬇️ NEW — import AuthContext
import { useAuth } from '../AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ⬇️ NEW — get global login() from AuthContext
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send login data to backend
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      console.log('✅ Login successful:', res.data);

      // ⬇️ SAVE TOKEN (still ok to save here)
      localStorage.setItem('token', res.data.token);

      // ⬇️ MOST IMPORTANT PART: update global user state
      login(res.data.user);   // 🔥 Navbar updates instantly!

      // Redirect to homepage
      navigate('/');

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Server not reachable. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center items-center min-h-[calc(100vh-14rem)] py-12"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-green-700">Welcome Back</h2>
          <p className="mt-2 text-gray-600">
            Sign in to access your BookGuru experience.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 border border-gray-100 rounded-2xl shadow-xl">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50"
            >
              <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.name@example.com"
                  required
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 transition"
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition duration-200 shadow-md ${
                loading ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {loading ? 'Logging In...' : (
                <span className="flex items-center justify-center">
                  <LogIn size={20} className="mr-2"/> Log In
                </span>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{' '}
            <Link to="/register" className="font-semibold text-green-700 hover:text-green-600 transition">
              Sign up for free
            </Link>
          </p>
        </div>
        <div className="text-right mt-2">
  <a href="/forgot-password" className="text-blue-600 underline">
    Forgot Password?
  </a>
</div>

      </div>
    </motion.section>
  );
}
