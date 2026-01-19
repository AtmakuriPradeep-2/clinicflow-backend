const express = require("express");
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/add", auth, async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    const doctor = new Doctor({
      clinicId,
      name: req.body.name,
      specialization: req.body.specialization,
      timings: req.body.timings
    });

    await doctor.save();

    res.json({ message: "Doctor added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
