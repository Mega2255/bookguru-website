import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL; // use env variable

export default function UserHistory() {
  const token = localStorage.getItem("token");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!token) return;

    axios.get(`${API}/api/cbt/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setHistory(res.data))
    .catch(err => console.error(err));
  }, [token]);

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Your Last 5 CBT Attempts</h2>

      {history.length === 0 && (
        <p className="text-gray-600">No past attempts yet.</p>
      )}

      <ul className="space-y-3">
        {history.map(h => (
          <li key={h.id} className="border p-3 rounded flex justify-between">
            <div>
              <strong>{h.subject.name}</strong>
              <div className="text-sm text-gray-500">{new Date(h.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <strong>{h.score}/{h.total}</strong>
              <span className="ml-2 text-gray-500">({h.percentage}%)</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
