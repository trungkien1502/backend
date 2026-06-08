const nodemailer = require("nodemailer");

function requireEnv(name) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is required to send email`);
    }

    return value;
}

function createTransporter() {
    return nodemailer.createTransport({
        host: requireEnv("SMTP_HOST"),
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: requireEnv("SMTP_USER"),
            pass: requireEnv("SMTP_PASS")
        }
    });
}

async function sendPasswordResetEmail(to, otp) {
    const appName = process.env.APP_NAME || "Cinema";
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;

    await createTransporter().sendMail({
        from,
        to,
        subject: `${appName} password reset code`,
        text: `Your password reset code is ${otp}. This code expires in 10 minutes.`,
        html: `
            <p>Your password reset code is:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
            <p>This code expires in 10 minutes.</p>
        `
    });
}

module.exports = {
    sendPasswordResetEmail
};
