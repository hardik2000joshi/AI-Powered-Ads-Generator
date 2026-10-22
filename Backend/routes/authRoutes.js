const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { syncCurrentUser } = require("../controller/authController");
const router = express.Router();
router.get("/me", requireAuth, syncCurrentUser);
module.exports = router;
