const showtimeseatService = require("./showtimeseatService");

exports.getSeatsByShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;
        const data = await service.getSeatsByShowtime(showtimeId);

        res.json({ message: "Success", data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.holdSeats = async (req, res) => {
    try {
        const { showtimeId, seatIds } = req.body;

        const data = await service.holdSeats(showtimeId, seatIds);

        res.json({ message: "Seats held", data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.bookSeats = async (req, res) => {
    try {
        const { showtimeId, seatIds } = req.body;

        const data = await service.bookSeats(showtimeId, seatIds);

        res.json({ message: "Booking success", data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.releaseSeats = async (req, res) => {
    try {
        const { showtimeId, seatIds } = req.body;

        const data = await service.releaseSeats(showtimeId, seatIds);

        res.json({ message: "Seats released", data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};