const seatService = require("./seatService");

exports.getAllSeats = async (req, res) => {
    try {
        const seats = await seatService.getAllSeats();
        res.json(seats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSeatById = async (req, res) => {
    try {
        const seat = await seatService.getSeatById(req.params.id);
        if (!seat) {
            return res.status(404).json({ message: "Seat not found" });
        }
        res.json(seat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSeatsByRoomId = async (req, res) => {
    try {
        const seats = await seatService.getSeatsByRoomId(req.params.roomId, req.query);
        res.json(seats);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createSeat = async (req, res) => {
    try {
        const seats = await seatService.createSeat(req.body);
        res.json({
            message: "Seats created successfully",
            data: seats
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSeat = async (req, res) => {
    try {
        const seat = await seatService.updateSeat(req.params.id, req.body);
        if (!seat) {
            return res.status(404).json({ message: "Seat not found" });
        }
        res.json(seat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSeat = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const result = await seatService.deleteSeat(roomId);
        if (!roomId) {
            return res.status(404).json({ message: "Room not found", data: result });
        }
        res.json({ message: "Seats deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};