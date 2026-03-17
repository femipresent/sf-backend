const express = require("express");
const {sendOTP, verifyOTP} = require("../controller/email.controller");

const emailRouter = express.Router();

emailRouter.route("/send-otp").post(sendOTP);
emailRouter.route("/verify-otp").post(verifyOTP);

module.exports = {emailRouter};