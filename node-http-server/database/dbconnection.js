const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect(process.env.DBSTRING);
        console.log("database connected successfully");
    }catch (error) {
        console.error("database connection failed", error);
        process.exit(1); //exit the process
    }
}

module.exports = connectDB;