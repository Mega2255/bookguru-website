// GroupsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;


export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(null);
  const [members, setMembers] = useState([]);
  const token = localStorage.getItem("token");

  const loadGroups = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/groups`, { headers: { Authorization: `Bearer ${token}` }});
      setGroups(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadGroups(); }, []);

  const createOrUpdate = async () => {
    if (!title.trim()) return alert("Enter group title");
    try {
      if (editing) {
        await axios.put(`${API}/api/admin/groups/${editing.id}`, { title }, { headers: { Authorization: `Bearer ${token}` }});
        setEditing(null);
      } else {
        await axios.post(`${API}/api/admin/groups`, { title }, { headers: { Authorization: `Bearer ${token}` }});
      }
      setTitle("");
      loadGroups();
    } catch (err) { alert("Failed"); }
  };

  const removeGroup = async (id) => {
    if (!confirm("Delete group?")) return;
    await axios.delete(`${API}/api/admin/groups/${id}`, { headers: { Authorization: `Bearer ${token}` }});
    loadGroups();
  };

  const viewMembers = async (id) => {
    try {
      const res = await axios.get(`${API}/api/admin/groups/${id}/members`, { headers: { Authorization: `Bearer ${token}` }});
      setMembers(res.data);
    } catch (err) { alert("Failed to load members"); }
  };

  const removeUserFromGroup = async (groupId, userId) => {
    if (!confirm("Remove user from group?")) return;
    await axios.delete(`${API}/api/admin/groups/${groupId}/removeUser/${userId}`, { headers: { Authorization: `Bearer ${token}` }});
    viewMembers(groupId);
    loadGroups();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Groups</h2>

      <div className="flex gap-2 mb-4">
        <input className="border p-2 rounded flex-1" placeholder="Group title" value={title} onChange={e=>setTitle(e.target.value)} />
        <button onClick={createOrUpdate} className="bg-green-700 text-white px-4 py-2 rounded">{editing ? "Update" : "Create"}</button>
        {editing && <button onClick={()=>{ setEditing(null); setTitle(""); }} className="px-3 py-2 border rounded">Cancel</button>}
      </div>

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Members</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.id}>
                <td className="p-2 border">{g.id}</td>
                <td className="p-2 border">{g.title}</td>
                <td className="p-2 border">{g.members ?? 0}</td>
                <td className="p-2 border text-right space-x-2">
                  <button onClick={()=>{ setEditing(g); setTitle(g.title); }} className="px-2 py-1 bg-yellow-500 rounded text-sm">Edit</button>
                  <button onClick={()=>viewMembers(g.id)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Members</button>
                  <button onClick={()=>removeGroup(g.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members modal/panel */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Group Members</h3>
        {members.length === 0 ? (
          <div className="text-gray-500">Select a group and click "Members" to view members.</div>
        ) : (
          <div>
            <ul className="space-y-2">
              {members.map(m => (
                <li key={m.id} className="flex justify-between items-center border p-2 rounded">
                  <div>
                    <div className="font-medium">{m.username}</div>
                    <div className="text-sm text-gray-500">{m.email}</div>
                  </div>
                  <div>
                    <button onClick={() => removeUserFromGroup(m.groupId ?? members.groupId, m.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
