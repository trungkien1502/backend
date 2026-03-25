module.exports = {

    ok: (res, data = null, message = "success") => {
        return res.status(200).json({
            success: true,
            message,
            data
        });
    },

    badRequest: (res, message = "Bad request") => {
        return res.status(400).json({
            success: false,
            message
        });
    },

    error: (res, message = "Server error") => {
        return res.status(500).json({
            success: false,
            message
        });
    }

};