const express = require("express");
const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth");

const router = express.Router();

/* =====================================
   GET APPOINTMENTS (OPTIONAL DATE FILTER)
   GET /api/appointments?date=YYYY-MM-DD
===================================== */
router.get("/", auth, async (req, res) => {
  try {
    if (!req.user?.clinicId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const clinicId = req.user.clinicId;
    const { date } = req.query;

    const filter = { clinicId };
    if (date) filter.date = date;

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name specialization")
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);
  } catch (err) {
    console.error("❌ Fetch Appointments Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
   UPDATE STATUS (COMPLETED / CANCELLED)
   PATCH /api/appointments/:id/status
===================================== */
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (!req.user?.clinicId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status } = req.body;
    const clinicId = req.user.clinicId;

    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId,
    })
      .populate("doctorId", "name specialization")
      .populate("patientId"); // optional field

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // ❌ Prevent cancelling completed appointment
    if (appointment.status === "completed" && status === "cancelled") {
      return res.status(400).json({
        message: "Completed appointment cannot be cancelled",
      });
    }

    appointment.status = status;
    await appointment.save();

    /* ================= 🔥 REAL-TIME SOCKET EVENT ================= */
    if (appointment.patientId) {
      global.io
        .to(appointment.patientId.toString())
        .emit("appointment:update", {
          appointmentId: appointment._id,
          status,
          doctor: appointment.doctorId?.name || "Doctor",
          date: appointment.date,
          timeSlot: appointment.timeSlot,
        });
    }

    res.json({
      message: "Status updated successfully",
      appointment,
    });
  } catch (err) {
    console.error("❌ Status Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
