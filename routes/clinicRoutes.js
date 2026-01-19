const express = require("express");
const Clinic = require("../models/Clinic");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

/* =====================
   REGISTER CLINIC
===================== */
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password, address, consultationFee } = req.body;

    // ✅ address added to required check
    if (!name || !phone || !password || !address) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const existingClinic = await Clinic.findOne({ phone });
    if (existingClinic) {
      return res.status(400).json({ message: "Clinic already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ SAFE OBJECT CREATION
    const clinicData = {
      name,
      phone,
      password: hashedPassword,
      address,
      consultationFee
    };

    // ✅ Prevent whatsappNumber = null
    if (req.body.whatsappNumber) {
      clinicData.whatsappNumber = req.body.whatsappNumber;
    }

    const clinic = new Clinic(clinicData);
    await clinic.save();

    res.status(201).json({ message: "Clinic registered successfully" });
  } catch (err) {
    console.error("❌ Clinic Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================
   LOGIN CLINIC
===================== */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password required" });
    }

    const clinic = await Clinic.findOne({ phone });
    if (!clinic) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, clinic.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { clinicId: clinic._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      clinic: {
        id: clinic._id,
        name: clinic.name,
        phone: clinic.phone
      }
    });
  } catch (err) {
    console.error("❌ Clinic Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================
   CLINIC LIST (PUBLIC)
===================== */
router.get("/list", async (req, res) => {
  try {
    const clinics = await Clinic.find({}, "name").sort({ name: 1 });
    res.json(clinics);
  } catch (err) {
    console.error("❌ Clinic List Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
