const express = require("express");
const router = express.Router();

const Doctor = require("../models/Doctor");
const patientAuth = require("../middleware/patientAuth");

/**
 * ----------------------------------------
 * GET /api/patient/doctors
 * Fetch doctors for patient booking
 * ----------------------------------------
 */
router.get("/doctors", patientAuth, async (req, res) => {
  try {
    const { clinicId } = req.patient;

    const doctors = await Doctor.find({ clinicId }).select(
      "name specialization"
    );

    res.json(doctors);
  } catch (error) {
    console.error("❌ Fetch Doctors Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
