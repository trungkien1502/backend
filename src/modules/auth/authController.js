const authService = require("./authService");

const Joi = require("joi");

const registerSchema = Joi.object({
    email: Joi.string().email().required(),

    password: Joi.string().min(6).required(),

    name: Joi.string().min(2).required(),

    phone: Joi.string()
        .pattern(/^[0-9]{9,11}$/)
        .required()
});

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().min(6).required(),
    newPassword: Joi.string().min(6).required()
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().pattern(/^[0-9]{6}$/).required(),
    newPassword: Joi.string().min(6).required()
});

exports.register = async (req, res) => {

    const { error, value } = registerSchema.validate(req.body, {
        stripUnknown: true
    });

    if (error) {
        return res.status(400).json({
            message: error.details[0].message
        });
    }

    try {

        const user = await authService.register(value);

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
    const { error, value } = changePasswordSchema.validate(req.body, {
        stripUnknown: true
    });

    if (error) {
        return res.status(400).json({
            message: error.details[0].message
        });
    }

    try {

        const result = await authService.changePassword(
            req.userId,
            value.oldPassword,
            value.newPassword
        );

        res.json(result);

    } catch (error) {

        res.status(400).json({
            message: error.message
        });

    }

};


exports.forgotPassword = async (req, res) => {
    const { error, value } = forgotPasswordSchema.validate(req.body, {
        stripUnknown: true
    });

    if (error) {
        return res.status(400).json({
            message: error.details[0].message
        });
    }

    try {
        await authService.forgotPassword(value.email);


        return res.json({
            sent: true,
            message: "If the email exists, a reset code has been sent"
        });

    } catch (error) {

        return res.status(500).json({
            message: "Failed to send reset code"
        });

    }
};

exports.resetPassword = async (req, res) => {
    const { error, value } = resetPasswordSchema.validate(req.body, {
        stripUnknown: true
    });

    if (error) {
        return res.status(400).json({
            message: error.details[0].message
        });
    }

    try {

        await authService.resetPassword({
            email: value.email,
            code: value.code,
            newPassword: value.newPassword
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
