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
        const { showtimeId } = req.body;
        const { seatCodes } = req.body;

        if (!showtimeId) throw new Error("showtimeId missing");
        if (!seatCodes) throw new Error("seatCodes missing");

        const result = await showtimeseatService.holdSeats(showtimeId, seatCodes);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// exports.bookSeats = async (req, res) => {
//     try {
//         const { showtimeId, seatIds } = req.body;

//         const data = await showtimeseatService.bookSeats(showtimeId, seatIds);

//         res.json({ message: "Booking success", data });
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

exports.releaseSeats = async (req, res) => {
    try {
        const { showtimeId, seatCodes } = req.body;

        const data = await showtimeseatService.releaseSeats(showtimeId, seatCodes);

        res.json({ message: "Seats released", data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};