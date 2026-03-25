const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (data) => {

    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword
        }
    });

    return user;
};

exports.login = async (email, password) => {

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("User not found");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        throw new Error("Invalid password");
    }

    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    };
};

exports.getCurrentUser = async (userId) => {

    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            gender: true,
            birthDate: true
        }
    });

};


exports.changePassword = async (email, oldPassword, newPassword) => {

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("User not found");
    }

    const match = await bcrypt.compare(oldPassword, user.password);

    if (!match) {
        throw new Error("Old password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });

    return { message: "Password changed successfully" };
};



function gen6() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.forgotPassword = async (email) => {

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) return;

    const otp = gen6();

    const codeHash = await bcrypt.hash(otp, 10);

    await prisma.passwordReset.create({
        data: {
            userId: user.id,
            codeHash: codeHash,
            expireAt: new Date(Date.now() + 10 * 60 * 1000) // 10 phút
        }
    });

    return otp; // sau này gửi email
};

exports.resetPassword = async ({ email, code, newPassword }) => {

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("User not found");
    }

    const reset = await prisma.passwordReset.findFirst({
        where: {
            userId: user.id,
            expireAt: {
                gt: new Date()
            }
        },
        orderBy: {
            expireAt: 'desc'
        }
    });

    if (!reset) {
        throw new Error("No valid OTP found");
    }
    if (reset.expireAt < new Date()) {
        throw new Error("OTP expired");
    }

    const match = await bcrypt.compare(code, reset.codeHash);
    if (!match) {
        throw new Error("Invalid OTP");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword
        }
    });
    await prisma.passwordReset.update({
        where: { id: reset.id },
        data: {
            usedAt: new Date(),
            expireAt: new Date() // set time hết hạn ngay lập tức
        }
    });

    return { message: "Password reset successfully" };
};