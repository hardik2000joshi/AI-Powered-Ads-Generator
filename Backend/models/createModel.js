const mongoose = require("mongoose");

const ugcGenerationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
    },

    title: {
      type: String,
      default: "Untitled Ad",
      trim: true,
    },

    productImageUrl: {
      type: String,
      required: true,
    },

    modelImageUrl: {
      type: String,
      required: true,
    },

    prompt: {
      type: String,
      default: "",
      trim: true,
    },

    adStyle: {
      type: String,
      enum: ["realistic", "cinematic", "minimal", "luxury", "ugc"],
      default: "ugc",
    },

    duration: {
      type: Number,
      enum: [5, 10, 15, 30],
      default: 10,
    },

    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    generatedImageUrl: {
      type: String,
      default: "",
    },

    generatedVideoUrl: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },

    errorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UGCGeneration", ugcGenerationSchema);
