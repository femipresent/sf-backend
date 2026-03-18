const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { emailRouter } = require("./routes/email.router");

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*',
    credentials: true
}));

const PORT = process.env.PORT || 8000;

app.use("/api/v1/mailer", emailRouter);

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ success: true, message: "OTP service is running" });
});

app.listen(PORT, () => {
    console.log(`email server up ====>>> on ${PORT}`);
});
