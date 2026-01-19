const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    timings: {
      morning: { type: String },
      evening: { type: String }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
