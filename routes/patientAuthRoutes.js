const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Patient = require("../models/Patient");
const Clinic = require("../models/Clinic");

const router = express.Router();

/* =========================
   📞 PHONE NORMALIZER
========================= */
function normalizePhone(phone) {
  if (!phone) return "";

  let cleaned = phone.toString().trim();
  cleaned = cleaned.replace(/\s|-/g, "");
  cleaned = cleaned.replace("whatsapp:", "");

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;

  return cleaned;
}

/* =========================
   PATIENT REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { clinicName, name, password } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!clinicName || !name || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const clinic = await Clinic.findOne({
      name: new RegExp(`^${clinicName}$`, "i"),
    });

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    const existing = await Patient.findOne({
      clinicId: clinic._id,
      phone,
    });

    if (existing) {
      return res.status(400).json({
        message: "Patient already registered with this clinic",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Patient.create({
      clinicId: clinic._id,
      name,
      phone,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Patient registered successfully" });
  } catch (error) {
    console.error("❌ Patient Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   PATIENT LOGIN ✅ FINAL FIX
========================= */
router.post("/login", async (req, res) => {
  try {
    const { clinicName, password } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!clinicName || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const clinic = await Clinic.findOne({
      name: new RegExp(`^${clinicName}$`, "i"),
    });

    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    const patient = await Patient.findOne({
      clinicId: clinic._id,
      phone,
    });

    if (!patient) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    /* 🔐 JWT — INCLUDE NAME (CRITICAL FIX) */
    const token = jwt.sign(
      {
        patientId: patient._id,
        clinicId: clinic._id,
        phone: patient.phone,
        name: patient.name, // ✅ REQUIRED FOR BOOKING
        role: "patient",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      patient: {
        id: patient._id,
        name: patient.name,
        phone: patient.phone,
        clinic: clinic.name,
      },
    });
  } catch (error) {
    console.error("❌ Patient Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
