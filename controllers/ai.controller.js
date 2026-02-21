const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Clinic = require("../models/Clinic");

const sessions = {};

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

    // If already in flow
    if (session.step) {
      return await handleSteps(session, text, userId, res);
    }

    // Start booking
    if (text.toLowerCase().includes("book")) {
      session.step = "ASK_PHONE";
      return res.json({
        reply: "📞 Please provide your phone number.",
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

async function handleSteps(session, text, userId, res) {
  try {

    switch (session.step) {

      /* ================= PHONE ================= */
      case "ASK_PHONE":
        session.data.patientPhone = text;
        session.step = "SELECT_CLINIC";

        const clinics = await Clinic.find();

        if (!clinics.length) {
          reset(userId);
          return res.json({
            reply: "No clinics available currently.",
          });
        }

        session.data.clinics = clinics;

        const clinicList = clinics
          .map((c, i) => `${i + 1}. ${c.name}`)
          .join("\n");

        return res.json({
          reply: `Please choose a clinic:\n${clinicList}`,
        });


      /* ================= CLINIC ================= */
      case "SELECT_CLINIC":

        const clinicIndex = parseInt(text) - 1;
        const selectedClinic = session.data.clinics[clinicIndex];

        if (!selectedClinic) {
          return res.json({ reply: "Invalid clinic selection." });
        }

        session.data.clinicId = selectedClinic._id;
        session.data.clinicName = selectedClinic.name;
        session.step = "SELECT_DOCTOR";

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

        const doctorList = doctors
          .map((d, i) => `${i + 1}. Dr. ${d.name}`)
          .join("\n");

        return res.json({
          reply: `Please choose a doctor:\n${doctorList}`,
        });


      /* ================= DOCTOR ================= */
      case "SELECT_DOCTOR":

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


      /* ================= DATE ================= */
      case "ASK_DATE":
        session.data.date = text;
        session.step = "ASK_TIME";

        return res.json({
          reply: "⏰ Please provide preferred time (Example: 10:30 AM)",
        });


      /* ================= TIME ================= */
      case "ASK_TIME":
        session.data.timeSlot = text;
        session.step = "CONFIRM";

        return res.json({
          reply: `Please confirm:

Clinic: ${session.data.clinicName}
Doctor: Dr. ${session.data.doctorName}
Date: ${session.data.date}
Time: ${session.data.timeSlot}

Type YES to confirm or NO to cancel.`,
        });


      /* ================= CONFIRM ================= */
 case "CONFIRM":

  if (text.toLowerCase() === "yes") {

    // 🔥 Find patient by phone
    const Patient = require("../models/Patient");

    const patient = await Patient.findOne({
      phone: session.data.patientPhone,
    });

    if (!patient) {
      reset(userId);
      return res.json({
        reply: "❌ No registered patient found with this phone number.",
      });
    }

    // 🔥 Check slot availability
    const exists = await Appointment.findOne({
      clinicId: session.data.clinicId,
      doctorId: session.data.doctorId,
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

    // ✅ CREATE APPOINTMENT PROPERLY
    await Appointment.create({
      clinicId: session.data.clinicId,
      doctorId: session.data.doctorId,
      patientId: patient._id,     // 🔥 CRITICAL
      patientName: patient.name,  // 🔥 real patient
      patientPhone: patient.phone,
      date: session.data.date,
      timeSlot: session.data.timeSlot,
      status: "booked",
    });

    reset(userId);

    return res.json({
      reply: "🎉 Appointment booked successfully!",
    });
  }

  reset(userId);
  return res.json({ reply: "Booking cancelled." });
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

function reset(userId) {
  sessions[userId] = { step: null, data: {} };
}