const { GoogleGenAI } = require("@google/genai");
 
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from backend .env");
}
 
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
 
const IMAGE_MODEL = "gemini-3.1-flash-image";
 
/**
 * Generate an advertisement image using reference images.
 *
 * @param {Object} params
 * @param {Buffer} params.productImageBuffer
 * @param {string} params.productImageMimeType
 * @param {Buffer} params.modelImageBuffer
 * @param {string} params.modelImageMimeType
 * @param {string} params.prompt
 * @param {string} params.adStyle
 * @returns {Promise<{buffer: Buffer, mimeType: string}>}
 */
async function generateAdImage({
  productImageBuffer,
  productImageMimeType,
  modelImageBuffer,
  modelImageMimeType,
  prompt,
  adStyle = "ugc",
}) {
  if (!productImageBuffer || !modelImageBuffer) {
    throw new Error("Both product and model images are required.");
  }
 
  const supportedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
 
  if (
    !supportedImageTypes.includes(productImageMimeType) ||
    !supportedImageTypes.includes(modelImageMimeType)
  ) {
    throw new Error("Images must be JPEG, PNG, or WebP.");
  }
 
  const instruction = `
Create a professional, realistic product advertisement.
 
Use the first reference image as the product reference.
Use the second reference image as the model/person reference.
 
Preserve the product's recognizable design, colors, and details.
Place the product naturally in the scene with realistic lighting,
shadows, proportions, and composition.
 
Advertisement style: ${adStyle}.
Additional user instructions: ${prompt || "Create a polished commercial advertisement."}
 
Return the generated image, not just a text description.
`;
  console.log("Calling Gemini image generation...");
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      { text: instruction },
      {
        inlineData: {
          mimeType: productImageMimeType,
          data: productImageBuffer.toString("base64"),
        },
      },
      {
        inlineData: {
          mimeType: modelImageMimeType,
          data: modelImageBuffer.toString("base64"),
        },
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1k",
      },
    },
  });
 
  console.log(
  "Gemini response parts:",
  response.candidates?.[0]?.content?.parts?.map((part) => ({
    hasText: Boolean(part.text),
  }))
);
 
  const parts = response.candidates?.[0]?.content?.parts || [];
 
  const generatedImagePart = parts.find(
    (part) => part.inlineData?.data
  );
 
  if (!generatedImagePart) {
    const message = parts
      .map((part) => part.text)
      .filter(Boolean)
      .join(" ");
 
    throw new Error(
      message || "Gemini did not return an image."
    );
  }
 
  return {
    buffer: Buffer.from(
      generatedImagePart.inlineData.data,
      "base64"
    ),
    mimeType:
      generatedImagePart.inlineData.mimeType || "image/png",
  };
}

const VIDEO_MODEL = "gemini-omni-1.1-flash";
/**
 * Generate a video from an existing generated advertisement image.
 *
 * @param {Object} params
 * @param {Buffer} params.imageBuffer
 * @param {string} params.imageMimeType
 * @param {string} params.prompt
 * @returns {Promise<{buffer: Buffer, mimeType: string}>}
 */
async function generateAdVideo({
  imageBuffer,
  imageMimeType,
  prompt,
}) {
  if (!imageBuffer) {
    throw new Error("An image is required to generate a video.");
  }

  if (
    !["image/jpeg", "image/png", "image/webp"].includes(imageMimeType)
  ) {
    throw new Error("Image must be JPEG, PNG, or WebP.");
  }

  console.log("Calling Gemini video generation...");

  const response = await ai.interactions.create({
    model: VIDEO_MODEL,
    input: [
      {
        type: "image",
        data: imageBuffer.toString("base64"),
        mime_type: imageMimeType,
      },
      {
        type: "text",
        text: `Animate this advertisement into a realistic, polished
short marketing video. Preserve the product's appearance and
the main subject. Use natural movement, smooth cinematic camera
motion, realistic lighting, and professional advertising quality.
${prompt || "Create an engaging social media product advertisement."}`,
      },
    ],
    response_format: {
      type: "video",
      aspect_ratio: "9:16",
      resolution: "720p",
    },
  });

  const videoData = response.output_video?.data;

  if (!videoData) {
    throw new Error("Gemini did not return video data.");
  }

  return {
    buffer: Buffer.from(videoData, "base64"),
    mimeType: "video/mp4",
  };
}
 
module.exports = {
  generateAdImage,
  generateAdVideo
};
