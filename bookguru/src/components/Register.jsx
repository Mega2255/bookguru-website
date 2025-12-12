import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ---------------------------------------------
   OPTIMIZED & MEMOIZED INPUT COMPONENT
   (Prevents lag by stopping unnecessary re-renders)
---------------------------------------------- */
const FormInput = React.memo(function FormInput({
  icon: Icon,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = true
}) {
  return (
    <div className="relative">
      <Icon
        size={20}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 transition shadow-sm"
      />
    </div>
  );
});

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Optimized input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent re-render if value is unchanged
    setFormData((prev) => {
      if (prev[name] === value) return prev;
      return { ...prev, [name]: value };
    });
  };

  // Validation
  const validateForm = () => {
    const { fullName, username, email, password, confirmPassword } = formData;

    if (!fullName || !username || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password must match.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      console.log('✅ Registration successful:', res.data);
      setSuccess(true);
      setError('');

      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Registration failed. Try another email.');
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
      className="py-12 flex items-center justify-center min-h-[80vh] bg-gray-50"
    >
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6">

        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100"
        >
          <h2 className="text-3xl font-extrabold text-green-700 text-center mb-2">
            Create Your Account
          </h2>

          <p className="text-gray-600 text-center mb-8">
            Join BookGuru today and start preparing for success.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              icon={User}
              name="fullName"
              placeholder="Full Name (e.g., Daniel Oghenemega)"
              value={formData.fullName}
              onChange={handleChange}
            />

            <FormInput
              icon={User}
              name="username"
              placeholder="Username (e.g., Mega223)"
              value={formData.username}
              onChange={handleChange}
            />

            <FormInput
              icon={Mail}
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
            />

            <FormInput
              icon={Lock}
              name="password"
              type="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
            />

            <FormInput
              icon={Lock}
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-3 text-sm text-red-800 rounded-lg bg-red-100"
              >
                <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                <div>{error}</div>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-3 text-sm text-green-800 rounded-lg bg-green-100"
              >
                <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                <div>Registration successful! Redirecting to login...</div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-lg font-semibold rounded-xl transition duration-300 shadow-lg ${
                loading
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 
                      12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing Up...
                </span>
              ) : (
                'Sign Up'
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-green-700 hover:text-orange-600 transition"
            >
              Log In Here
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
