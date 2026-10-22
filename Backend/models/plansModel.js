const mongoose = require("mongoose");

const purchaseRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true },
    plan: { type: String, enum: ["basic", "premium", "custom"], required: true },
    imageCredits: { type: Number, required: true, min: 0 },
    videoCredits: { type: Number, required: true, min: 0 },
    amountRupees: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    paymentReference: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
  },
  { _id: false }
);

const plansSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
    },
    imageCredits: { type: Number, default: 2, min: 0 },
    videoCredits: { type: Number, default: 2, min: 0 },
    imageCreditsGranted: { type: Number, default: 2, min: 0 },
    videoCreditsGranted: { type: Number, default: 2, min: 0 },
    plan: {
      type: String,
      enum: ["free", "basic", "premium", "custom"],
      default: "free",
    },
    purchaseRequests: { type: [purchaseRequestSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", plansSchema);
