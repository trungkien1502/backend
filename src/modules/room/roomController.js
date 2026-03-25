const roomService = require("./roomService");

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await roomService.getAllRooms();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRoomById = async (req, res) => {
    try {
        const room = await roomService.getRoomById(req.params.id); 
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const room = await roomService.createRoom(req.body);
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const room = await roomService.updateRoom(req.params.id, req.body);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.json(room);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const room = await roomService.deleteRoom(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.json({ message: "Room deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};