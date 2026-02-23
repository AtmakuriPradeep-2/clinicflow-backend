const sessions = {};

async function aiReceptionistLogic(message, userPhone) {
  const text = message.toLowerCase();

  if (!sessions[userPhone]) {
    sessions[userPhone] = { step: null, data: {} };
  }

  const session = sessions[userPhone];

  if (text.includes("book")) {
    session.step = "ASK_DATE";
    return "Sure. Please tell me the appointment date.";
  }

  if (session.step === "ASK_DATE") {
    session.data.date = text;
    session.step = "ASK_TIME";
    return "What time would you prefer?";
  }

  if (session.step === "ASK_TIME") {
    session.data.time = text;
    session.step = null;
    return "Your appointment has been booked successfully. Thank you.";
  }

  if (text.includes("cancel")) {
    session.step = null;
    return "Please provide your appointment date to cancel.";
  }

  return "How can I help you today?";
}

module.exports = aiReceptionistLogic;