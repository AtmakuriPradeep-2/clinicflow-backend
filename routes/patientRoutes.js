const express = require("express");
const bcrypt = require("bcryptjs");
const Clinic = require("../models/Clinic");
const Patient = require("../models/Patient");
const auth = require("../middleware/auth"); // ✅ AUTH MIDDLEWARE

const router = express.Router();

/* =========================
   GET CLINICS (PUBLIC)
   GET /api/patients/clinics
========================= */
router.get("/clinics", async (req, res) => {
  try {
    const clinics = await Clinic.find().select("name");
    res.json(clinics);
  } catch (err) {
    console.error("❌ Fetch Clinics Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   REGISTER PATIENT
   POST /api/patients/add
========================= */
router.post("/add", async (req, res) => {
  try {
    const { clinicName, name, phone, password } = req.body;

    // 🔒 BASIC VALIDATION
    if (!clinicName || !name || !phone || !password) {
      return res.status(400).json({
        message: "Clinic, name, phone and password are required",
      });
    }

    // 🔍 FIND CLINIC
    const clinic = await Clinic.findOne({
      name: { $regex: `^${clinicName}$`, $options: "i" },
    });

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    // 🔥 CHECK DUPLICATE
    const existingPatient = await Patient.findOne({
      clinicId: clinic._id,
      phone,
    });

    if (existingPatient) {
      return res.status(409).json({
        message: "Patient already registered. Please login.",
      });
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ CREATE PATIENT
    const patient = await Patient.create({
      clinicId: clinic._id,
      name,
      phone,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Patient registered successfully",
      patient,
    });
  } catch (err) {
    console.error("❌ Patient Add Error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Patient already registered",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   SAVE EXPO PUSH TOKEN (NEW)
   POST /api/patients/push-token
========================= */
router.post("/push-token", auth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Push token required" });
    }

    await Patient.findByIdAndUpdate(req.user.id, {
      pushToken: token,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Push Token Save Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
