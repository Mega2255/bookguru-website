import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import http from "http";
import { Server as IOServer } from "socket.io";
import multer from "multer";
import path from "path";
import cron from "node-cron";
import csv from "csv-parser";
import fs from "fs";
import jwt from "jsonwebtoken";

import { requireSubscription } from "./src/middleware/requireSubscription.js";
import subscriptionRoutes from "./src/routes/subscriptionRoutes.js";
import authRoutes from './src/routes/authRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// --- CORS CONFIGURATION ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json());

// --- ROUTES ---
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/auth", authRoutes);

const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
});

const prisma = new PrismaClient();

// uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---------- multer ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), "uploads")),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`)
});
const upload = multer({ storage });

// ---------- auth middleware ----------
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
    req.user = decoded; // { id, email, username, isAdmin }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ---------- adminOnly middleware (FIXED: synchronous, checks token) ----------
function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Not authorized - Admin access required" });
  }
  next();
}

// ---------- helper: emit online counts ----------
async function emitGroupCounts(groupId) {
  const room = `group:${groupId}`;
  const sockets = await io.in(room).allSockets();
  const count = sockets.size;
  io.to(room).emit("onlineCount", { groupId, count });
}

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => res.send("📚 BookGuru Backend (Prisma + IO) Running ✅"));

// ==================== GROUPS & MEMBERS ====================
app.get("/api/groups", auth, requireSubscription, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    const out = groups.map(g => ({
      id: g.id, 
      title: g.title, 
      members: g._count.members
    }));
    res.json(out);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to fetch groups" }); 
  }
});

app.get("/api/groups/:groupId/isMember/:userId", auth, requireSubscription, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);
    const m = await prisma.groupMember.findFirst({ where: { groupId, userId }});
    res.json({ isMember: !!m });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed" }); 
  }
});

app.post("/api/groups/:groupId/join", auth, requireSubscription, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user.id;
    const exists = await prisma.groupMember.findFirst({ where: { groupId, userId }});
    if (exists) return res.status(400).json({ message: "Already a member" });
    await prisma.groupMember.create({ data: { groupId, userId }});
    setTimeout(() => emitGroupCounts(groupId), 250);
    res.json({ message: "Joined group" });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to join" }); 
  }
});

app.post("/api/groups/:groupId/leave", auth, requireSubscription, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user.id;
    await prisma.groupMember.deleteMany({ where: { groupId, userId }});
    setTimeout(() => emitGroupCounts(groupId), 250);
    res.json({ message: "Left group" });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to leave" }); 
  }
});

app.get("/api/groups/:groupId/members", auth, requireSubscription, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, username: true, name: true } } }
    });
    res.json(members.map(m => m.user));
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed" }); 
  }
});

// ==================== GROUP MESSAGES ====================
app.get("/api/groups/:groupId/messages", auth, requireSubscription, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
    const msgs = await prisma.groupMessage.findMany({
      where: { groupId, createdAt: { gte: sevenDaysAgo } },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: "asc" }
    });
    res.json(msgs);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to load messages" }); 
  }
});

app.post("/api/groups/:groupId/messages", auth, upload.single("file"), requireSubscription, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.user.id;
    const { content } = req.body;
    let fileUrl = null, fileType = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      fileType = /\.(jpg|jpeg|png|gif)$/.test(ext) ? "image" : "file";
    }

    const created = await prisma.groupMessage.create({
      data: { groupId, userId, content: content || null, fileUrl, fileType }
    });

    const msgWithUser = await prisma.groupMessage.findUnique({
      where: { id: created.id },
      include: { user: { select: { id: true, username: true } } }
    });

    io.to(`group:${groupId}`).emit("groupMessage", msgWithUser);
    await emitGroupCounts(groupId);

    res.status(201).json(created);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to send message" }); 
  }
});

