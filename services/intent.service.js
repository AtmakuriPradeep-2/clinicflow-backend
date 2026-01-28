function detectIntent(message) {
  const text = message.toLowerCase();

  if (text.includes("book")) return "BOOK_APPOINTMENT";
  if (text.includes("cancel")) return "CANCEL_APPOINTMENT";
  if (text.includes("time") || text.includes("timing"))
    return "CLINIC_INFO";
  if (text.includes("doctor") || text.includes("available"))
    return "CHECK_AVAILABILITY";

  return "GENERAL_QUERY";
}

module.exports = { detectIntent };