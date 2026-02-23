const express = require("express");
const router = express.Router();
const voiceController = require("../controllers/voiceController");

router.post("/", voiceController.handleIncomingCall);
router.post("/process", voiceController.processVoice);

module.exports = router;