// ==================== DIRECT MESSAGES ====================
app.get("/api/dms/:otherUserId", auth, requireSubscription, async (req, res) => {
  try {
    const userA = req.user.id;
    const userB = Number(req.params.otherUserId);
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);

    const msgs = await prisma.directMessage.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA }
        ]
      },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    res.json(msgs);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to load DMs" }); 
  }
});

app.post("/api/dms", auth, upload.single("file"), requireSubscription, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;
    let fileUrl = null, fileType = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      fileType = /\.(jpg|jpeg|png|gif)$/.test(ext) ? "image" : "file";
    }

    const created = await prisma.directMessage.create({
      data: { senderId, receiverId: Number(receiverId), content: content || null, fileUrl, fileType }
    });

    io.to(`dm:${receiverId}`).emit("directMessage", created);
    io.to(`dm:${senderId}`).emit("directMessage", created);

    res.status(201).json(created);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to send DM" }); 
  }
});

app.get("/api/dms", auth, requireSubscription, async (req, res) => {
  try {
    const userId = req.user.id;

    const sent = await prisma.directMessage.findMany({
      where: { senderId: userId },
      include: { receiver: true }
    });
    const received = await prisma.directMessage.findMany({
      where: { receiverId: userId },
      include: { sender: true }
    });

    const map = new Map();

    sent.forEach(m => {
      const other = m.receiver;
      const prev = map.get(other.id);
      if (!prev || new Date(m.createdAt) > new Date(prev.createdAt)) 
        map.set(other.id, { user: other, message: m });
    });
    received.forEach(m => {
      const other = m.sender;
      const prev = map.get(other.id);
      if (!prev || new Date(m.createdAt) > new Date(prev.createdAt)) 
        map.set(other.id, { user: other, message: m });
    });

    const result = Array.from(map.values()).map(v => ({
      id: v.user.id,
      username: v.user.username,
      lastMessage: v.message.content || (v.message.fileUrl ? "[file]" : ""),
      createdAt: v.message.createdAt
    }));

    res.json(result);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: "Failed to list DMs" }); 
  }
});

// ==================== SOCKET.IO REAL-TIME ====================
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  socket.join(`dm:${userId}`);

  console.log(`Socket connected: ${socket.id} (user ${userId})`);

  socket.on("joinGroupRoom", async ({ groupId }) => {
    const room = `group:${groupId}`;
    socket.join(room);
    await emitGroupCounts(groupId);
  });

  socket.on("leaveGroupRoom", async ({ groupId }) => {
    const room = `group:${groupId}`;
    socket.leave(room);
    await emitGroupCounts(groupId);
  });

  socket.on("typing", ({ groupId }) => {
    io.to(`group:${groupId}`).emit("typing", { userId, groupId });
  });

  socket.on("stopTyping", ({ groupId }) => {
    io.to(`group:${groupId}`).emit("stopTyping", { userId, groupId });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ==================== CLEANUP CRON: delete >7 days ====================
cron.schedule("0 0 * * *", async () => {
  try {
    const cutoff = new Date(Date.now() - 7*24*60*60*1000);
    const a = await prisma.groupMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
    const b = await prisma.directMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
    console.log("Cleanup:", a.count, b.count);
  } catch (err) { 
    console.error("Cleanup failed:", err); 
  }
});

//==============================================================================
// ADMIN ENDPOINTS - FIXED: All routes now have adminOnly middleware
//==============================================================================

// -------- USERS --------
app.get("/api/admin/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        subscriptions: true,
        groupMembers: {
          include: {
            group: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.delete("/api/admin/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// -------- GROUPS --------
app.get("/api/admin/groups", auth, adminOnly, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: { select: { members: true } }
      }
    });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
});

app.post("/api/admin/groups", auth, adminOnly, async (req, res) => {
  try {
    const { title } = req.body;
    const group = await prisma.group.create({
      data: { title }
    });
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create group" });
  }
});

app.put("/api/admin/groups/:id", auth, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title } = req.body;
    const updated = await prisma.group.update({
      where: { id },
      data: { title }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update group" });
  }
});

app.delete("/api/admin/groups/:id", auth, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.group.delete({ where: { id } });
    res.json({ message: "Group deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete group" });
  }
});

