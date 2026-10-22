const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key : process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret : process.env.CLOUDINARY_API_SECRET?.trim(),
    secure: true,
});
console.log({
  cloudNameLoaded: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
  apiKeyLoaded: Boolean(process.env.CLOUDINARY_API_KEY),
  apiSecretLoaded: Boolean(process.env.CLOUDINARY_API_SECRET),
});
module.exports = cloudinary;