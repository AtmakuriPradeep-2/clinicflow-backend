module.exports = function normalizePhone(phone) {
  if (!phone) return "";

  // remove spaces, dashes
  let cleaned = phone.replace(/\s|-/g, "");

  // remove whatsapp: if exists
  cleaned = cleaned.replace("whatsapp:", "");

  // if already starts with +
  if (cleaned.startsWith("+")) return cleaned;

  // assume Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  return cleaned;
};
