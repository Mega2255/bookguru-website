import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// ⬇️ Import AuthContext (IMPORTANT)
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // ⬇️ Use global auth state instead of localStorage
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // top of file, after imports


  // ======================================================
  // 📡 Fetch Subscription Status whenever user changes
  // ======================================================
  useEffect(() => {
    if (user) fetchSubscriptionStatus();
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${BACKEND_URL}/api/subscription/status`, {
  headers: { Authorization: `Bearer ${token}` }
});


      setSubscription(res.data);
    } catch (err) {
      console.error("Subscription status error:", err);
    }
  };

  // ======================================================
  // 🚪 Logout
  // ======================================================
  const handleLogout = () => {
    logout(); // ⬅️ Clears user globally
    setSubscription(null);
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link to="/" className="flex items-center">
            <span className="font-bold text-xl text-green-700">
              Book<span className="text-orange-600">Guru</span>
            </span>
          </Link>

          {/* ======================= */}
          {/* DESKTOP MENU */}
          {/* ======================= */}
          <nav className="hidden lg:flex items-center gap-4 text-xs font-medium">
            <Link to="/" className="hover:text-orange-600 transition whitespace-nowrap">Home</Link>
            <Link to="/cbt" className="hover:text-orange-600 transition whitespace-nowrap">CBT</Link>
            <Link to="/community" className="hover:text-orange-600 transition whitespace-nowrap">Community</Link>
            <Link to="/pastquestion" className="hover:text-orange-600 transition whitespace-nowrap">Past Question</Link>
            <Link to="/newspage" className="hover:text-orange-600 transition whitespace-nowrap">News</Link>

            {/* LOGGED IN */}
            {user ? (
              <>
                {/* USERNAME */}
                <span className="text-green-700 font-semibold text-xs whitespace-nowrap">
                  Welcome, {user.username}
                </span>

                {/* SUBSCRIPTION BADGE */}
                {subscription && (
                  <div className="px-2 py-1 rounded-lg text-xs font-semibold border bg-gray-50 border-gray-300 text-gray-700 whitespace-nowrap">
                    {subscription.active ? (
                      <>
                        <span className="text-green-700">ACTIVE</span> •
                        Exp: {new Date(subscription.expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </>
                    ) : (
                      <>
                        <span className="text-red-600">EXPIRED</span> •
                        <Link to="/subscribe" className="text-orange-600 underline">Renew</Link>
                      </>
                    )}
                  </div>
                )}

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition whitespace-nowrap"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg border border-green-700 text-green-700 text-xs hover:bg-green-50 transition whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold shadow-md hover:bg-orange-700 transition whitespace-nowrap"
                >
                  Join for Free
                </Link>
              </>
            )}
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            className="lg:hidden p-2 rounded-xl border border-gray-300 text-green-700 hover:bg-gray-50 transition"
            aria-label="toggle menu"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ======================= */}
      {/* MOBILE MENU */}
      {/* ======================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 pb-4 shadow-lg"
          >
            <div className="flex flex-col items-start px-4 space-y-3 pt-4 text-base font-medium">
              <Link to="/" className="hover:text-orange-600 w-full p-2 rounded transition" onClick={() => setIsOpen(false)}>Home</Link>
              <Link to="/cbt" className="hover:text-orange-600 w-full p-2 rounded transition" onClick={() => setIsOpen(false)}>CBT</Link>
              <Link to="/community" className="hover:text-orange-600 w-full p-2 rounded transition" onClick={() => setIsOpen(false)}>Community</Link>
              <Link to="/pastquestion" className="hover:text-orange-600 w-full p-2 rounded transition" onClick={() => setIsOpen(false)}>Past Question</Link>
              <Link to="/newspage" className="hover:text-orange-600 w-full p-2 rounded transition" onClick={() => setIsOpen(false)}>News</Link>

              {user ? (
                <>
                  <span className="text-green-700 font-semibold w-full p-2">
                    Welcome, {user.username}
                  </span>

                  {/* MOBILE SUBSCRIPTION */}
                  {subscription && (
                    <div className="w-full p-2 text-sm border rounded bg-gray-50">
                      {subscription.active ? (
                        <>
                          <span className="text-green-700 font-semibold">ACTIVE</span><br />
                          Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
                        </>
                      ) : (
                        <>
                          <span className="text-red-600 font-semibold">EXPIRED</span><br />
                          <Link to="/subscribe" className="text-orange-600 underline">Renew Now</Link>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full text-center mt-2 px-5 py-2 rounded-xl bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-orange-600 w-full p-2 rounded transition border-t border-gray-100 mt-2 pt-3" onClick={() => setIsOpen(false)}>Login</Link>
                  <Link
                    to="/register"
                    className="w-full text-center mt-2 px-5 py-2 rounded-xl bg-orange-600 text-white font-semibold shadow-md hover:bg-orange-700 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Join for Free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
