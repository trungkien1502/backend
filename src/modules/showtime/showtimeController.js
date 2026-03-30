const showtimeService = require("./showtimeService");

exports.getShowtimes = async (req, res) => {
    try {
        const query = req.query || {};
        const showtimes = await showtimeService.getShowtimes(query);
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getShowtimeById = async (req, res) => {
    try {
        const { id } = req.params;
        const showtime = await showtimeService.getShowtimeById(id);
        if (!showtime) {
            return res.status(404).json({ message: "Showtime not found" });
        }
        res.json(showtime);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createShowtime = async (req, res) => {
    try {
        const showtimeData = req.body;
        const newShowtime = await showtimeService.createShowtime(showtimeData);
        res.status(201).json(newShowtime);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateShowtime = async (req, res) => {
    try {
        const { id } = req.params;
        const showtimeData = req.body;
        const updatedShowtime = await showtimeService.updateShowtime(id, showtimeData);
        if (!updatedShowtime) {
            return res.status(404).json({ message: "Showtime not found" });
        }
        res.json(updatedShowtime);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteShowtime = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedShowtime = await showtimeService.deleteShowtime(id);
        if (!deletedShowtime) {
            return res.status(404).json({ message: "Showtime not found" });
        }
        res.json({ message: "Showtime deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

