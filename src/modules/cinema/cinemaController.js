const cinemaService = require("./cinemaService");

exports.getAllCinemas = async (req, res) => {
    try {
        const cinemas = await cinemaService.getAllCinemas();
        res.json(cinemas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

router.get("/cinemas/:id", cinemaController.getCinemaById);
router.post("/cinemas", authMiddleware, cinemaController.createCinema);
router.put("/cinemas/:id", authMiddleware, cinemaController.updateCinema);
router.delete("/cinemas/:id", authMiddleware, cinemaController.deleteCinema);


exports.getCinemaById = async (req, res) => {
    try {
        const cinema = await cinemaService.getCinemaById(req.params.id);
        if (!cinema) {
            return res.status(404).json({ message: "Cinema not found" });
        }
        res.json(cinema);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCinema = async (req, res) => {
    try {
        const cinema = await cinemaService.createCinema(req.body);
        res.status(201).json(cinema);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }       
};

exports.updateCinema = async (req, res) => {
    try {
        const cinema = await cinemaService.updateCinema(req.params.id, req.body);
        if (!cinema) {
            return res.status(404).json({ message: "Cinema not found" });
        }
        res.json(cinema);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCinema = async (req, res) => {
    try {
        const cinema = await cinemaService.deleteCinema(req.params.id);
        if (!cinema) {
            return res.status(404).json({ message: "Cinema not found" });
        }
        res.json({ message: "Cinema deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};