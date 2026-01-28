const { detectIntent } = require("../services/intent.service");
const { getAIReply } = require("../services/ai.service");

const conversationState = {}; // simple in-memory (OK for now)

exports.aiReceptionist = async (req, res) => {
  try {
    const { message, userId = "guest" } = req.body;

    if (!conversationState[userId]) {
      conversationState[userId] = {
        step: null,
        data: {},
      };
    }

    const state = conversationState[userId];
    const intent = detectIntent(message);

    /* ===== CLINIC INFO ===== */
    if (intent === "CLINIC_INFO") {
      return res.json({
        reply:
          "🏥 Clinic timings are 9 AM to 8 PM, Monday to Saturday.",
      });
    }

    /* ===== BOOK APPOINTMENT FLOW ===== */
    if (intent === "BOOK_APPOINTMENT" && !state.step) {
      state.step = "ASK_NAME";
      return res.json({ reply: "Sure 😊 May I know the patient name?" });
    }

    if (state.step === "ASK_NAME") {
      state.data.name = message;
      state.step = "ASK_PHONE";
      return res.json({ reply: "Please provide your phone number 📞" });
    }

    if (state.step === "ASK_PHONE") {
      state.data.phone = message;
      state.step = "ASK_DATE";
      return res.json({ reply: "Preferred appointment date?" });
    }

    if (state.step === "ASK_DATE") {
      state.data.date = message;
      state.step = "CONFIRM";
      return res.json({
        reply: `✅ Confirm appointment for ${state.data.name} on ${state.data.date}? (yes/no)`,
      });
    }

    if (state.step === "CONFIRM") {
      if (message.toLowerCase().includes("yes")) {
        // 🔥 CALL YOUR EXISTING APPOINTMENT API HERE
        conversationState[userId] = null;

        return res.json({
          reply:
            "🎉 Your appointment has been booked successfully!",
        });
      } else {
        conversationState[userId] = null;
        return res.json({ reply: "❌ Appointment cancelled." });
      }
    }

    /* ===== GENERAL AI RESPONSE ===== */
    const systemPrompt = `
You are a professional clinic receptionist.
Be polite and concise.
Do not give medical advice.
Ask one question at a time.
`;

    const aiReply = await getAIReply(systemPrompt, message);

    res.json({ reply: aiReply });
  } catch (error) {
    console.error(error);
    res.json({
      reply:
        "Sorry 😅 I'm having trouble right now. Please try again later.",
    });
  }
};