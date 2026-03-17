const express = require("express");
const {createProxyMiddleware} = require("http-proxy-middleware");
const connectDB = require("./database/dbconnect");
require("dotenv").config();
const { emailRouter } = require("./routes/email.router");

const app = express();
app.use(express.json());

const PORT = 8000;
app.use("api/v1/msg", createProxyMiddleware ({target: "http://localhost:8002", changeOrigin: true}));

app.use("/api/v1/mailer", emailRouter);

//connectDB()
app.listen(PORT, ()=> {
    console.log(`email server up ====>>> on ${PORT}`);
});