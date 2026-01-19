const axios = require("axios");

module.exports = async (pushToken, title, body) => {
  if (!pushToken) return;

  await axios.post(
    "https://exp.host/--/api/v2/push/send",
    {
      to: pushToken,
      sound: "default",
      title,
      body,
    }
  );
};
