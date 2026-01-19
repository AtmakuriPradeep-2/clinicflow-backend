const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true
    },

    step: {
      type: String,
      enum: [
        "START",
        "CLINIC_SELECT",
        "MENU",
        "NAME",
        "DATE",
        "SLOT",
        "DONE"
      ],
      default: "START"
    },

    tempData: {
      clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic"
      },
      name: String,
      date: String,
      clinics: [
        {
          id: mongoose.Schema.Types.ObjectId,
          name: String
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
