import React, { useState } from "react";
import axios from "axios";

export default function Subscribe() {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // ✅ use env variable

  const startPayment = async (plan) => {
    if (!token) return alert("You must be logged in");

    try {
      setLoading(true);

      const res = await axios.post(
        `${BACKEND_URL}/api/subscription/create`, // ✅ replaced URL
        { plan },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Redirect user to Paystack checkout
      window.location.href = res.data.authorization_url;

    } catch (error) {
      console.error("Payment Error:", error);
      alert(
        error.response?.data?.message || "Unable to start payment. Try again."
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center mb-6">
          Choose a Subscription Plan
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* MONTHLY */}
          <div className="bg-white rounded-xl shadow p-6 border hover:shadow-lg transition">
            <h2 className="text-xl font-semibold">Monthly Plan</h2>
            <p className="text-gray-600 mt-2">Get full access for 30 days.</p>

            <div className="mt-4">
              <p className="text-3xl font-bold">₦500</p>
              <p className="text-gray-400 text-sm">per month</p>
            </div>

            <button
              onClick={() => startPayment("monthly")}
              disabled={loading}
              className="mt-5 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              {loading ? "Processing..." : "Subscribe Monthly"}
            </button>
          </div>

          {/* YEARLY */}
          <div className="bg-white rounded-xl shadow p-6 border hover:shadow-lg transition">
            <h2 className="text-xl font-semibold">Yearly Plan</h2>
            <p className="text-gray-600 mt-2">
              Save more with a 12-month full access plan.
            </p>

            <div className="mt-4">
              <p className="text-3xl font-bold">₦1500</p>
              <p className="text-gray-400 text-sm">per year (Best value)</p>
            </div>

            <button
              onClick={() => startPayment("yearly")}
              disabled={loading}
              className="mt-5 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              {loading ? "Processing..." : "Subscribe Yearly"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
