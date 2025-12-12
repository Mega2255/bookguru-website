import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
      password,
    });

    setMsg(res.data.message);
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 shadow rounded">
      <h1 className="text-xl font-bold mb-4">Reset Password</h1>

      <input
        type="password"
        className="w-full border p-3 rounded mb-4"
        placeholder="Enter new password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button
        onClick={submit}
        className="w-full bg-orange-600 text-white py-3 rounded"
      >
        Reset Password
      </button>

      {msg && <p className="text-green-600 mt-4">{msg}</p>}
    </div>
  );
}
