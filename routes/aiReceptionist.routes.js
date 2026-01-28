const express = require("express");
const router = express.Router();
const {
  aiReceptionist,
} = require("../controllers/aiReceptionist.controller");

router.post("/receptionist", aiReceptionist);

module.exports = router;