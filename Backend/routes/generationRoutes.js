const express = require("express");
const router = express.Router();
const {getGenerations} = require("../controller/generationController");
router.get("/generation", getGenerations);
module.exports = router;