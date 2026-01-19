const express = require("express");
const Appointment = require("../models/Appointment");
const patientAuth = require("../middleware/patientAuth");
const { sendCancellationSMS } = require("../services/smsService");

const router = express.Router();

/* =========================
   GET PATIENT APPOINTMENTS
========================= */
router.get("/appointments", patientAuth, async (req, res) => {
  try {
    const { clinicId, phone } = req.patient;
    const { date } = req.query;

    const phoneVariants = [phone, `whatsapp:${phone}`];

    const filter = {
      clinicId,
      patientPhone: { $in: phoneVariants },
    };

    if (date) filter.date = date;

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name specialization")
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);
  } catch (err) {
    console.error("❌ Patient Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   CANCEL APPOINTMENT
========================= */
router.patch("/appointments/:id/cancel", patientAuth, async (req, res) => {
  try {
    const { clinicId, phone } = req.patient;
    const phoneVariants = [phone, `whatsapp:${phone}`];

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId,
      patientPhone: { $in: phoneVariants },
      status: "booked",
    }).populate("doctorId", "name");

    if (!appointment) {
      return res
        .status(400)
        .json({ message: "Appointment cannot be cancelled" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    /* =========================
       ✅ SEND CANCELLATION SMS
    ========================= */
    try {
      await sendCancellationSMS({
        phone,
        patientName: appointment.patientName,
        doctorName: appointment.doctorId?.name || "Doctor",
        date: appointment.date,
        timeSlot: appointment.timeSlot,
      });
    } catch {
      console.error("⚠️ SMS failed but cancellation succeeded");
    }

    res.json({ message: "Appointment cancelled successfully" });
  } catch (err) {
    console.error("❌ Cancel Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
