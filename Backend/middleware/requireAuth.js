
const { getAuth } = require("@clerk/express");

function requireAuth(req, res, next) {
  const auth = getAuth(req);

  console.log("Clerk authentication check:", {
    isAuthenticated: auth.isAuthenticated,
    userIdPresent: Boolean(auth.userId),
    authorizationHeaderPresent: Boolean(
      req.headers.authorization
    ),
  });

  if (!auth.isAuthenticated || !auth.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication Required",
    });
  }

  req.authUserId = auth.userId;
  next();
}

module.exports = requireAuth;
