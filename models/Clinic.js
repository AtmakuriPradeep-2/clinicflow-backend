const mongoose = require("mongoose");

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    phone: {
      type: String,
      required: true,
      unique: true
    },

    whatsappNumber: {
      type: String,
      unique: true,
      sparse: true
    },

    password: { type: String, required: true },

    address: { type: String, required: true },

    consultationFee: {
      type: Number,
      default: 0
    },

    // ✅ ADD THIS
    doctors: [
      {
        type: String,
        trim: true
      }
    ],

    isAutomationOn: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clinic", clinicSchema);
