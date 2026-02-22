const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Clinic = require("../models/Clinic");
const Patient = require("../models/Patient");

const sessions = {};

/* =========================================
   MAIN AI RECEPTIONIST CONTROLLER
========================================= */
exports.aiReceptionist = async (req, res) => {
  try {
    const { message, userId = "guest" } = req.body;

    if (!message || !message.trim()) {
      return res.json({ reply: "Please enter a valid message." });
    }

    const text = message.trim();

    if (!sessions[userId]) {
      sessions[userId] = { step: null, data: {} };
    }

    const session = sessions[userId];

    if (session.step) {
      return await handleSteps(session, text, userId, res);
    }

    if (text.toLowerCase().includes("book")) {
      session.step = "ASK_PHONE";
      return res.json({
        reply: "📞 Please provide your registered phone number.",
      });
    }

    return res.json({
      reply:
        "Hello 😊 I can help you with booking appointments. Type 'book appointment' to begin.",
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({
      reply: "Server error occurred.",
    });
  }
};

/* =========================================
   HANDLE BOOKING FLOW
========================================= */
async function handleSteps(session, text, userId, res) {
  try {
    switch (session.step) {

      /* ================= PHONE ================= */
      case "ASK_PHONE": {

  let cleanPhone = text.replace(/\D/g, "");

  // If user entered 10 digits → convert to +91 format
  if (cleanPhone.length === 10) {
    cleanPhone = "+91" + cleanPhone;
  }

  // If entered 12 digits starting with 91
  if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
    cleanPhone = "+" + cleanPhone;
  }

  if (!cleanPhone.startsWith("+91") || cleanPhone.length !== 13) {
    return res.json({
      reply: "Invalid phone number. Please enter a valid Indian number.",
    });
  }

  session.data.patientPhone = cleanPhone;

  const patient = await Patient.findOne({
    phone: cleanPhone,
  });

  if (!patient) {
    reset(userId);
    return res.json({
      reply: "❌ No registered patient found with this phone number.",
    });
  }

  session.data.patientId = patient._id;
  session.data.patientName = patient.name;

  const clinics = await Clinic.find();

  session.data.clinics = clinics;
  session.step = "SELECT_CLINIC";

  const clinicList = clinics
    .map((c, i) => `${i + 1}. ${c.name}`)
    .join("\n");

  return res.json({
    reply: `Please choose a clinic:\n${clinicList}`,
  });
}
      /* ================= CLINIC ================= */
      case "SELECT_CLINIC": {

        const clinicIndex = parseInt(text) - 1;
        const selectedClinic = session.data.clinics[clinicIndex];

        if (!selectedClinic) {
          return res.json({ reply: "Invalid clinic selection." });
        }

        session.data.clinicId = selectedClinic._id;
        session.data.clinicName = selectedClinic.name;

        const doctors = await Doctor.find({
          clinicId: selectedClinic._id,
        });

        if (!doctors.length) {
          reset(userId);
          return res.json({
            reply: "No doctors available for this clinic.",
          });
        }

        session.data.doctors = doctors;
        session.step = "SELECT_DOCTOR";

        const doctorList = doctors
          .map((d, i) => `${i + 1}. Dr. ${d.name}`)
          .join("\n");

        return res.json({
          reply: `Please choose a doctor:\n${doctorList}`,
        });
      }

      /* ================= DOCTOR ================= */
      case "SELECT_DOCTOR": {

        const doctorIndex = parseInt(text) - 1;
        const selectedDoctor = session.data.doctors[doctorIndex];

        if (!selectedDoctor) {
          return res.json({ reply: "Invalid doctor selection." });
        }

        session.data.doctorId = selectedDoctor._id;
        session.data.doctorName = selectedDoctor.name;
        session.step = "ASK_DATE";

        return res.json({
          reply: "📅 Please provide preferred date (DD-MM-YYYY)",
        });
      }

      /* ================= DATE ================= */
      case "ASK_DATE": {

        const parts = text.split("-");

        if (parts.length !== 3) {
          return res.json({
            reply: "Invalid date format. Use DD-MM-YYYY",
          });
        }

        const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        session.data.date = formattedDate;
        session.step = "ASK_TIME";

        return res.json({
          reply: "⏰ Please provide preferred time (Example: 10:30 AM)",
        });
      }

      /* ================= TIME ================= */
      case "ASK_TIME": {

        session.data.timeSlot = text.trim();
        session.step = "CONFIRM";

        return res.json({
          reply: `Please confirm:

Patient: ${session.data.patientName}
Clinic: ${session.data.clinicName}
Doctor: Dr. ${session.data.doctorName}
Date: ${session.data.date}
Time: ${session.data.timeSlot}

Type YES to confirm or NO to cancel.`,
        });
      }

      /* ================= CONFIRM ================= */
      case "CONFIRM": {

        if (text.toLowerCase() !== "yes") {
          reset(userId);
          return res.json({ reply: "Booking cancelled." });
        }

        const exists = await Appointment.create({
  clinicId: session.data.clinicId,
  doctorId: session.data.doctorId,
  patientId: session.data.patientId,
  patientName: session.data.patientName,
  patientPhone: session.data.patientPhone, // now +91 format
  date: session.data.date,
  timeSlot: session.data.timeSlot,
  status: "booked",
});

        if (exists) {
          reset(userId);
          return res.json({
            reply: "❌ That time slot is already booked.",
          });
        }

        // ✅ Save with normalized phone
        await Appointment.create({
          clinicId: session.data.clinicId,
          doctorId: session.data.doctorId,
          patientId: session.data.patientId,
          patientName: session.data.patientName,
          patientPhone: session.data.patientPhone,
          date: session.data.date,
          timeSlot: session.data.timeSlot,
          status: "booked",
        });

        reset(userId);

        return res.json({
          reply: "🎉 Appointment booked successfully!",
        });
      }

      default:
        reset(userId);
        return res.json({ reply: "Restarting session." });
    }

  } catch (error) {
    console.error("FLOW ERROR:", error);
    reset(userId);
    return res.status(500).json({
      reply: "Something went wrong during booking.",
    });
  }
}

/* =========================================
   RESET SESSION
========================================= */
function reset(userId) {
  sessions[userId] = { step: null, data: {} };
}