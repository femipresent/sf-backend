const express = require("express");
const { getUserProfile } = require("../user/user.controller");
const authMiddleware = require("../middleware/authMiddleware");

const userProfileRouter = express.Router();

userProfileRouter.use(authMiddleware);
userProfileRouter.route("/profile").get(getUserProfile);

module.exports = userProfileRouter;
