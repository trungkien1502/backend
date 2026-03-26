const express = require("express");

const app = express();
app.use(express.json());

const authRoute = require("./src/modules/auth/authRoute");

const movieRoute = require("./src/modules/movie/movieRoute");
const roomRoute = require("./src/modules/room/roomRoute");
const cinemaRoute = require("./src/modules/cinema/cinemaRoute");

//const authMiddleware = require("./src/middlewares/authMiddleware");


app.use("/cinemas", cinemaRoute);
app.use("/movies", movieRoute);
app.use("/rooms", roomRoute);
app.use("/auth", authRoute);

console.log("Controller path:", require.resolve("./src/modules/auth/authController"));

app.listen(8080, () => {
    console.log("Server running");
});


