const Plan = require("../models/plansModel");

async function getPurchaseRequests(req, res) {
  try {
    const accounts = await Plan.find({ "purchaseRequests.0": { $exists: true } })
      .select("clerkUserId plan imageCredits videoCredits purchaseRequests")
      .sort({ updatedAt: -1 })
      .lean();

    const purchaseRequests = accounts.flatMap((account) =>
      (account.purchaseRequests || []).map((request) => ({
        clerkUserId: account.clerkUserId,
        currentPlan: account.plan,
        imageCreditsRemaining: account.imageCredits,
        videoCreditsRemaining: account.videoCredits,
        ...request,
      }))
    );

    return res.json({ success: true, purchaseRequests });
  } catch (error) {
    console.error("Load admin purchase requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load purchase requests.",
    });
  }
}

module.exports = { getPurchaseRequests };
