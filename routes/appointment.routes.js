router.get("/appointments", authPatient, async (req, res) => {
  const { date } = req.query;

  const appointments = await Appointment.find({
    patientId: req.user.id,
    date,
  }).populate("doctorId");

  res.json(appointments);
});