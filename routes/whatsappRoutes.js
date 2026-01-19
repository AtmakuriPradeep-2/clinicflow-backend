const express = require("express");

const Conversation = require("../models/Conversation");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Clinic = require("../models/Clinic");
const Doctor = require("../models/Doctor");

const router = express.Router();

/* ======================
   TIME SLOTS
====================== */
const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "04:00 PM",
  "05:00 PM"
];

/* ======================
   PHONE NORMALIZER
====================== */
function normalizePhone(phone) {
  let p = phone.replace("whatsapp:", "").replace(/\D/g, "");
  if (p.length === 10) p = "91" + p;
  return "+" + p;
}

/* ======================
   WHATSAPP WEBHOOK
====================== */
router.post("/webhook", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.From || "");
    const rawText = (req.body.Body || "").trim();
    const text = rawText.toLowerCase();

    console.log("📩 Incoming:", phone, rawText);

    /* ======================
       UPSERT CONVERSATION
    ====================== */
    let convo = await Conversation.findOneAndUpdate(
      { phone },
      { $setOnInsert: { phone, step: "START", tempData: {} } },
      { new: true, upsert: true }
    );

    // Reset commands
    if (["hi", "hello", "menu", "start"].includes(text)) {
      convo.step = "START";
      convo.tempData = {};
    }

    let reply = "";

    /* ======================
       START
    ====================== */
    if (convo.step === "START") {
      const patients = await Patient.find({ phone });

      if (patients.length === 0) {
        reply = "❌ You are not registered with any clinic.";
        convo.step = "DONE";
      }

      else if (patients.length === 1) {
        convo.tempData.clinicId = patients[0].clinicId;
        const clinic = await Clinic.findById(patients[0].clinicId);

        reply =
          `🏥 ${clinic.name}\n\n` +
          `1️⃣ Book Appointment\n` +
          `2️⃣ Cancel Appointment\n` +
          `3️⃣ My Appointment\n\n` +
          `Reply with option number`;

        convo.step = "MENU";
      }

      else {
        const clinics = await Clinic.find({
          _id: { $in: patients.map(p => p.clinicId) }
        });

        convo.tempData.clinics = clinics.map(c => ({
          id: c._id,
          name: c.name
        }));

        reply =
          `🏥 Select Clinic:\n\n` +
          clinics.map((c, i) => `${i + 1}️⃣ ${c.name}`).join("\n");

        convo.step = "CLINIC_SELECT";
      }
    }

    /* ======================
       CLINIC SELECT
    ====================== */
    else if (convo.step === "CLINIC_SELECT") {
      const index = parseInt(text) - 1;

      if (
        !convo.tempData.clinics ||
        isNaN(index) ||
        index < 0 ||
        index >= convo.tempData.clinics.length
      ) {
        reply = "❌ Invalid clinic number. Try again.";
      } else {
        convo.tempData.clinicId = convo.tempData.clinics[index].id;

        reply =
          `1️⃣ Book Appointment\n` +
          `2️⃣ Cancel Appointment\n` +
          `3️⃣ My Appointment`;

        convo.step = "MENU";
      }
    }

    /* ======================
       MENU
    ====================== */
    else if (convo.step === "MENU") {

      if (text === "1") {
        reply = "📝 Please send your *name*";
        convo.step = "NAME";
      }

      else if (text === "2") {
        const appt = await Appointment.findOne({
          clinicId: convo.tempData.clinicId,
          patientPhone: phone,
          status: "booked"
        }).sort({ createdAt: -1 });

        if (!appt) {
          reply = "❌ No active appointment found.";
        } else {
          appt.status = "cancelled";
          await appt.save();
          reply =
            `✅ Appointment Cancelled\n` +
            `📅 ${appt.date}\n` +
            `⏰ ${appt.timeSlot}`;
        }
        convo.step = "DONE";
      }

      else if (text === "3") {
        const appt = await Appointment.findOne({
          clinicId: convo.tempData.clinicId,
          patientPhone: phone
        }).sort({ createdAt: -1 });

        if (!appt) {
          reply = "❌ No appointment found.";
        } else {
          reply =
            `📋 Your Appointment\n\n` +
            `👤 ${appt.patientName}\n` +
            `📅 ${appt.date}\n` +
            `⏰ ${appt.timeSlot}\n` +
            `📌 Status: ${appt.status}`;
        }
        convo.step = "DONE";
      }

      else {
        reply = "❌ Invalid option. Reply 1, 2 or 3.";
      }
    }

    /* ======================
       NAME
    ====================== */
    else if (convo.step === "NAME") {
      convo.tempData.name = rawText;
      reply = "📅 Send appointment date (YYYY-MM-DD)";
      convo.step = "DATE";
    }

    /* ======================
       DATE
    ====================== */
    else if (convo.step === "DATE") {
      convo.tempData.date = rawText;

      reply =
        `⏰ Select time slot:\n\n` +
        TIME_SLOTS.map((s, i) => `${i + 1}️⃣ ${s}`).join("\n");

      convo.step = "SLOT";
    }

    /* ======================
       SLOT
    ====================== */
    else if (convo.step === "SLOT") {
      const index = parseInt(text) - 1;

      if (
        !convo.tempData.clinicId ||
        !convo.tempData.name ||
        !convo.tempData.date
      ) {
        reply = "⚠️ Session expired. Send *Hi*.";
        convo.step = "START";
        convo.tempData = {};
      }

      else if (isNaN(index) || index < 0 || index >= TIME_SLOTS.length) {
        reply = "❌ Invalid slot. Choose again.";
      }

      else {
        let patient = await Patient.findOne({
          clinicId: convo.tempData.clinicId,
          phone
        });

        if (!patient) {
          patient = await Patient.create({
            clinicId: convo.tempData.clinicId,
            name: convo.tempData.name,
            phone,
            password: "WHATSAPP"
          });
        }

        const doctor = await Doctor.findOne({
          clinicId: convo.tempData.clinicId
        });

        await Appointment.create({
          clinicId: convo.tempData.clinicId,
          doctorId: doctor._id,
          patientName: patient.name,
          patientPhone: phone,
          date: convo.tempData.date,
          timeSlot: TIME_SLOTS[index],
          status: "booked"
        });

        reply =
          `✅ Appointment Confirmed\n\n` +
          `👤 ${patient.name}\n` +
          `📅 ${convo.tempData.date}\n` +
          `⏰ ${TIME_SLOTS[index]}`;

        convo.step = "DONE";
        convo.tempData = {};
      }
    }

    await convo.save();

    console.log("🤖 BOT:", reply);

    /* ======================
       ✅ SEND MESSAGE TO WHATSAPP
    ====================== */
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>${reply}</Message>
      </Response>
    `);

  } catch (err) {
    console.error("❌ WhatsApp Error:", err);

    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>❌ Something went wrong. Please try again.</Message>
      </Response>
    `);
  }
});

module.exports = router;
