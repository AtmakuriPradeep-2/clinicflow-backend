const express = require("express");
const Clinic = require("../models/Clinic");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// LOGIN CLINIC
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  const clinic = await Clinic.findOne({ phone });
  if (!clinic) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, clinic.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { clinicId: clinic._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login successful",
    token
  });
});

module.exports = router;
