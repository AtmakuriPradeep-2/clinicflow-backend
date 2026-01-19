const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    /* 🔔 Expo Push Token (ADDED CORRECTLY) */
    pushToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/* Prevent duplicate patient per clinic by phone */
patientSchema.index({ clinicId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Patient", patientSchema);
