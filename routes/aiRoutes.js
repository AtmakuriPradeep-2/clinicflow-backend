const express = require("express");
const router = express.Router();

/* ================= AI RECEPTIONIST ================= */
router.post("/receptionist", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "Please send a message.",
      });
    }

    // TEMP BASIC RESPONSE (to verify backend works)
    if (message.toLowerCase().includes("hi")) {
      return res.json({
        reply: "Sure 😊 May I know the patient name?",
      });
    }

    return res.json({
      reply: "I can help you with appointments 😊",
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({
      reply: "AI service error",
    });
  }
});

module.exports = router;