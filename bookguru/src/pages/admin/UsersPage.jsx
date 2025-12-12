// UsersPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all / subscribed / not_subscribed
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined }
      });

      // if backend returns subscriptions info separately, you could merge here
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch users");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const removeUser = async (id) => {
    if (!confirm("Delete user?")) return;
    await axios.delete(`${API}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` }});
    load();
  };

  // Remove user from a specific group (UI prompts for group id)
  const removeFromGroup = async (userId) => {
    const groupId = prompt("Enter groupId to remove user from:");
    if (!groupId) return;
    try {
      await axios.delete(`${API}/api/admin/groups/${groupId}/removeUser/${userId}`, { headers: { Authorization: `Bearer ${token}` }});
      alert("User removed from group");
    } catch (err) { alert("Failed to remove user"); }
  };

  const filtered = users.filter(u => {
    if (filter === "all") return true;
    if (filter === "subscribed") return u.subscriptions && u.subscriptions.length > 0;
    if (filter === "not") return !u.subscriptions || u.subscriptions.length === 0;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Users</h2>

        <div className="flex items-center gap-2">
          <input className="border px-3 py-2 rounded" placeholder="Search name or email" value={search} onChange={e=>setSearch(e.target.value)} />
          <button onClick={load} className="bg-green-700 text-white px-4 py-2 rounded">Search</button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <select className="border p-2 rounded" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All users</option>
          <option value="subscribed">Subscribed</option>
          <option value="not">Not Subscribed</option>
        </select>
        <button onClick={load} className="text-sm text-gray-600">Refresh</button>
      </div>

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Username</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Subscribed</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={5}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-4" colSpan={5}>No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td className="p-2 border">{u.id}</td>
                <td className="p-2 border">{u.username}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{(u.subscriptions && u.subscriptions.length) ? "Yes" : "No"}</td>
                <td className="p-2 border text-right space-x-2">
                  <button onClick={()=>removeFromGroup(u.id)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Remove from Group</button>
                  <button onClick={()=>removeUser(u.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
