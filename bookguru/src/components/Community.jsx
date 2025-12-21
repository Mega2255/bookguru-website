// Community.jsx - FIXED VERSION (with promo check)
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  MessageSquare,
  Send,
  Paperclip,
  ChevronLeft,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_BACKEND_URL;

// small helper: deterministic color per string
function getColorFromString(str) {
  if (!str) return "#9CA3AF";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef6aa8"];
  return colors[Math.abs(hash) % colors.length];
}

function initialsFromName(name) {
  if (!name) return "G";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Community() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // ---- 🔥 FIXED: Add access control ----
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  // sockets / lists / UI
  const [socket, setSocket] = useState(null);
  const [groups, setGroups] = useState([]);
  const [dmList, setDmList] = useState([]);
  const [activeTab, setActiveTab] = useState("groups");
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messageText, setMessageText] = useState("");
  const [file, setFile] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);

  // unread counts
  const [unreadCounts, setUnreadCounts] = useState({});

  // scroll / UI helpers
  const messagesRef = useRef();
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // typing timeout ref
  const typingTimeoutRef = useRef(null);

  // ---- 🔥 FIXED: CHECK PROMO FIRST, THEN SUBSCRIPTION ----
  useEffect(() => {
    const checkAccess = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // ✅ STEP 1: Check if promo is active
        const promoRes = await axios.get(`${API}/api/promo/status`);

        if (promoRes.data.active) {
          // 🎉 Promo is active - everyone gets access!
          console.log("✅ Free promo active:", promoRes.data.message);
          setAllowed(true);
          setLoading(false);
          return;
        }

        // ✅ STEP 2: Promo ended - check subscription
        const subRes = await axios.get(`${API}/api/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (subRes.data.active) {
          setAllowed(true);
        } else {
          alert("Free access period has ended. Please subscribe to access Community.");
          navigate("/subscribe");
        }
      } catch (err) {
        console.error("Access check error:", err);
        alert("Error checking access. Please subscribe to continue.");
        navigate("/subscribe");
      }

      setLoading(false);
    };

    checkAccess();
  }, [token, navigate]);

  // --- Socket init
  useEffect(() => {
    if (!token || !allowed) return;
    const s = io(API, { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, [token, allowed]);

  // --- Load lists
  const loadGroups = async () => {
    try {
      const res = await axios.get(`${API}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(res.data || []);
    } catch (err) {
      console.error("loadGroups:", err);
    }
  };

  const loadDmList = async () => {
    try {
      const res = await axios.get(`${API}/api/dms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDmList(res.data || []);
    } catch (err) {
      console.error("loadDmList:", err);
    }
  };

  useEffect(() => {
    if (allowed) {
      loadGroups();
      loadDmList();
    }
  }, [allowed]);

  // ---- LOADING STATE ----
  if (loading) {
    return (
      <div className="p-10 text-center text-green-700 font-semibold">
        Checking access...
      </div>
    );
  }

  // ---- IF NOT ALLOWED, REDIRECTING ----
  if (!allowed) return null;

  // --- Check membership
  const checkIsMember = async (groupId) => {
    try {
      const res = await axios.get(`${API}/api/groups/${groupId}/isMember/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.isMember;
    } catch (err) {
      return false;
    }
  };

  // --- Join / Leave group
  const joinGroup = async (groupId) => {
    try {
      await axios.post(`${API}/api/groups/${groupId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadGroups();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join");
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await axios.post(`${API}/api/groups/${groupId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selected?.type === "group" && selected.id === groupId) {
        setSelected(null);
        setMessages([]);
      }
      await loadGroups();
    } catch (err) {
      alert("Failed to leave");
    }
  };

  // --- Fetch messages
  const fetchMessages = async (id, type) => {
    setLoadingMessages(true);
    try {
      const url = type === "group" ? `${API}/api/groups/${id}/messages` : `${API}/api/dms/${id}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data || []);
      const key = `${type}:${id}`;
      setUnreadCounts(prev => ({ ...prev, [key]: 0 }));
      setTimeout(() => {
        messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
      }, 60);
    } catch (err) {
      console.error("fetchMessages:", err);
    }
    setLoadingMessages(false);
  };

  // --- Open group / DM
  const openGroup = async (g) => {
    setSelected({ ...g, type: "group" });
    setMessages([]);
    await fetchMessages(g.id, "group");
    socket?.emit("joinGroupRoom", { groupId: g.id });
  };

  const openDM = async (other) => {
    setSelected({ id: other.id, username: other.username, type: "dm" });
    setMessages([]);
    await fetchMessages(other.id, "dm");
  };

  // Handle clicking on username
  const handleUsernameClick = async (clickedUserId, clickedUsername) => {
    if (clickedUserId === user.id) return;
    setActiveTab("dms");
    await openDM({ id: clickedUserId, username: clickedUsername });
    await loadDmList();
  };

  // --- Send message
  const sendMessage = async () => {
    if (!selected) return;
    if (!messageText.trim() && !file) return;

    const form = new FormData();
    if (messageText) form.append("content", messageText);
    if (file) form.append("file", file);

    try {
      if (selected.type === "group") {
        await axios.post(`${API}/api/groups/${selected.id}/messages`, form, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      } else {
        form.append("receiverId", selected.id);
        await axios.post(`${API}/api/dms`, form, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }
      setMessageText("");
      setFile(null);
    } catch (err) {
      console.error("sendMessage:", err);
      alert("Send failed");
    }
  };

  // --- Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("groupMessage", (msg) => {
      if (selected?.type === "group" && selected.id === msg.groupId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" }), 50);
      } else {
        const k = `group:${msg.groupId}`;
        setUnreadCounts(prev => ({ ...prev, [k]: (prev[k] || 0) + 1 }));
      }
      loadGroups();
    });

    socket.on("directMessage", (msg) => {
      const otherId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      if (selected?.type === "dm" && selected.id === otherId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" }), 50);
      } else {
        const k = `dm:${otherId}`;
        setUnreadCounts(prev => ({ ...prev, [k]: (prev[k] || 0) + 1 }));
      }
      loadDmList();
    });

    socket.on("onlineCount", ({ groupId, count }) => {
      if (selected?.type === "group" && selected.id === groupId) {
        setOnlineCount(count);
      }
    });

    socket.on("typing", ({ userId, groupId }) => {
      if (selected?.type === "group" && selected.id === groupId) {
        setTypingUsers(prev => ({ ...prev, [userId]: true }));
      }
    });

    socket.on("stopTyping", ({ userId, groupId }) => {
      if (selected?.type === "group" && selected.id === groupId) {
        setTypingUsers(prev => { const copy = { ...prev }; delete copy[userId]; return copy; });
      }
    });

    return () => {
      socket.off("groupMessage");
      socket.off("directMessage");
      socket.off("onlineCount");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, selected]);

  // Emit typing
  useEffect(() => {
    if (!socket || !selected) return;
    if (messageText.length > 0) {
      socket.emit("typing", { groupId: selected.type === "group" ? selected.id : null });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { groupId: selected.type === "group" ? selected.id : null });
      }, 1200);
    } else {
      socket.emit("stopTyping", { groupId: selected.type === "group" ? selected.id : null });
    }
  }, [messageText, socket, selected]);

  // Scroll handlers
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.clientHeight - el.scrollTop < 120;
      setShowScrollBtn(!atBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messagesRef, messages]);

  const scrollToBottom = () => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
    setShowScrollBtn(false);
  };

  // Touch handlers
  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const endX = (e.changedTouches && e.changedTouches[0].clientX) || null;
    const endY = (e.changedTouches && e.changedTouches[0].clientY) || null;
    const dx = endX - touchStartX.current;
    const dy = Math.abs(endY - touchStartY.current);
    const threshold = 70;
    if (dx < -threshold && dy < 80) {
      setSelected(null);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Unread badge
  const renderUnread = (type, id) => {
    const key = `${type}:${id}`;
    const count = unreadCounts[key] || 0;
    if (!count) return null;
    return (
      <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold bg-red-600 text-white px-2 py-0.5 rounded-full min-w-[22px]">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const OnlineDot = ({ count }) => (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${count > 0 ? "bg-green-500" : "bg-gray-300"} mr-2`} />
  );

  // ---------- RENDER ----------
  return (
    <section className="py-4 bg-gray-50 min-h-[90vh]">
      <div className="max-w-5xl mx-auto h-[86vh] lg:h-[80vh] flex shadow-xl rounded-xl overflow-hidden bg-white">

        {/* SIDEBAR */}
        <div className={`w-full lg:w-80 border-r bg-white flex-shrink-0 transition-all ${selected ? "hidden lg:block" : "block"}`}>
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-green-700" />
              <h3 className="font-semibold text-lg">Community</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("groups")}
                className={`px-3 py-1 rounded-full text-sm ${activeTab === "groups" ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600"}`}
              >
                Groups
              </button>
              <button
                onClick={() => setActiveTab("dms")}
                className={`px-3 py-1 rounded-full text-sm ${activeTab === "dms" ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600"}`}
              >
                DMs
              </button>
            </div>
          </div>

          <div className="p-3 overflow-y-auto h-[calc(86vh-66px)] lg:h-[calc(80vh-66px)]">
            {/* GROUPS */}
            {activeTab === "groups" && (
              <div className="space-y-2">
                {groups.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center gap-3 flex-1" onClick={() => openGroup(g)}>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ background: getColorFromString(g.title) }}
                        >
                          {initialsFromName(g.title)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center text-sm font-semibold">
                            <OnlineDot count={g.online || 0} />
                            <span className="truncate">{g.title}</span>
                            {g.online ? <span className="ml-2 text-xs text-green-600">• {g.online} online</span> : null}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{g.members} members</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end ml-3 space-y-2">
                      {renderUnread("group", g.id)}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const isMember = await checkIsMember(g.id);
                          if (!isMember) await joinGroup(g.id);
                          else await leaveGroup(g.id);
                          loadGroups();
                        }}
                        className="text-xs px-3 py-1 rounded-full bg-orange-600 text-white shadow-sm"
                      >
                        Join/Leave
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DMS */}
            {activeTab === "dms" && (
              <div className="space-y-2">
                {dmList.length === 0 && <div className="text-gray-500">No DMs yet.</div>}
                {dmList.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer" onClick={() => openDM(d)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center bg-indigo-200 text-indigo-800 font-semibold">
                        {initialsFromName(d.username)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{d.username}</div>
                        <div className="text-xs text-gray-500 truncate">{d.lastMessage || "Say hi!"}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {renderUnread("dm", d.id)}
                      <div className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CHAT PANEL */}
        <AnimatePresence>
          {selected ? (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 80 }}
              className="flex-grow flex flex-col h-full"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* header */}
              <div className="p-3 border-b bg-green-700 text-white flex items-center gap-3">
                <button className="lg:hidden p-2 rounded-full bg-white/10" onClick={() => setSelected(null)}>
                  <ChevronLeft />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: getColorFromString(selected.title || selected.username) }}>
                      {initialsFromName(selected.title || selected.username)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate">
                        {selected.type === "group" ? selected.title : selected.username}
                      </div>
                      <div className="text-xs text-green-200 truncate">
                        {selected.type === "group" ? `${onlineCount} online` : "Direct Message"}
                      </div>
                    </div>
                  </div>
                </div>

                {selected.type === "group" && (
                  <div className="hidden lg:flex items-center gap-2">
                    <button onClick={() => leaveGroup(selected.id)} className="px-3 py-1 rounded-full bg-red-600 text-white">Leave</button>
                  </div>
                )}
              </div>

              {/* messages */}
              <div ref={messagesRef} className="flex-grow p-3 overflow-y-auto bg-gray-50">
                {loadingMessages && <div className="text-center text-gray-500">Loading...</div>}

                {messages.map((m) => (
                  <div key={m.id} className={`mb-3 flex ${m.userId === user.id ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-xl p-3 max-w-[78%] ${m.userId === user.id ? "bg-orange-600 text-white" : "bg-white text-gray-800"}`}>
                      <div 
                        className="text-xs font-bold mb-1 cursor-pointer hover:underline" 
                        style={{ color: m.userId === user.id ? "rgba(255,255,255,0.9)" : getColorFromString(m.user?.username) }}
                        onClick={() => handleUsernameClick(m.userId, m.user?.username)}
                      >
                        {m.user?.username}
                      </div>
                      {m.content && <div>{m.content}</div>}
                      {m.fileUrl && (
                        <a className="text-sm underline block mt-2" href={`${API}${m.fileUrl}`} target="_blank" rel="noreferrer">🔎 View file</a>
                      )}
                      <div className="text-xs opacity-60 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}

                {Object.keys(typingUsers).length > 0 && (
                  <div className="mb-3">
                    <TypingIndicator />
                  </div>
                )}
              </div>

              {showScrollBtn && (
                <button onClick={scrollToBottom} className="fixed right-4 bottom-24 z-40 p-3 rounded-full bg-green-700 text-white shadow-lg lg:bottom-10">
                  ↓
                </button>
              )}

              {/* input */}
              <div className="p-3 border-t bg-white flex items-center gap-3">
                <label className="cursor-pointer p-2">
                  <Paperclip size={22} />
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                </label>

                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-full"
                />

                <button onClick={sendMessage} className="p-3 bg-green-700 text-white rounded-full">
                  <Send />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white p-6">
              <div className="text-center text-gray-500">
                <MessageSquare className="mx-auto mb-3 text-green-700" />
                <h3 className="text-xl font-semibold text-green-700">Start Collaborating!</h3>
                <p className="mt-2">Select a group or direct message to begin.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 p-2 bg-white rounded-full shadow-sm">
      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDuration: "0.8s" }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0.15s", animationDuration: "0.8s" }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0.3s", animationDuration: "0.8s" }}></div>
      <span className="text-xs text-gray-500 ml-2">Someone is typing...</span>
    </div>
  );
}