const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const normalizePhone = (phone) => {
  if (phone.startsWith("+")) return phone;
  return `+91${phone}`; // India default
};

exports.sendBookingSMS = async ({
  phone,
  patientName,
  doctorName,
  date,
  timeSlot,
}) => {
  try {
    await client.messages.create({
      to: normalizePhone(phone),
      from: process.env.TWILIO_PHONE,
      body: `ClinicFlow Confirmation ✅

Hello ${patientName},

Your appointment is CONFIRMED.

👨‍⚕️ Dr. ${doctorName}
📅 ${date}
⏰ ${timeSlot}

Please arrive 10 minutes early.

– ClinicFlow`,
    });
  } catch (err) {
    console.error("❌ Booking SMS Failed:", err.message);
  }
};

exports.sendCancellationSMS = async ({
  phone,
  patientName,
  doctorName,
  date,
  timeSlot,
}) => {
  try {
    await client.messages.create({
      to: normalizePhone(phone),
      from: process.env.TWILIO_PHONE,
      body: `ClinicFlow Update 🚫

Hello ${patientName},

Your appointment with
Dr. ${doctorName}

📅 ${date}
⏰ ${timeSlot}

has been CANCELLED.

– ClinicFlow`,
    });
  } catch (err) {
    console.error("❌ Cancellation SMS Failed:", err.message);
  }
};
