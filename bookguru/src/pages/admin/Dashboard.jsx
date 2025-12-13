// Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;


export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/api/admin/subscriptions/summary`, { headers: { Authorization: `Bearer ${token}` }});
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Daily Revenue</div>
          <div className="text-xl font-semibold">₦{(summary?.daily ?? 0).toLocaleString()}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Weekly Revenue</div>
          <div className="text-xl font-semibold">₦{(summary?.weekly ?? 0).toLocaleString()}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Monthly Revenue</div>
          <div className="text-xl font-semibold">₦{(summary?.monthly ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Quick Actions</h3>
        <p className="text-sm text-gray-600">Use the sidebar to manage Users, Groups, News, and Subscriptions.</p>
      </div>
    </div>
  );
}
