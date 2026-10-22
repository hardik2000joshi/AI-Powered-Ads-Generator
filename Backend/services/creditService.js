const CreditAccount = require("../models/plansModel");

async function ensureCreditAccount(clerkUserId) {
  return CreditAccount.findOneAndUpdate(
    { clerkUserId },
    {
      $setOnInsert: {
        imageCredits: 2,
        videoCredits: 2,
        imageCreditsGranted: 2,
        videoCreditsGranted: 2,
        plan: "free",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function reserveCredit(clerkUserId, type) {
  const field = type === "image" ? "imageCredits" : "videoCredits";

  return CreditAccount.findOneAndUpdate(
    { clerkUserId, [field]: { $gt: 0 } },
    { $inc: { [field]: -1 } },
    { new: true }
  );
}

async function refundCredit(clerkUserId, type) {
  const field = type === "image" ? "imageCredits" : "videoCredits";
  await CreditAccount.updateOne({ clerkUserId }, { $inc: { [field]: 1 } });
}

module.exports = { ensureCreditAccount, reserveCredit, refundCredit };
