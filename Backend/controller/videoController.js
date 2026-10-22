const {generateAdVideo} = require("../services/aiService");
const cloudinary = require("../config/cloudinary");
const UGCGeneration = require("../models/createModel");
const Sentry = require("@sentry/node")
const { downloadImage } = require("./createController");
const { ensureCreditAccount, reserveCredit, refundCredit } = require("../services/creditService");
const uploadGeneratedVideo = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "ugc-ai/generated-videos",
                resource_type: "video",
                format: "mp4",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

const generateVideo = async (req, res) => {
    let generation;
    let creditReserved = false;

    try {
        const { generationId } = req.body;
        console.log("Video generation lookup:", {
  generationId,
  userIdPresent: Boolean(req.authUserId),
});

        if (!req.authUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // Find the generation belonging to this authenticated user.
        generation = await UGCGeneration.findOne({
            _id: generationId,
            userId: req.authUserId,
        });
        console.log("Generation found:", Boolean(generation));

        if (!generation) {
            return res.status(404).json({
                success: false,
                message: "Generation not found.",
            });
        }

        if (!generation.generatedImageUrl) {
            return res.status(400).json({
                success: false,
                message: "Generate an image before generating a video.",
            });
        }

        // Avoid generating the same video again unnecessarily.
        if (generation.generatedVideoUrl) {
            return res.status(200).json({
                success: true,
                message: "Video already generated.",
                generatedVideoUrl: generation.generatedVideoUrl,
                generation,
            });
        }

        await ensureCreditAccount(req.authUserId);
        const accountAfterReservation = await reserveCredit(req.authUserId, "video");
        if (!accountAfterReservation) {
            return res.status(402).json({
                success: false,
                code: "NO_VIDEO_CREDITS",
                message: "You have no video credits remaining. Get more credits to create another video.",
            });
        }
        creditReserved = true;

        // Download the existing generated image from Cloudinary.
        const image = await downloadImage(
            generation.generatedImageUrl,
            "image/jpeg"
        );

        // Generate a video using the existing AI service.
        const generatedVideo = await generateAdVideo({
            imageBuffer: image.buffer,
            imageMimeType: image.mimeType,
            prompt: generation.prompt,
        });

        if (!generatedVideo?.buffer?.length) {
            throw new Error("Video generation returned an empty result.");
        }

        // Upload the generated video to Cloudinary.
        const uploadedVideo = await uploadGeneratedVideo(
            generatedVideo.buffer,
            generatedVideo.mimeType || "video/mp4"
        );

        // Update the SAME MongoDB document.
        generation.generatedVideoUrl = uploadedVideo.secure_url;

        await generation.save();
        creditReserved = false;

        return res.status(200).json({
            success: true,
            message: "Advertisement video generated successfully.",
            generatedVideoUrl: generation.generatedVideoUrl,
            generation,
            remainingVideoCredits: accountAfterReservation.videoCredits,
        });
    } catch (error) {
        Sentry.captureException(error);
        console.error("Generate video error:", error);

        if (creditReserved) {
            try {
                await refundCredit(req.authUserId, "video");
            } catch (refundError) {
                Sentry.captureException(refundError);
                console.error("Failed to refund video credit:", refundError);
            }
        }

        return res.status(500).json({
            success: false,
            message: "Failed to generate advertisement video.",
        });
    }
};

const getGeneratedVideo = async(req, res) => {
    try {
        const videos = await UGCGeneration.find({
            userId: req.authUserId,
        }).sort({createdAt: -1});
        return res.status(200).json({
            success: true,
            count: videos.length,
            videos,       
        });
    }
    catch(error){
        Sentry.captureException(error);
        console.error("Get generations error: ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get generated videos",
        });
    }
}
module.exports = {generateVideo, getGeneratedVideo}
