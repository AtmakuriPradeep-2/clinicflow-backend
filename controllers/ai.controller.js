const { detectIntent } = require("../services/intent.service");

/* ================= IN-MEMORY STATE ================= */
/* (OK for now – Redis later if needed) */
const sessions = {};

exports.aiReceptionist = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id || "guest"; // works with or without auth

    if (!sessions[userId]) {
      sessions[userId] = {
        intent: null,
        step: null,
        data: {},
      };
    }

    const session = sessions[userId];
    const text = message.trim();

    /* ================= STEP HANDLER (TOP PRIORITY) ================= */
    if (session.step) {
      return handleStepFlow(session, text, res);
    }

    /* ================= INTENT DETECTION ================= */
    const intent = detectIntent(text);

    /* ================= BOOK APPOINTMENT ================= */
    if (intent === "BOOK_APPOINTMENT") {
      session.intent = "BOOK_APPOINTMENT";
      session.step = "ASK_NAME";

      return res.json({
        reply: "Sure 😊 May I know the patient name?",
      });
    }

    /* ================= CLINIC INFO ================= */
    if (intent === "CLINIC_INFO") {
      return res.json({
        reply:
          "🏥 Clinic timings are 9 AM to 8 PM, Monday to Saturday.",
      });
    }

    /* ================= GREETING / FALLBACK ================= */
    return res.json({
      reply:
        "Hello 😊 I can help you with booking appointments or clinic information. What would you like to do?",
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({
      reply:
        "Sorry 😅 I'm having trouble right now. Please try again.",
    });
  }
};

/* ================= STEP FLOW HANDLER ================= */
function handleStepFlow(session, text, res) {
  switch (session.step) {
    case "ASK_NAME":
      session.data.name = text;
      session.step = "ASK_PHONE";
      return res.json({
        reply: "Thanks 😊 Please provide your phone number.",
      });

    case "ASK_PHONE":
      session.data.phone = text;
      session.step = "ASK_DATE";
      return res.json({
        reply: "Got it 👍 What is your preferred appointment date?",
      });

    case "ASK_DATE":
      session.data.date = text;
      session.step = "CONFIRM";
      return res.json({
        reply: `Please confirm:\nPatient: ${session.data.name}\nDate: ${session.data.date}\n\nType YES to confirm or NO to cancel.`,
      });

    case "CONFIRM":
      if (text.toLowerCase() === "yes") {
        /* 🔥 HERE CALL REAL APPOINTMENT API */
        /*
        await Appointment.create({
          name: session.data.name,
          phone: session.data.phone,
          date: session.data.date,
        });
        */

        sessionsReset(session);

        return res.json({
          reply:
            "✅ Your appointment has been booked successfully!\nAnything else I can help you with?",
        });
      } else {
        sessionsReset(session);
        return res.json({
          reply: "❌ Appointment cancelled. Let me know if you need help.",
        });
      }

    default:
      sessionsReset(session);
      return res.json({
        reply:
          "Let's start again 😊 What would you like to do?",
      });
  }
}

/* ================= RESET SESSION ================= */
function sessionsReset(session) {
  session.intent = null;
  session.step = null;
  session.data = {};
}