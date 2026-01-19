const express = require("express");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const patientAuth = require("../middleware/patientAuth");
const { sendBookingSMS } = require("../services/smsService");

const router = express.Router();

/* =========================
   BOOK APPOINTMENT
========================= */
router.post("/book", patientAuth, async (req, res) => {
  try {
    const { doctorId, date, timeSlot, name } = req.body;
    const { clinicId, phone } = req.patient;

    if (!clinicId || !doctorId || !date || !timeSlot || !name) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔒 Prevent duplicate slot
    const exists = await Appointment.findOne({
      clinicId,
      doctorId,
      date,
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (exists) {
      return res.status(409).json({
        message: "Time slot already booked",
      });
    }

    const appointment = await Appointment.create({
      clinicId,
      doctorId,
      patientName: name,
      patientPhone: phone,
      date,
      timeSlot,
      status: "booked",
    });

    /* =========================
       ✅ SEND BOOKING SMS
    ========================= */
    try {
      const doctor = await Doctor.findById(doctorId);
      await sendBookingSMS({
        phone,
        patientName: name,
        doctorName: doctor?.name || "Doctor",
        date,
        timeSlot,
      });
    } catch (smsErr) {
      console.error("⚠️ SMS failed but booking successful");
    }

    res.json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (err) {
    console.error("❌ Booking Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