app.get("/api/admin/groups/:id/members", auth, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      include: { user: true }
    });
    res.json(members.map(m => m.user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load group members" });
  }
});

app.delete("/api/admin/groups/:groupId/removeUser/:userId", auth, adminOnly, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);
    await prisma.groupMember.deleteMany({ where: { groupId, userId } });
    res.json({ message: "User removed from group" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove user" });
  }
});

// -------- NEWS --------
app.post("/api/admin/news", auth, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const news = await prisma.news.create({
      data: { title, content, imageUrl }
    });

    io.emit("newsCreated", news);

    res.status(201).json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload news" });
  }
});

app.get("/api/admin/news", auth, adminOnly, async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      orderBy: { createdAt: "desc" }
    });

    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load news" });
  }
});

app.put("/api/admin/news/:id", auth, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content } = req.body;

    let imageUrl = undefined;
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;

    const data = { title, content };
    if (imageUrl) data.imageUrl = imageUrl;

    const updated = await prisma.news.update({
      where: { id },
      data
    });

    io.emit("newsUpdated", updated);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update news" });
  }
});

app.delete("/api/admin/news/:id", auth, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.news.delete({ where: { id } });

    io.emit("newsDeleted", id);

    res.json({ message: "News deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete news" });
  }
});

// -------- SUBSCRIPTIONS --------
app.get("/api/admin/subscriptions/summary", auth, adminOnly, async (req, res) => {
  try {
    const now = new Date();

    const dailySubs = await prisma.subscription.findMany({
      where: { createdAt: { gte: new Date(now - 1 * 24 * 60 * 60 * 1000) } },
      select: { amount: true }
    });

    const weeklySubs = await prisma.subscription.findMany({
      where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
      select: { amount: true }
    });

    const monthlySubs = await prisma.subscription.findMany({
      where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
      select: { amount: true }
    });

    // Sum up the amounts
    const daily = dailySubs.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const weekly = weeklySubs.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const monthly = monthlySubs.reduce((sum, sub) => sum + (sub.amount || 0), 0);

    const total = await prisma.subscription.count();

    res.json({ daily, weekly, monthly, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load subscription summary" });
  }
});

app.get("/api/admin/subscriptions/users", auth, adminOnly, async (req, res) => {
  try {
    const subscribed = await prisma.user.findMany({
      where: { subscriptions: { some: {} } },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const unsubscribed = await prisma.user.findMany({
      where: { subscriptions: { none: {} } }
    });

    const formattedSubscribed = subscribed.map(user => ({
      id: user.subscriptions[0]?.id || user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      },
      username: user.username,
      email: user.email,
      amount: user.subscriptions[0]?.amount || 0,
      createdAt: user.subscriptions[0]?.createdAt || user.createdAt
    }));

    res.json({ subscribed: formattedSubscribed, unsubscribed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed" });
  }
});

// ==================== CBT (Subjects, Questions, Results) ====================

// 🔓 Any logged-in user can view subjects
app.get("/api/cbt/subjects", auth, async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load subjects" });
  }
});

// 🔓 Any logged-in user can create subject
app.post("/api/cbt/subjects", auth, async (req, res) => {
  try {
    const { name, slug, description, maxQuestions, defaultTime, allowCustom } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        slug,
        description: description || null,
        maxQuestions: Number(maxQuestions) || 100,
        defaultTime: Number(defaultTime) || 30,
        allowCustom: allowCustom === undefined ? true : Boolean(allowCustom)
      }
    });

    res.status(201).json(subject);
  } catch (err) {
    console.error("Error creating subject:", err);

    // ✅ Handle duplicate slug properly
    if (err.code === "P2002") {
      return res.status(409).json({
        message: "Subject slug already exists. Please use another slug."
      });
    }

    res.status(500).json({ message: "Failed to create subject" });
  }
});

