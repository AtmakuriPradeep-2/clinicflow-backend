
   const cron = require("node-cron");
const twilio = require("twilio");
const Appointment = require("../models/Appointment");

const isDevMode = process.env.DEV_MODE === "true";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 🔔 Runs every day at 8 AM

cron.schedule("0 8 * * *", async () => {
 // cron.schedule("*/1 * * * *", async () => {

  console.log("⏰ Running WhatsApp Reminder Job");

  try {
    const today = new Date().toISOString().split("T")[0];

    const appointments = await Appointment.find({
      date: today,
      status: "booked",
      reminderSent: { $ne: true },
    });

    for (const appt of appointments) {
      const message =
        `⏰ Appointment Reminder\n\n` +
        `Hello ${appt.patientName}\n` +
        `📅 Date: ${appt.date}\n` +
        `⏰ Time: ${appt.timeSlot}`;

      if (isDevMode) {
        console.log("🧪 DEV MODE");
        console.log("To:", appt.patientPhone);
        console.log("Message:", message);
      } else {
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: appt.patientPhone.startsWith("whatsapp:")
            ? appt.patientPhone
            : `whatsapp:${appt.patientPhone}`,
          body: message,
        });
      }

      appt.reminderSent = true;
      await appt.save();
    }
  } catch (err) {
    console.error("❌ Reminder Error:", err.message);
  }
});//cron.schedule("*/1 * * * *", async () => {
  