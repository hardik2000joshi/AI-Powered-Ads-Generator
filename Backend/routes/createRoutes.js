const express = require("express");
const multer = require("multer");
const {CloudinaryStorage} = require("multer-storage-cloudinary-v2");
const cloudinary = require("../config/cloudinary");
const {createAd, getMyGenerations} = require("../controller/createController");
const authMiddleware = require("../middleware/requireAuth");

const router = express.Router();
const storage = new CloudinaryStorage({
    cloudinary,
    params: async(req, file) => ({
        folder: "ai-short-video-ads",
        resource_type: "image",
        allowed_formats: ["png", "jpeg", "jpg", "webp"],
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
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];
        if(!allowedTypes.includes(file.mimetype)){   // mimetype - to identify format and type of file - multipurpose internet mail extensions
            return callback(
                new Error("only JPG, PNG, JPEG and webp images are allowed.")
            );
        }
        callback(null, true);
    },
});
router.post("/", authMiddleware, upload.fields([
    {name: "productImage", maxCount: 1},
    {name: "modelImage", maxCount:1},
]), createAd);

router.get("/generations", authMiddleware, getMyGenerations);
module.exports = router;
