const { clerkClient } = require("@clerk/express");
const User = require("../models/userSchema");

async function syncCurrentUser(req, res) {
  try {
    const clerkUser = await clerkClient.users.getUser(req.authUserId);
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return res.status(422).json({
        success: false,
        message: "This Clerk account has no email address to save.",
      });
    }

    const fullName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const resolvedName = fullName || clerkUser.username || email.split("@")[0];
    const name = resolvedName.trim().length >= 2 ? resolvedName : "Clerk user";

    const user = await User.findOneAndUpdate(
      { clerkUserId: req.authUserId },
      {
        $set: { name, email: email.toLowerCase() },
        $setOnInsert: { clerkUserId: req.authUserId },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select("clerkUserId name email createdAt updatedAt");

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Sync Clerk user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save your profile.",
    });
  }
}

module.exports = { syncCurrentUser };
