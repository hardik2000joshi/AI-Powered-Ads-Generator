const mongoose = require("mongoose");
async function connectDB(){
    try{
    await mongoose.connect(process.env.MONGODB_URI)
        console.log("Connected to database");
    }
    catch(error) {
        console.error("Error connecting to database");
        process.exit(1)
    }
}
module.exports = connectDB;