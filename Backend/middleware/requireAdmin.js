const requireAuth = require("./requireAuth");

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const adminIds = (process.env.ADMIN_CLERK_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!adminIds.includes(req.authUserId)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    next();
  });
}

module.exports = requireAdmin;
