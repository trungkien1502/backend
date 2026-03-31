const showtimeseatService = require("./showtimeseatService");

exports.getSeatsByShowtime = async (req, res) => {
    try {
        const { showtimeId } = req.params;
        const data = await showtimeseatService.getSeatsByShowtime(showtimeId);

        res.json({ message: "Success", data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.holdSeats = async (req, res) => {
    try {
        const { seatIds, userId, showtimeId } = req.body;

        // if (!showtimeId) throw new Error("showtimeId missing");
        // if (!seatCodes) throw new Error("seatCodes missing");
        // if (!userId) throw new Error("userId missing");

        const result = await showtimeseatService.holdSeats(showtimeId, seatIds, userId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



exports.releaseSeats = async (req, res) => {
    try {
        const { showtimeId, seatIds, userId } = req.body;

        const data = await showtimeseatService.releaseSeats(showtimeId, seatIds, userId);

        res.json({ message: "Seats released", data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};