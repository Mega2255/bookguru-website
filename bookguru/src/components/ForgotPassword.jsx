import React, { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const sendLink = async () => {
    const res = await axios.post(`${API}/api/auth/forgot-password`, { email });
    setMsg(res.data.message);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Forgot Password</h1>

      <input
        type="email"
        className="w-full border p-3 rounded mb-4"
        placeholder="Enter email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <button
        onClick={sendLink}
        className="w-full bg-green-700 text-white py-3 rounded"
      >
        Send Reset Link
      </button>

      {msg && <p className="mt-4 text-green-600">{msg}</p>}
    </div>
  );
}
