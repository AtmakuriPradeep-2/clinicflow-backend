const express = require("express");
const router = express.Router();
const { aiReceptionist } = require("../controllers/ai.controller");

router.post("/receptionist", aiReceptionist);

module.exports = router;