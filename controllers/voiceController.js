const { twiml } = require("twilio");
const VoiceResponse = twiml.VoiceResponse;
const aiReceptionistLogic = require("../services/voiceAiService");

// Incoming Call
exports.handleIncomingCall = (req, res) => {
  const response = new VoiceResponse();

  response.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    "Welcome to City Care Clinic. How may I assist you today?"
  );

  response.gather({
    input: "speech",
    action: "/api/voice/process",
    method: "POST",
    speechTimeout: "auto",
  });

  res.type("text/xml");
  res.send(response.toString());
};

// Process Voice
exports.processVoice = async (req, res) => {
  const response = new VoiceResponse();

  const speechText = req.body.SpeechResult;
  const callerPhone = req.body.From;

  if (!speechText) {
    response.say("Sorry, I did not catch that. Please say it again.");
    response.redirect("/api/voice");
    return res.type("text/xml").send(response.toString());
  }

  const reply = await aiReceptionistLogic(speechText, callerPhone);

  response.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    reply
  );

 response.gather({
  input: "speech",
  action: "https://clinicflow-backend-v3e3.onrender.com/api/voice/process",
  method: "POST",
  speechTimeout: "auto",
});

  res.type("text/xml");
  res.send(response.toString());
};