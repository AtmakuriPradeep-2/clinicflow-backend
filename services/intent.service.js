function detectIntent(message) {
  const text = message.toLowerCase();

  if (text.includes("book")) return "BOOK_APPOINTMENT";
  if (text.includes("cancel")) return "CANCEL_APPOINTMENT";
  if (text.includes("time") || text.includes("timing"))
    return "CLINIC_INFO";

  return "UNKNOWN";
}

module.exports = { detectIntent };