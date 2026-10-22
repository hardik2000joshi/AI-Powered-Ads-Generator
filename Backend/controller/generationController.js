
const Generation = require("../models/generationModel");
const getGenerations = async(req, res) => {
try {
    const {getAuth} = require("@clerk/express");
    const {userId: clerkUserId} = getAuth(req)
    const userId = req.userId || clerkUserId;
    if(!userId){
        return res.status(401).json({
            success: false,
            message: "Please sign in first to view your generations",
        });
    }
    const {type, status, page=1, limit=12} = req.query;
    const filter = {userId};
    if(["image", "video"].includes(type)){
        filter.type = type;
    }
    if(["queued", "processing", "completed", "failed"].includes(status)){
        filter.status = status;    
    }
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));
    const [generations, total] = await Promise.all([
        Generation.find(filter)
        .sort({createdAt: -1})
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
        Generation.countDocuments(filter),
    ]);
    return res.status(200).json({
        success: true,
        generations,
        pagination: {
            total,
            page: pageNumber,
            limit: pageSize,
            totalPages: Math.ceil(total/pageSize),
        },
    });
}
catch(error){
    console.error("GET generations error: ", error);
    return res.status(500).json({
        success: false,
        message: "unable to fetch generations",
    });
}
};
module.exports = {getGenerations};