router.get("/appointments", authPatient, async (req, res) => {
  try {
    const { date } = req.query;

    console.log("Logged user:", req.user);
    console.log("Query date:", date);

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const filter = {
      patientId: req.user.id,
      status: "booked", // 🔥 only active ones
    };

    if (date) {
      filter.date = date;
    }

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name specialization")
      .populate("clinicId", "name")
      .sort({ date: 1, timeSlot: 1 });

    console.log("Found appointments:", appointments.length);

    res.json(appointments);

  } catch (error) {
    console.error("Patient Appointments Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});