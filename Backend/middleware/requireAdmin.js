const requireAuth = require("./requireAuth");

function requireAdmin(req, res, next) {
  console.log("requireAdmin middleware reached");
  requireAuth(req, res, () => {
    const adminIds = (process.env.ADMIN_CLERK_USER_IDS)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

       // Temporary diagnostics: don't log the actual user IDs.
    console.log("ADMIN_CLERK_USER_IDS:", process.env.ADMIN_CLERK_USER_IDS);
//     console.log("adminIds:", adminIds);
// console.log("req.authUserId:", req.authUserId);
console.log("Is admin:", adminIds.includes(req.authUserId));

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
