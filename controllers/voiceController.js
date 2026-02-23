const { twiml } = require("twilio");
const VoiceResponse = twiml.VoiceResponse;
const aiReceptionistLogic = require("../services/voiceAiService");

const BASE_URL = "https://clinicflow-backend-v3e3.onrender.com";

/* ================================
   1️⃣ INCOMING CALL HANDLER
================================ */
exports.handleIncomingCall = (req, res) => {
  const response = new VoiceResponse();

  // Greeting
  response.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    "Welcome to City Care Clinic. How may I assist you today?"
  );

  // Gather Speech or Keypad
  response.gather({
    input: "speech dtmf",
    action: `${BASE_URL}/api/voice/process`,
    method: "POST",
    timeout: 5,
    speechTimeout: "auto",
    speechModel: "phone_call",
    language: "en-US",
  });

  // Fallback if no input
  response.redirect(`${BASE_URL}/api/voice`);

  res.type("text/xml");
  res.send(response.toString());
};

/* ================================
   2️⃣ PROCESS VOICE INPUT
================================ */
exports.processVoice = async (req, res) => {
  const response = new VoiceResponse();

  const speechText = req.body.SpeechResult;
  const callerPhone = req.body.From;

  console.log("📞 Caller:", callerPhone);
  console.log("🗣 Speech:", speechText);

  if (!speechText) {
    response.say(
      {
        voice: "Polly.Joanna",
        language: "en-US",
      },
      "Sorry, I did not catch that. Please say it again."
    );

    response.redirect(`${BASE_URL}/api/voice`);

    return res.type("text/xml").send(response.toString());
  }

  // AI Logic
  const reply = await aiReceptionistLogic(speechText, callerPhone);

  response.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    reply
  );

  // Continue conversation
  response.gather({
    input: "speech dtmf",
    action: `${BASE_URL}/api/voice/process`,
    method: "POST",
    timeout: 5,
    speechTimeout: "auto",
    speechModel: "phone_call",
    language: "en-US",
  });

  // Fallback redirect
  response.redirect(`${BASE_URL}/api/voice`);

  res.type("text/xml");
  res.send(response.toString());
};