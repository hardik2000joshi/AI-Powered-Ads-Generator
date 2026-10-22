const UGCGeneration = require("../models/createModel");
const Sentry = require("@sentry/node");
const {generateAdImage} = require("../services/aiService");
const https = require("node:https");
const dns = require("node:dns");
const cloudinary = require("cloudinary").v2;
const { ensureCreditAccount, reserveCredit, refundCredit } = require("../services/creditService");
// Download an image already uploaded to Cloudinary.

const downloadImage = async (url, fallbackMimeType, redirects=3) => {
   return new Promise((resolve, reject) => {
        if (redirects > 5) {
            return reject(new Error("Too many redirects downloading image."));
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch {
            return reject(new Error("Invalid image URL."));
        }

        if (parsedUrl.protocol !== "https:") {
            return reject(new Error("Expected an HTTPS image URL."));
        }

        const request = https.get(parsedUrl,{
        family: 4,
        lookup: (hostname, options, callback) => {
            dns.lookup(
                hostname,
                { ...options, family: 4 },
                callback
            );
        },
    }, (response) => {
            const status = response.statusCode;

            if (
                [301, 302, 303, 307, 308].includes(status) &&
                response.headers.location
            ) {
                const nextUrl = new URL(
                    response.headers.location,
                    parsedUrl
                ).toString();

                response.resume();

                return resolve(
                    downloadImage(
                        nextUrl,
                        fallbackMimeType,
                        redirects + 1
                    )
                );
            }

            if (status !== 200) {
                response.resume();
                return reject(
                    new Error(`Image download failed: HTTP ${status}`)
                );
            }

            const mimeType = (
                response.headers["content-type"] || fallbackMimeType || ""
            ).split(";")[0].trim();

            if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
                response.resume();
                return reject(
                    new Error(`Unsupported image content type: ${mimeType}`)
                );
            }

            const chunks = [];

            response.on("data", (chunk) => chunks.push(chunk));
            response.on("error", reject);

            response.on("end", () => {
                request.setTimeout(0);
                const buffer = Buffer.concat(chunks);
                 if (buffer.length === 0) {
                    return reject(new Error("Downloaded image is empty."));
                }
                console.log("Image downloaded:", {
        hostname: parsedUrl.hostname,
        mimeType,
        bytes: buffer.length,
    });
    resolve({ buffer, mimeType });
            });
            response.on("error", (error) => {
    request.setTimeout(0);
    reject(error);
});
        });
        request.on("error", reject);
    });
}

// Upload the generated image buffer to Cloudinary.
const uploadGeneratedImage = (buffer, mimeType) => {
    const base64Image = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    return cloudinary.uploader.upload(dataUri, {
        folder: "ugc-ai/generated-images",
        resource_type: "image",
    });
};
const createAd = async(req, res) => {
    let generation;
    let creditReserved = false;
    try {
        const productImage = req.files?.productImage?.[0];
        const modelImage = req.files?.modelImage?.[0];
        if(!productImage || !modelImage){
            return res.status(400).json({
                success: false,
                message: "Both product image and model image are required",
            });
        }
        const {title, prompt, adStyle, duration} = req.body;
         if (!prompt?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter an advertisement prompt.",
            });
        }

        await ensureCreditAccount(req.authUserId);
        const accountAfterReservation = await reserveCredit(req.authUserId, "image");
        if (!accountAfterReservation) {
            return res.status(402).json({
                success: false,
                code: "NO_IMAGE_CREDITS",
                message: "You have no image credits remaining. Get more credits to create another image.",
            });
        }
        creditReserved = true;

        generation = await UGCGeneration.create({
            userId: req.authUserId,
            title: title?.trim() || "Untitled Ad",  // trim used for removing whitespaces from both ends of a string and returns new string without modify original string
            productImageUrl: productImage.path,
            modelImageUrl: modelImage.path,
            prompt: prompt.trim(),
            adStyle: adStyle || "ugc",
            duration: duration ? Number(duration): 10,
            type: "image",
            status: "processing",
        });

        const [product, model] = await Promise.all([
            downloadImage(productImage.path, productImage.mimetype)
            .catch((error) => {
                console.error("PRODUCT IMAGE DOWNLOAD FAILED:", error.message);
            throw error;
            }),
            downloadImage(modelImage.path, modelImage.mimetype)
            .catch((error) => {
            console.error("MODEL IMAGE DOWNLOAD FAILED:", error.message);
            throw error;
        }),
        ]);

        // 3. Call the Gemini image-generation service.
        const generatedImage = await generateAdImage({
            productImageBuffer: product.buffer,
            productImageMimeType: product.mimeType,
            modelImageBuffer: model.buffer,
            modelImageMimeType: model.mimeType,
            prompt: prompt.trim(),
            adStyle: adStyle || "ugc",
        });

        // 4. Upload the AI-generated image to Cloudinary.
        const uploadedImage = await uploadGeneratedImage(
            generatedImage.buffer,
            generatedImage.mimeType
        );

        // 5. Save the generated image URL and completed status.
        generation.generatedImageUrl = uploadedImage.secure_url;
        generation.status = "completed";
        generation.errorMessage = "";

        await generation.save();
        creditReserved = false;

        return res.status(201).json({
            success: true,
            message: "Advertisement image generated successfully",
            generation,        
            remainingImageCredits: accountAfterReservation.imageCredits,
        });
    }

    
    catch(error){
        Sentry.captureException(error);
        console.error("Create ad error: ", error);
        if (creditReserved) {
            try {
                await refundCredit(req.authUserId, "image");
            } catch (refundError) {
                Sentry.captureException(refundError);
                console.error("Failed to refund image credit:", refundError);
            }
        }
        // If a record exists, mark it as failed.
        if (generation) {
            try {
                generation.status = "failed";
                generation.errorMessage =
                    "Image generation failed. Please try again.";
                await generation.save();
            } catch (saveError) {
                Sentry.captureException(saveError);
                console.error("Failed to update generation:", saveError);
            }
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create ad generation request", ...(generation && {generation}),
        })
    }
}

const getMyGenerations = async(req, res) => {
    try {
        const generations = await UGCGeneration.find({
            userId: req.authUserId,
        }).sort({createdAt: -1});
        return res.status(200).json({
            success: true,
            count: generations.length,
            generations,       
        });
    }
    catch(error){
        Sentry.captureException(error);
        console.error("Get generations error: ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get generations",
        });
    }
}

module.exports = {createAd, getMyGenerations, downloadImage}
