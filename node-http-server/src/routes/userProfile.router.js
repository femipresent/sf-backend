const express = require("express");
const { getUserProfile } = require("../user/user.controller");
const { protect } = require("../middleware/authMiddleware");

const userProfileRouter = express.Router();

userProfileRouter.use(protect);
userProfileRouter.route("/profile").get(getUserProfile);

module.exports = userProfileRouter;
