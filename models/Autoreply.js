const mongoose = require("mongoose");

const autoReplySchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic"
  },
  keyword: String,
  replyMessage: String
});

module.exports = mongoose.model("AutoReply", autoReplySchema);
