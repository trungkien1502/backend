const movieService = require("./movieService");

exports.getAllMovies = async (req, res) => {
    try {
        const movies = await movieService.getAllMovies();
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMovieById = async (req, res) => {
    try {
        const movie = await movieService.getMovieById(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createMovie = async (req, res) => {
    try {
        const movie = await movieService.createMovie(req.body);
        res.status(201).json(movie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }       
};

exports.updateMovie = async (req, res) => {
    try {
        const movie = await movieService.updateMovie(req.params.id, req.body);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.json(movie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteMovie = async (req, res) => {
    try {
        const movie = await movieService.deleteMovie(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.json({ message: "Movie deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};  

