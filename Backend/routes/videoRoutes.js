const express = require("express");
const multer = require("multer");
const {CloudinaryStorage} = require("multer-storage-cloudinary-v2");
const cloudinary = require("../config/cloudinary");
const authMiddleware = require("../middleware/requireAuth");
const {generateVideo, getGeneratedVideo} = require("../controller/videoController");
const router = express.Router();
const storage = new CloudinaryStorage({
    cloudinary,
    params: async(req, file) => ({
        folder: "ai-short-video-ads",
        resource_type: "video",
        allowed_formats: ["mp4", "webm", "mov"],
        public_id:  `${Date.now()}-${file.fieldname}`,
    }),
});
const upload = multer({
    storage,
    limits: {
        fileSize: 10*1024*1024,
        files: 2,
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "video/mp4",
            "video/webm",
            "video/mov",
        ];
        if(!allowedTypes.includes(file.mimetype)){   // mimetype - to identify format and type of file - multipurpose internet mail extensions
            return callback(
                new Error("only mp4, webm, and mov format videos are allowed.")
            );
        }
        callback(null, true);
    },
});
router.post("/", authMiddleware, generateVideo);
router.get("/generated-videos", authMiddleware, getGeneratedVideo);
module.exports = router;
