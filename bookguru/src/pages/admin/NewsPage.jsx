// NewsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;


export default function NewsPage() {
  const token = localStorage.getItem("token");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [news, setNews] = useState([]);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/news`, { headers: { Authorization: `Bearer ${token}` }});
      setNews(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!title.trim() || !content.trim()) return alert("Title & content required");
    const form = new FormData();
    form.append("title", title);
    form.append("content", content);
    if (image) form.append("image", image);

    try {
      await axios.post(`${API}/api/admin/news`, form, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }});
      setTitle(""); setContent(""); setImage(null);
      load();
    } catch (err) { console.error(err); alert("Failed to post news"); }
  };

  const remove = async (id) => {
    if (!confirm("Delete news?")) return;
    await axios.delete(`${API}/api/admin/news/${id}`, { headers: { Authorization: `Bearer ${token}` }});
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">News</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="w-full border p-2 rounded mb-2" />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Main content" className="w-full border p-2 rounded mb-2" rows={6} />
        <div className="flex items-center gap-3">
          <input type="file" onChange={e=>setImage(e.target.files[0])} />
          <button onClick={submit} className="bg-green-700 text-white px-4 py-2 rounded">Upload News</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">All News</h3>

        {news.length === 0 ? (
          <div className="text-gray-500">No news yet</div>
        ) : (
          <ul className="space-y-4">
            {news.map(n => (
              <li key={n.id} className="border p-3 rounded flex justify-between items-start">
                <div>
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm text-gray-600">{new Date(n.createdAt).toLocaleString()}</div>
                  <p className="mt-2 text-sm">{n.content?.slice(0, 180)}{n.content?.length > 180 ? "…" : ""}</p>
                  {n.imageUrl && <a href={`${API}${n.imageUrl}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600">View image</a>}
                </div>
                <div>
                  <button onClick={() => remove(n.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
