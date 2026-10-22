const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);
module.exports = User;
