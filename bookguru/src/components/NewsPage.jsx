// NewsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const SOCKET_URL = API; // socket server URL

export default function NewsPage() {
  const token = localStorage.getItem("token");
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);

  // Search, filters, pagination
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Load news from backend
  const loadNews = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/api/admin/news`, { headers });

      const normalized = (res.data || []).map(n => ({
        ...n,
        category: n.category?.trim() || "General",
      }));

      normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNews(normalized);
    } catch (err) {
      console.error("Failed to fetch news:", err?.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadNews();

    const socket = io(SOCKET_URL, { auth: token ? { token } : {} });

    socket.on("connect_error", (err) => console.warn("Socket connect error:", err.message));

    socket.on("newsCreated", (newItem) => {
      if (!newItem) return;
      setNews(prev => {
        if (prev.find(n => n.id === newItem.id)) return prev;
        return [newItem, ...prev].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
    });

    socket.on("newsDeleted", (id) => setNews(prev => prev.filter(n => n.id !== id)));
    socket.on("newsUpdated", (item) => setNews(prev => prev.map(n => n.id === item.id ? item : n)));

    return () => socket.disconnect();
  }, [token]);

  // Derived categories
  const categories = useMemo(() => {
    const set = new Set(["All"]);
    news.forEach(n => set.add(n.category || "General"));
    return Array.from(set);
  }, [news]);

  // Filter + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news.filter(n => {
      if (activeCategory !== "All" && (n.category || "General") !== activeCategory) return false;
      if (!q) return true;
      const title = (n.title || "").toLowerCase();
      const content = (n.content || "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [news, activeCategory, query]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [totalPages]);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  // UI actions
  const openModal = (item) => setSelectedNews(item);
  const closeModal = () => setSelectedNews(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <header className="py-8 text-center bg-green-700 rounded-b-3xl mb-8 shadow-xl">
        <h1 className="text-4xl font-extrabold text-white">Latest <span className="text-orange-400">News</span></h1>
        <p className="mt-2 text-green-200 max-w-2xl mx-auto">Official announcements, updates and resources.</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search + Categories */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by title or content..."
              className="w-full sm:w-[420px] px-4 py-2 border rounded-lg"
            />
            <button onClick={() => { setQuery(""); setActiveCategory("All"); }} className="px-3 py-2 border rounded-lg">Reset</button>
          </div>
          <div className="flex gap-2 overflow-x-auto py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === cat ? "bg-orange-600 text-white" : "bg-gray-100"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News list */}
        <section className="grid gap-6">
          {pageItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No news found.</div>
          ) : (
            pageItems.map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center p-5 rounded-xl border bg-white shadow hover:shadow-lg cursor-pointer"
                onClick={() => openModal(n)}
              >
                {n.imageUrl ? (
                  <div className="hidden sm:block w-28 h-20 mr-4 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={`${API}${n.imageUrl}`} alt={n.title} className="w-full h-full object-cover" />
                  </div>
                ) : <div className="hidden sm:block w-28 h-20 mr-4 rounded-lg bg-gray-100 flex-shrink-0" />}

                <div className="flex-grow">
                  <div className="text-xs text-gray-500 flex items-center gap-3 mb-1">
                    <span className="flex items-center"><Clock size={12} className="mr-1" /> {new Date(n.createdAt).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">{n.category || "General"}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800">{n.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.content?.slice(0, 180) || ""}{(n.content || "").length > 180 ? "…" : ""}</p>
                </div>

                <div className="ml-4 flex flex-col items-end gap-2">
                  <button onClick={() => openModal(n)} className="text-orange-600 font-semibold flex items-center gap-2">
                    <span className="hidden md:inline">Read more</span>
                    <ArrowRight />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </section>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded bg-gray-100 disabled:opacity-50">
            <ChevronLeft />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-orange-600 text-white" : "bg-gray-100"}`}>
              {i + 1}
            </button>
          ))}

          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded bg-gray-100 disabled:opacity-50">
            <ChevronRight />
          </button>
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="bg-white rounded-2xl max-w-2xl w-full overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              {selectedNews.imageUrl && <img src={`${API}${selectedNews.imageUrl}`} alt={selectedNews.title} className="w-full h-56 object-cover rounded-t-2xl" />}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <Calendar size={14} className="text-orange-600" />
                    {new Date(selectedNews.createdAt).toLocaleString()}
                  </div>
                  <button onClick={closeModal} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><X /></button>
                </div>
                <h2 className="text-2xl font-bold text-green-800 mb-3">{selectedNews.title}</h2>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNews.content}</div>
                {selectedNews.document && (
                  <div className="mt-4">
                    <a href={selectedNews.document} target="_blank" rel="noreferrer" className="text-orange-600 font-semibold">Download attached document</a>
                  </div>
                )}
                <div className="mt-6 text-right">
                  <button onClick={closeModal} className="px-4 py-2 rounded bg-orange-600 text-white">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
