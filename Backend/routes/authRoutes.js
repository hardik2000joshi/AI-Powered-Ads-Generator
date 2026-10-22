const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const {getAuth} = require("@clerk/express");
const router = express.Router();
router.get("/me", requireAuth,(req, res) => {
    const {userId} = getAuth(req);
    res.json({
        message: "Authenticated Successfully",
        userId,
    });
});
module.exports = router;