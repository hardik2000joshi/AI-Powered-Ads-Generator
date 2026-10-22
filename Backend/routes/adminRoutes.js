const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const { getPurchaseRequests } = require("../controller/adminController");

const router = express.Router();

router.get("/purchase-requests", requireAdmin, getPurchaseRequests);

module.exports = router;