// 🔓 Any logged-in user can update subject
app.put("/api/cbt/subjects/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, slug, description, maxQuestions, defaultTime, allowCustom } = req.body;

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        maxQuestions: Number(maxQuestions) || 100,
        defaultTime: Number(defaultTime) || 30,
        allowCustom: Boolean(allowCustom)
      }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);

    if (err.code === "P2002") {
      return res.status(409).json({
        message: "Subject slug already exists."
      });
    }

    res.status(500).json({ message: "Failed to update subject" });
  }
});

// 🔓 Any logged-in user can delete subject
app.delete("/api/cbt/subjects/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.subject.delete({ where: { id } });
    res.json({ message: "Subject deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete subject" });
  }
});

// ==================== QUESTIONS ====================

// 🔓 Any logged-in user can create questions
app.post("/api/cbt/questions", auth, upload.single("image"), async (req, res) => {
  try {
    const { subjectId, text, optionA, optionB, optionC, optionD, correct, explanation } = req.body;

    if (!subjectId || !text || !correct) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let imageUrl = null;
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;

    const q = await prisma.question.create({
      data: {
        subjectId: Number(subjectId),
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        correct,
        explanation: explanation || null,
        imageUrl
      }
    });

    res.status(201).json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create question" });
  }
});

// 🔓 Any logged-in user can update question
app.put("/api/cbt/questions/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { text, optionA, optionB, optionC, optionD, correct, explanation } = req.body;

    const data = {
      text,
      optionA,
      optionB,
      optionC,
      optionD,
      correct,
      explanation: explanation || null
    };

    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;

    const updated = await prisma.question.update({
      where: { id },
      data
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update question" });
  }
});

// 🔓 Any logged-in user can delete question
app.delete("/api/cbt/questions/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.question.delete({ where: { id } });
    res.json({ message: "Question deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete question" });
  }
});

// 🔓 Any logged-in user can view questions
app.get("/api/cbt/questions", auth, async (req, res) => {
  try {
    const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
    const where = subjectId ? { subjectId } : {};

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});


app.get("/api/cbt/subjects/:id/questions", auth, requireSubscription, async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    const num = Math.min(Number(req.query.num) || 20, 500);
    const all = await prisma.question.findMany({ where: { subjectId } });
    if (!all || all.length === 0) return res.status(404).json({ message: "No questions" });

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    shuffle(all);
    const picked = all.slice(0, Math.min(num, all.length));

    const safe = picked.map(q => ({
      id: q.id,
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      imageUrl: q.imageUrl
    }));

    const questionOrder = picked.map(q => q.id);
    res.json({ questions: safe, questionOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});

app.post("/api/cbt/submit", auth, requireSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId, questionOrder, answers, durationMins, numQuestions } = req.body;
    if (!subjectId || !Array.isArray(questionOrder) || !answers) {
      return res.status(400).json({ message: "Missing data" });
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionOrder } }
    });

    const map = new Map(questions.map(q => [q.id, q]));

    let correctCount = 0;
    for (const qid of questionOrder) {
      const q = map.get(Number(qid));
      if (!q) continue;
      const given = answers[qid];
      if (!given) continue;
      if (String(given).toUpperCase() === String(q.correct).toUpperCase()) correctCount++;
    }

    const total = Number(numQuestions) || questionOrder.length;
    const percentage = total === 0 ? 0 : (correctCount / total) * 100;

    const result = await prisma.cBTResult.create({
      data: {
        userId,
        subjectId: Number(subjectId),
        score: correctCount,
        total: total,
        percentage: Math.round(percentage * 100) / 100,
        durationMins: Number(durationMins) || 0,
        numQuestions: total,
        answers: answers,
        questionOrder: questionOrder,
      }
    });

    // keep only recent 5 attempts
    await prisma.cBTResult.deleteMany({
      where: {
        userId,
        id: { 
          notIn: (
            await prisma.cBTResult.findMany({
              where: { userId },
              orderBy: { createdAt: "desc" },
              take: 5,
              select: { id: true }
            })
          ).map(r => r.id) 
        }
      }
    });

    res.json({ resultId: result.id, score: correctCount, total, percentage: result.percentage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit CBT" });
  }
});

