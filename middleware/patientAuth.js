const jwt = require("jsonwebtoken");

/* 📞 PHONE NORMALIZER */
function normalizePhone(phone) {
  if (!phone) return "";

  let cleaned = phone.toString().trim();
  cleaned = cleaned.replace(/\s|-/g, "");
  cleaned = cleaned.replace("whatsapp:", "");

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;

  return cleaned;
}

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.phone) {
      return res.status(401).json({
        message: "Invalid token (phone missing)",
      });
    }

    req.patient = {
      patientId: decoded.patientId,
      clinicId: decoded.clinicId,
      phone: normalizePhone(decoded.phone), // ✅ GUARANTEED
    };

    next();
  } catch (err) {
    console.error("❌ Patient Auth Error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};
