import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Subscription() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // ✅ use env variable

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/newsletter/subscribe`, { // ✅ replaced URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Subscription failed. Please try again.");
        setLoading(false);
        return;
      }

      // Success
      setSent(true);
      setEmail("");
      setLoading(false);

      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="py-12"
    >
      <div className="rounded-2xl bg-green-700 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        
        {/* Left text */}
        <div>
          <h3 className="text-3xl font-extrabold text-white">Unlock Your Exam Success</h3>
          <p className="text-green-200 mt-2 text-lg">
            Subscribe to get our exclusive <b>Top 5 CBT Tips</b> straight to your inbox.
          </p>
        </div>

        {/* Subscription Form */}
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your best email"
            className="px-5 py-3 rounded-lg border border-gray-300 w-full sm:w-64 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            required
            type="email"
          />

          <button
            className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-300 flex-shrink-0 disabled:opacity-70"
            disabled={sent || loading}
          >
            {loading
              ? "Submitting..."
              : sent
              ? "Success! Check your inbox"
              : "Get My Free Tips"}
          </button>
        </form>
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
    </motion.section>
  );
}