app.get("/api/cbt/results", auth, requireSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const results = await prisma.cBTResult.findMany({
      where: { userId },
      include: { subject: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
});

app.get("/api/cbt/history", auth, requireSubscription, async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await prisma.cBTResult.findMany({
      where: { userId },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch CBT history" });
  }
});

app.get("/api/cbt/results/:id", auth, requireSubscription, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await prisma.cBTResult.findUnique({
      where: { id },
      include: { subject: true }
    });
    if (!result) return res.status(404).json({ message: "Result not found" });
    if (result.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const qIds = result.questionOrder;
    const questions = await prisma.question.findMany({
      where: { id: { in: qIds } }
    });

    const qMap = new Map(questions.map(q => [q.id, q]));
    const review = qIds.map(qid => {
      const q = qMap.get(Number(qid));
      if (!q) return null;
      return {
        id: q.id,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        imageUrl: q.imageUrl,
        correct: q.correct,
        explanation: q.explanation,
        given: result.answers[qid] || null
      };
    }).filter(Boolean);

    res.json({ result, review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load result" });
  }
});

// ==================== BULK UPLOAD CBT QUESTIONS ====================
app.post("/api/admin/cbt/questions/bulk-upload", auth, adminOnly, upload.single("file"), async (req, res) => {
  try {
    const subjectId = Number(req.body.subjectId);

    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    let inserted = 0;

    // Handle CSV files
    if (fileExt === ".csv") {
      const results = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => results.push(row))
        .on("end", async () => {
          try {
            for (const r of results) {
              // Skip empty rows
              if (!r.question && !r.text) continue;

              await prisma.question.create({
                data: {
                  subjectId,
                  text: r.question || r.text,
                  optionA: r.optionA,
                  optionB: r.optionB,
                  optionC: r.optionC,
                  optionD: r.optionD,
                  correct: r.correctAnswer || r.correct,
                  explanation: r.explanation || null,
                  imageUrl: r.imageUrl || null
                },
              });
              inserted++;
            }

            // Delete temp file
            fs.unlinkSync(filePath);

            res.json({ 
              message: "CSV successfully imported", 
              inserted 
            });
          } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to insert questions from CSV" });
          }
        })
        .on("error", (err) => {
          console.error(err);
          res.status(500).json({ message: "Failed to parse CSV" });
        });
    } 
    // Handle JSON files
    else if (fileExt === ".json") {
      try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(fileContent);

        // Ensure it's an array
        const questions = Array.isArray(jsonData) ? jsonData : [jsonData];

        for (const q of questions) {
          if (!q.question && !q.text) continue;

          await prisma.question.create({
            data: {
              subjectId,
              text: q.question || q.text,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correct: q.correctAnswer || q.correct,
              explanation: q.explanation || null,
              imageUrl: q.imageUrl || null
            }
          });
          inserted++;
        }

        // Delete temp file
        fs.unlinkSync(filePath);

        res.json({ 
          message: "JSON successfully imported", 
          inserted 
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to parse or insert JSON questions" });
      }
    } 
    else {
      // Delete unsupported file
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Unsupported file format. Use .csv or .json" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal error during bulk upload" });
  }
});

// ==================== NEWSLETTER SUBSCRIPTION ====================
app.post("/api/newsletter/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const response = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.REACT_APP_MAILERLITE_KEY}`
      },
      body: JSON.stringify({
        email: email,
        groups: ["172214492553282595"]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MailerLite error:", data);
      return res.status(response.status).json({ 
        error: data.message || "Failed to subscribe" 
      });
    }

    res.json({ success: true, message: "Successfully subscribed!" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 BookGuru backend running on port ${PORT}`)
);