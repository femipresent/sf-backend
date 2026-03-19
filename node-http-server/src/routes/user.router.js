const express = require("express");
const { registerUser, login, findOneUser, registerAdmin, registerDriver, registerDispatcher, getUserProfile } = require("../user/user.controller");
const { protect } = require("../middleware/authMiddleware");

const userRouter = express.Router();

userRouter.route("/register-user").post(registerUser);
userRouter.route("/register-admin").post(registerAdmin);
userRouter.route("/register-driver").post(registerDriver);
userRouter.route("/register-dispatcher").post(registerDispatcher);
userRouter.route("/login").post(login);
userRouter.route("/findone-user").get(findOneUser);
userRouter.route("/profile").get(protect, getUserProfile);


module.exports = {userRouter}


