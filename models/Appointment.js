const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    // 🔥 OPTIONAL (CRITICAL FIX)
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: false,
    },

    patientName: {
      type: String,
      required: true,
    },

    patientPhone: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    timeSlot: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked",
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
