const express = require("express");
const authMiddleware = require("../middleware/requireAuth");
const { getMyCredits, createPurchaseRequest } = require("../controller/creditController");

const router = express.Router();

router.get("/me", authMiddleware, getMyCredits);
router.post("/purchase-request", authMiddleware, createPurchaseRequest);

module.exports = router;
