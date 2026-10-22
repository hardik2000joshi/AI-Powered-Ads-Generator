const mongoose = require("mongoose");

const creditAccountSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditAccount", creditAccountSchema);
