const express = require("express");
const nodemailer = require("nodemailer");
const userSchema = require("./user.schema");
const jwt = require("jsonwebtoken");

const otpStorage = new Map();

let transporter;

try {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAILSECRET,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 90000, //90sec
    greetingTimeout: 30000,
    socketTimeout: 90000,
  });

  console.log("? Email transporter created successfully");
  console.log(`? Using email: ${process.env.Email}`);

  transporter.verify((error, success) => {
    if (error) {
      console.log("?? Email configuration test failed");
      console.log("? Check email credentials and app password");
    } else {
      console.log("? Email server connected successfully");
    }
  });
} catch (error) {
  console.log("?? Email configuration test failed", error);
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(email, otp) {
  const expiryTime = Date.now() + 10 * 60 * 1000;
  otpStorage.set(email, {
    otp,
    expiryTime,
    attempts: 0,
  });
  return expiryTime;
}

async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your One Time Password",
    html: `
        <div style="font-family: Arial, sans-serif monospace;max-width: 600px; margin: 0">
            <h2>Your OTP code is</h2>
            <div style="background-color: #13b4ff; padding: 20px; text-align: center; border-radius: 8px">
                <h1 style="color: #ffffff, font-size: 36px; margin: 0">${otp}</h1>
            </div>
        </div>
        `,
    text: `Your OTP Code is: ${otp}. This code will expire in 10 minutes`,
  };

  return await transporter.sendMail(mailOptions);
}

async function sendOTP(req, res) {
  try {
    const { email } = req.body;
    console.log(email);
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required xoxo",
      });
    }

    const otp = generateOTP();
    const expiryTime = storeOTP(email, otp);

    await sendOTPEmail(email, otp);
    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}, expires in 1o min`,
    });
  } catch (error) {
    console.log("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
}

async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required",
      });
    }

    const storedData = otpStorage.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: "OTP not found or expired",
      });
    }

    if (Date.now() > storedData.expiryTime) {
      otpStorage.delete(email);
      return res.status(400).json({
        success: false,
        error: "OTP has expired",
      });
    }

    if (storedData.otp === otp) {
      const verifyEmail = await userSchema.findOne({ email });
      if (verifyEmail) {
        let jwtoken = jwt.sign(
          { email: verifyEmail.email, userId: verifyEmail._id },
          process.env.JWTSECRET,
          { expiresIn: "1d" }
        );
        otpStorage.delete(email);
        return res.status(200).json({
          success: true,
          data: { accessToken: jwtoken },
          message: "Email verification successful",
        });
      }
    } else {
      storedData.attempts++;
      if (storedData.attempts >= 3) {
        otpStorage.delete(email);
        return res.status(400).json({
          success: false,
          error: "Too many attempts. Please request a new OTP",
        });
      }
      return res.status(400).json({
        success: false,
        error: "Invalid OTP"
      });
    }
  } catch (error) {
    console.log("verification OTP Error", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify OTP"
    });
  }
}

module.exports = { sendOTP, verifyOTP };