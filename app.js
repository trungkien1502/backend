require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./cron/clearExpiredSeats");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://uit-cinema.eastasia.cloudapp.azure.com",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors(
{
    origin: function (origin, callback)
    {
        if (!origin)
        {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin))
        {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded(
{
    extended: true
}));

const authRoute = require("./src/modules/auth/authRoute");
const movieRoute = require("./src/modules/movie/movieroute");
const roomRoute = require("./src/modules/room/roomRoute");
const cinemaRoute = require("./src/modules/cinema/cinemaRoute");
const seatRoute = require("./src/modules/seat/seatRoute");
const showtimeRoute = require("./src/modules/showtime/showtimeRoute");
const showtimeseatRoute = require("./src/modules/showtimeseat/showtimeseatRoute");
const bookingRoute = require("./src/modules/booking/bookingRoute");

app.get("/", (req, res) =>
{
    res.status(200).send("Backend is running");
});

app.get("/health", (req, res) =>
{
    res.status(200).json(
    {
        success: true,
        message: "Backend is healthy"
    });
});

app.use("/api/cinemas", cinemaRoute);
app.use("/api/movies", movieRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/auth", authRoute);
app.use("/api/seats", seatRoute);
app.use("/api/showtimes", showtimeRoute);
app.use("/api/showtimeseats", showtimeseatRoute);
app.use("/api/bookings", bookingRoute);

// Giữ route cũ để tránh FE đang dùng bị vỡ.
// Khi FE đổi hết sang /api/... thì có thể xóa phần này.
app.use("/cinemas", cinemaRoute);
app.use("/movies", movieRoute);
app.use("/rooms", roomRoute);
app.use("/auth", authRoute);
app.use("/seats", seatRoute);
app.use("/showtimes", showtimeRoute);
app.use("/showtimeseats", showtimeseatRoute);
app.use("/bookings", bookingRoute);

app.use((req, res) =>
{
    res.status(404).json(
    {
        success: false,
        message: "Route not found"
    });
});

app.use((err, req, res, next) =>
{
    console.error("Server error:", err);

    res.status(err.status || 500).json(
    {
        success: false,
        message: err.message || "Internal server error"
    });
});

const port = process.env.PORT || 8080;

app.listen(port, () =>
{
    console.log(`Server running on port ${port}`);
});