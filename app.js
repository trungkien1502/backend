require("dotenv").config();
const express = require("express");
require("./cron/clearExpiredSeats");
const app = express();

app.use(express.json());

const authRoute = require("./src/modules/auth/authRoute");

const movieRoute = require("./src/modules/movie/movieroute");
const roomRoute = require("./src/modules/room/roomRoute");
const cinemaRoute = require("./src/modules/cinema/cinemaRoute");
const seatRoute = require("./src/modules/seat/seatRoute");
const showtimeRoute = require("./src/modules/showtime/showtimeRoute");
const showtimeseatRoute = require("./src/modules/showtimeseat/showtimeseatRoute");
const bookingRoute = require("./src/modules/booking/bookingRoute");


app.use("/cinemas", cinemaRoute);
app.use("/movies", movieRoute);
app.use("/rooms", roomRoute);
app.use("/auth", authRoute);
app.use("/seats", seatRoute);
app.use("/showtimes", showtimeRoute);
app.use("/showtimeseats", showtimeseatRoute);
app.use("/bookings", bookingRoute);

app.get("/", (req, res) => {
    res.send("Backend is running");
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


