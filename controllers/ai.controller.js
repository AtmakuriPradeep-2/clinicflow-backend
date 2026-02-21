const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const { detectIntent } = require("../services/intent.service");
const { getAIReply } = require("../services/ai.service");

const sessions = {};

exports.aiReceptionist = async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return res.json({ reply: "Invalid request." });
    }

    const text = message.trim();

    /* ===== CREATE SESSION IF NOT EXISTS ===== */
    if (!sessions[userId]) {
      sessions[userId] = {
        step: null,
        data: {},
      };
    }

    const session = sessions[userId];

    console.log("USER:", userId);
    console.log("STEP:", session.step);
    console.log("MESSAGE:", text);

    /* ===== IF USER IS ALREADY IN FLOW ===== */
    if (session.step) {
      return handleSteps(session, text, userId, res);
    }

    /* ===== INTENT DETECTION ===== */
    const intent = detectIntent(text);

    if (intent === "BOOK") {
      session.step = "ASK_NAME";
      return res.json({
        reply: "Sure 😊 May I know the patient name?",
      });
    }

    if (intent === "CANCEL") {
      session.step = "ASK_CANCEL_PHONE";
      return res.json({
        reply: "Please provide your phone number to cancel appointment.",
      });
    }

    if (intent === "INFO") {
      return res.json({
        reply:
          "🏥 Clinic timings are 9 AM to 8 PM, Monday to Saturday.",
      });
    }

    /* ===== AI FALLBACK ===== */
    const aiReply = await getAIReply(
      "You are a professional clinic receptionist. Be polite and short.",
      text
    );

    return res.json({ reply: aiReply });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.json({
      reply: "Sorry 😅 Something went wrong. Please try again.",
    });
  }
};
async function handleSteps(session, text, userId, res) {

  switch (session.step) {

    case "ASK_NAME":
      session.data.patientName = text;
      session.step = "ASK_PHONE";
      return res.json({
        reply: "Please provide phone number 📞",
      });

    case "ASK_PHONE":
      session.data.patientPhone = text;
      session.step = "ASK_DATE";
      return res.json({
        reply: "Preferred date? (DD-MM-YYYY)",
      });

    case "ASK_DATE":
      session.data.date = text;
      session.step = "ASK_TIME";
      return res.json({
        reply: "Preferred time? (Example: 10:30 AM)",
      });

    case "ASK_TIME":
      session.data.timeSlot = text;
      session.step = "ASK_DOCTOR";

      const doctors = await Doctor.find();

      if (!doctors.length) {
        reset(userId);
        return res.json({
          reply: "No doctors available currently.",
        });
      }

      session.data.doctors = doctors;

      const doctorList = doctors
        .map((d, i) => `${i + 1}. Dr. ${d.name}`)
        .join("\n");

      return res.json({
        reply: `Please choose a doctor:\n${doctorList}`,
      });

    case "ASK_DOCTOR":
      const index = parseInt(text) - 1;
      const selectedDoctor = session.data.doctors[index];

      if (!selectedDoctor) {
        return res.json({
          reply: "Invalid selection. Please type a valid doctor number.",
        });
      }

      session.data.doctorId = selectedDoctor._id;
      session.data.doctorName = selectedDoctor.name;
      session.step = "CONFIRM";

      return res.json({
        reply: `Please confirm:\n\nPatient: ${session.data.patientName}\nDate: ${session.data.date}\nTime: ${session.data.timeSlot}\nDoctor: Dr. ${selectedDoctor.name}\n\nType YES to confirm or NO to cancel.`,
      });

    case "CONFIRM":

      if (text.toLowerCase() === "yes") {

        const existing = await Appointment.findOne({
          doctorId: session.data.doctorId,
          date: session.data.date,
          timeSlot: session.data.timeSlot,
          status: "booked",
        });

        if (existing) {
          reset(userId);
          return res.json({
            reply: "❌ That time slot is already booked.",
          });
        }

        await Appointment.create({
          clinicId: process.env.DEFAULT_CLINIC_ID,
          doctorId: session.data.doctorId,
          patientName: session.data.patientName,
          patientPhone: session.data.patientPhone,
          date: session.data.date,
          timeSlot: session.data.timeSlot,
        });

        reset(userId);

        return res.json({
          reply: "🎉 Appointment booked successfully!",
        });
      }

      reset(userId);
      return res.json({
        reply: "❌ Booking cancelled.",
      });

    case "ASK_CANCEL_PHONE":

      const appt = await Appointment.findOne({
        patientPhone: text,
        status: "booked",
      });

      if (!appt) {
        reset(userId);
        return res.json({
          reply: "No active appointment found.",
        });
      }

      appt.status = "cancelled";
      await appt.save();

      reset(userId);

      return res.json({
        reply: "✅ Appointment cancelled successfully.",
      });

    default:
      reset(userId);
      return res.json({
        reply: "Let's start again.",
      });
  }
}