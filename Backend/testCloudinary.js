require("dotenv").config();

const cloudinary = require("./config/cloudinary");

async function testCloudinary() {
  try {
    const result = await cloudinary.api.ping();
    console.log("Cloudinary authentication successful:", result);
  } catch (error) {
    console.error("Cloudinary authentication failed:", {
      message: error.message,
      http_code: error.http_code,
    });
  }
}

testCloudinary();