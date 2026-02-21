exports.detectIntent = (message) => {
  const text = message.toLowerCase();

  if (text.includes("book")) return "BOOK";
  if (text.includes("cancel")) return "CANCEL";
  if (text.includes("clinic")) return "INFO";

  return "UNKNOWN";
};