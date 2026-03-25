const express = require("express");

const app = express();
app.use(express.json());

const authController = require("./src/controllers/authController");
const authMiddleware = require("./src/middlewares/authMiddleware");


console.log("Controller path:", require.resolve("./src/controllers/authController"));
console.log(authController);

app.get("/", (req, res) => {
    res.send("Backend running");
});

console.log(authController);

app.post("/auth/register", authController.register);
app.post("/auth/login", authController.login);
app.get("/auth/me", authMiddleware, authController.getCurrentUser);
app.post("/auth/changepassword", authMiddleware, authController.changePassword);
app.post("/auth/forgotpassword", authController.forgotPassword);
app.post("/auth/resetpassword", authController.resetPassword);
//app.post("/auth/verifyotp", authController.verifyOTP);

app.listen(8080, () => {
    console.log("Server running");
});


