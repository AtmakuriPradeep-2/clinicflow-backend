router.get("/appointments", authPatient, async (req, res) => {
  try {
    const { date } = req.query;

    if (!req.user?.id || !req.user?.clinicId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const filter = {
      patientId: req.user.id,
      clinicId: req.user.clinicId,  // 🔥 IMPORTANT
    };

    // Optional date filter
    if (date) {
      filter.date = date;
    }

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name specialization")
      .populate("clinicId", "name")
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);

  } catch (error) {
    console.error("Patient Appointments Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});