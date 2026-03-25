const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;

    // Không có header
    if (!authHeader) {
        return res.status(401).json({
            message: "Token missing"
        });
    }

    // Format: Bearer TOKEN
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Invalid token format"
        });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // lưu userId vào request
        req.userId = decoded.userId;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid token"
        });

    }

}

module.exports = authMiddleware;