const authService = require("../../services/authService");

exports.register = async (req, res) => {

    try {

        const user = await authService.register(req.body);

        res.status(201).json({
            message: "User created",
            user
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });

    }

};

exports.login = async (req, res) => {

    try {

        const result = await authService.login(
            req.body.email,
            req.body.password
        );

        res.json(result);

    } catch (error) {

        res.status(400).json({
            message: error.message
        });

    }

};


exports.getCurrentUser = async (req, res) => {

    try {

        const user = await authService.getCurrentUser(req.userId);

        res.json(user);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

exports.changePassword = async (req, res) => {

    try {

        const result = await authService.changePassword(
            req.userId,
            req.body.oldPassword,
            req.body.newPassword
        );

        res.json(result);

    } catch (error) {

        res.status(400).json({
            message: error.message
        });

    }

};


exports.forgotPassword = async (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "email is required"
        });
    }

    try {

        await authService.forgotPassword(email);

        const otp = await authService.forgotPassword(email);


        return res.json({
            sent: true,
            otp // Include the generated OTP in the response
            //message: "If the email exists, a reset code has been sent"
        });

    } catch (error) {

        return res.status(500).json({
            message: "Failed to send reset code"
        });

    }
};

exports.resetPassword = async (req, res) => {

    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({
            message: "email, code, newPassword are required"
        });
    }

    try {

        await authService.resetPassword({
            email,
            code,
            newPassword
        });

        return res.json({
            reset: true,
            message: "Password has been reset"
        });

    } catch (error) {

        return res.status(400).json({
            message: error.message || "Reset failed"
        });

    }

};
