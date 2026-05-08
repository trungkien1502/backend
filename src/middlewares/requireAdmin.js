function requireAdmin(req, res, next) {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({
            message: "Admin only"
        });
    }

    next();
}

module.exports = requireAdmin;
