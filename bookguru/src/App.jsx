import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// --------------------------------------
// USER COMPONENTS
// --------------------------------------
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhatWeOffer from './components/WhatWeOffer';
import WhyChooseUs from './components/WhyChooseUs';
import LatestNews from './components/LatestNews';
import Subscription from './components/Subscription';
import Footer from './components/Footer';
import Community from './components/Community';
import Pastquestion from './components/Pastquestion';
import Register from './components/Register';
import Login from './components/Login';
import NewsPage from './components/NewsPage';
import CBTPage from './components/CBTPage';
import UserHistory from "./components/UserHistory";
import Subscribe from "./components/Subscribe";
import SubscriptionSuccess from "./components/SubscriptionSuccess";
import ResetPassword from "./components/ResetPassword";
import ForgotPassword from "./components/ForgotPassword";



// ADMIN COMPONENTS
// --------------------------------------
import AdminApp from './pages/admin/AdminApp';
import Dashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/UsersPage';
import GroupsPage from './pages/admin/GroupsPage';
import NewsPageAdmin from './pages/admin/NewsPage';
import SubscriptionsPage from './pages/admin/SubscriptionsPage';
import AdminCBT from './pages/admin/AdminCBT';


// ======================================================
//                HOMEPAGE POPUP ADS
// ======================================================
function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [currentAd, setCurrentAd] = useState(0);
  const [progress, setProgress] = useState(0);

  // swipe refs must always be initialized
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const ads = [
    {
      img: "https://images.unsplash.com/photo-1593642634367-d91a135587b5?auto=format&fit=crop&w=600&q=80",
      title: "Want to Learn a Tech Skill?",
      desc: "Join our fast–growing WhatsApp tech learning community.",
      link: "https://wa.me/2348108745980",
      color: "green-600",
    },
    {
      img: "https://images.unsplash.com/photo-1581091012184-0c2b2c67b53f?auto=format&fit=crop&w=600&q=80",
      title: "Are You a Final Year Student?",
      desc: "Get complete guidance for your final year project — fast & reliable.",
      link: "https://wa.me/2348108745980",
      color: "orange-600",
    },
  ];

  // Show popup only once per day
  useEffect(() => {
    const dismissedToday = localStorage.getItem("promoDismissedDate");
    const today = new Date().toDateString();
    if (dismissedToday !== today) {
      setVisible(true);
      setCurrentAd(0);
    }
  }, []);

  // Slide ads every 20s
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCurrentAd(prev => (prev + 1) % ads.length);
      setProgress(0);
    }, 20000);
    return () => clearInterval(interval);
  }, [visible]);

  // Countdown bar
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.5, 100));
    }, 100);
    return () => clearInterval(timer);
  }, [visible, currentAd]);

  // Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    if (touchEndX.current < touchStartX.current - 50) {
      setCurrentAd((prev) => (prev + 1) % ads.length);
      setProgress(0);
    }
    if (touchEndX.current > touchStartX.current + 50) {
      setCurrentAd((prev) => (prev - 1 + ads.length) % ads.length);
      setProgress(0);
    }
  };

  const handleClose = (dontShowToday = false) => {
    if (dontShowToday) {
      localStorage.setItem("promoDismissedDate", new Date().toDateString());
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      >
        <motion.div
          key={currentAd}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative overflow-hidden"
        >
          <button onClick={() => handleClose()} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100">
            <X size={22} />
          </button>

          <button onClick={() => handleClose(true)} className="absolute top-4 left-4 text-sm text-gray-500 underline">
            Do not show again today
          </button>

          <div className="text-center space-y-4">
            <img src={ads[currentAd].img} className="rounded-xl shadow" alt="" />
            <h2 className={`text-2xl font-bold text-${ads[currentAd].color}`}>{ads[currentAd].title}</h2>
            <p className="text-gray-700">{ads[currentAd].desc}</p>
            <a href={ads[currentAd].link} target="_blank" className={`block w-full bg-${ads[currentAd].color} hover:bg-${ads[currentAd].color}-700 text-white py-3 rounded-xl font-semibold shadow`}>
              Learn More
            </a>
          </div>

          <div className="w-full h-1 bg-gray-300 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${progress}%`, transition: "width 0.1s linear" }} />
          </div>

          <div className="text-center mt-2 text-sm text-gray-500">
            {currentAd + 1}/{ads.length} Ads
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


// ======================================================
//                HOMEPAGE WRAPPER
// ======================================================
function HomePageContent() {
  return (
    <>
      <PromoPopup /> {/* Popup appears on homepage */}
      <Hero />
      <WhatWeOffer />
      <WhyChooseUs />
      <LatestNews />
      <Subscription />
    </>
  );
}

// ======================================================
//                MAIN APP
// ======================================================
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900">

        {/* Navbar for all user pages */}
        <Navbar />

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>

            {/* USER / PUBLIC ROUTES */}
            <Route path="/" element={<HomePageContent />} />
            <Route path="/community" element={<Community />} />
            <Route path="/pastquestion" element={<Pastquestion />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/newspage" element={<NewsPage />} />
            <Route path="/cbt" element={<CBTPage />} />
            <Route path="/history" element={<UserHistory />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/subscription-success" element={<SubscriptionSuccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />



            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<AdminApp />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="news" element={<NewsPageAdmin />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="cbt" element={<AdminCBT />} />
            </Route>

          </Routes>
        </main>

        {/* Footer shown only for user pages */}
        <Footer />

      </div>
    </Router>
  );
}
