const bookingService = require("./bookingService");

exports.getAllBookings = async (req, res) => {
    try {
        const data = await bookingService.getAllBookings(req.query);
        res.json({ data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const { userId, showtimeId, seatIds } = req.body;

        const data = await bookingService.createBooking({
            userId,
            showtimeId,
            seatIds
        });

        res.json({
            message: "Booking success",
            data
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

exports.getBookingsByUser = async (req, res) => {
    try {
        const data = await bookingService.getBookingsByUser(req.params.userId);
        res.json({ data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const data = await bookingService.getBookingById(req.params.id);
        res.json({ data });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const data = await bookingService.cancelBooking(req.params.id);
        res.json({ message: "Cancelled", data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
