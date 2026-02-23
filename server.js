console.log("🔥 SERVER FILE LOADED:", __filename);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
require("./services/whatsappReminder");

/* =======================
   ROUTES (UNCHANGED)
======================= */
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const patientRoutes = require("./routes/patientRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const patientAuthRoutes = require("./routes/patientAuthRoutes");
const patientAppointmentRoutes = require("./routes/patientAppointmentRoutes");
const patientBookingRoutes = require("./routes/patientBookingRoutes");
const patientDoctorsRoutes = require("./routes/patientDoctorsRoutes");
const clinicRoutes = require("./routes/clinicRoutes");
const voiceRoutes = require("./routes/voiceRoutes");


/* 🔥 AI ROUTE (NEW – SAFE ADDITION) */
const aiRoutes = require("./routes/ai.routes");

const app = express();

/* =======================
   ✅ MIDDLEWARES (UNCHANGED)
======================= */
app.use(
  cors({
    origin: "*", // ✅ mobile + production safe
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* =======================
   ✅ DATABASE (UNCHANGED)
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* =======================
   ✅ ROUTES (UNCHANGED)
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/patient", patientAuthRoutes);
app.use("/api/patient", patientAppointmentRoutes);
app.use("/api/patient", patientBookingRoutes);
app.use("/api/patient", patientDoctorsRoutes);
app.use("/api/clinic", clinicRoutes);
app.use("/api/voice", voiceRoutes);

/* 🔥 AI ROUTE MOUNT (NEW – SAFE ADDITION) */
app.use("/api/ai", aiRoutes);


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join", (patientId) => {
    socket.join(patientId);
    console.log("👤 Patient joined room:", patientId);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// 🌍 Make socket globally available
global.io = io;

/* =======================
   ✅ SERVER START (UNCHANGED)
======================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});