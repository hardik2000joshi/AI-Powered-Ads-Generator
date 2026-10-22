const { randomUUID } = require("node:crypto");
const CreditAccount = require("../models/plansModel");
const { ensureCreditAccount } = require("../services/creditService");

const DEMO_PACKAGES = {
  basic: {
    plan: "basic",
    imageCredits: 10,
    videoCredits: 10,
    amountRupees: 200,
  },
  premium: {
    plan: "premium",
    imageCredits: 50,
    videoCredits: 50,
    amountRupees: 1000,
  },
};

const getMyCredits = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const account = await ensureCreditAccount(req.authUserId);
    return res.json({
      success: true,
      account,
      paymentDetails: {
        upiVpa: process.env.UPI_VPA || "",
        payeeName: process.env.UPI_PAYEE_NAME || "",
      },
    });
  } catch (error) {
    console.error("Get credit account error:", error);
    return res.status(500).json({ success: false, message: "Unable to load credits." });
  }
};

const createPurchaseRequest = async (req, res) => {
  try {
    let selectedPackage;

    if (req.body.packageId === "custom") {
      const imageCredits = Number(req.body.imageCredits);
      const videoCredits = Number(req.body.videoCredits);

      if (
        !Number.isInteger(imageCredits) ||
        !Number.isInteger(videoCredits) ||
        imageCredits < 0 ||
        videoCredits < 0 ||
        imageCredits + videoCredits === 0 ||
        imageCredits > 500 ||
        videoCredits > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Choose between 0 and 500 credits of each type, with at least one credit.",
        });
      }

      selectedPackage = {
        plan: "custom",
        imageCredits,
        videoCredits,
        amountRupees: (imageCredits + videoCredits) * 10,
      };
    } else {
      selectedPackage = DEMO_PACKAGES[req.body.packageId];
      if (!selectedPackage) {
        return res.status(400).json({ success: false, message: "Unknown plan." });
      }
    }

    await ensureCreditAccount(req.authUserId);
    const purchaseRequest = {
      requestId: randomUUID(),
      plan: selectedPackage.plan,
      imageCredits: selectedPackage.imageCredits,
      videoCredits: selectedPackage.videoCredits,
      amountRupees: selectedPackage.amountRupees,
      status: "pending",
    };

    const account = await CreditAccount.findOneAndUpdate(
      { clerkUserId: req.authUserId },
      { $push: { purchaseRequests: purchaseRequest } },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Purchase request saved as pending. Credits were not added.",
      purchaseRequest,
      account,
    });
  } catch (error) {
    console.error("Create purchase request error:", error);
    return res.status(500).json({ success: false, message: "Unable to create purchase request." });
  }
};

module.exports = { getMyCredits, createPurchaseRequest };
