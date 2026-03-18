const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./database/dbconnection");
const path = require("path");
const cors = require("cors");
const { userRouter } = require("./src/routes/user.router");
const bookingRouter = require("./src/routes/booking.router");
const driverRouter = require("./src/routes/driver.router");
const dispatcherRouter = require("./src/routes/dispatcher.router");
const adminRouter = require("./src/routes/admin.router");
const rateRouter = require("./src/routes/rate.router");
const paymentRouter = require("./src/routes/payment.router");

const EXPRESSPORT = 5000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'https://sf-delivery.netlify.app', process.env.FRONTEND_URL || '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Make io accessible in routes
app.set('io', io);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Driver joins their room
    socket.on('driver:join', (driverId) => {
        socket.join(`driver:${driverId}`);
        console.log(`Driver ${driverId} joined`);
    });

    // Shipper joins booking room to track
    socket.on('track:join', (bookingId) => {
        socket.join(`booking:${bookingId}`);
        console.log(`Tracking booking ${bookingId}`);
    });

    // Driver sends location update
    socket.on('driver:location', (data) => {
        const { bookingId, lat, lng, driverId } = data;
        // Broadcast to everyone tracking this booking
        io.to(`booking:${bookingId}`).emit('location:update', { lat, lng, driverId, timestamp: new Date() });
        console.log(`Location update for booking ${bookingId}: ${lat}, ${lng}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// load environment variables from the .env file in the project root
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Routes
app.use("/api/v1/register", userRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/driver", driverRouter);
app.use("/api/v1/dispatcher", dispatcherRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/rates", rateRouter);
app.use("/api/v1/payments", paymentRouter);

// Optional: Add a health check route
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

connectDB().then(() => {
    console.log('JWT Secret loaded:', process.env.JWTSECRET ? 'Yes' : 'No');
    httpServer.listen(EXPRESSPORT, () => {
        console.log(`server is running on http://localhost:${EXPRESSPORT}`);
    });
}).catch((error) => {
    console.error("failed to start server due to database connection error", error);
    process.exit(1);
});