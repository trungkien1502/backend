const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const API_KEY = "4681c9043d9e01626e5a1833b32be16e";
const BASE_IMAGE = "https://image.tmdb.org/t/p/w500";

async function fetchMovies(page = 1) {
    const res = await axios.get(
        "https://api.themoviedb.org/3/movie/now_playing",
        {
            params: {
                api_key: API_KEY,
                language: "vi-VN",
                page
            }
        }
    );

    return res.data.results;
}

async function importMovies() {
    try {
        for (let page = 1; page <= 7; page++) {
            console.log("Dang lay page:", page);

            const movies = await fetchMovies(page);

            for (const m of movies) {
                const existingMovie = await prisma.movie.findFirst({
                    where: { tmdbId: m.id }
                });

                if (existingMovie) {
                    continue;
                }

                await prisma.movie.create({
                    data: {
                        tmdbId: m.id,
                        title: m.title,
                        description: m.overview,
                        poster: m.poster_path ? BASE_IMAGE + m.poster_path : null,
                        backdrop: m.backdrop_path ? BASE_IMAGE + m.backdrop_path : null,
                        releaseDate: m.release_date ? new Date(m.release_date) : null,
                        rating: m.vote_average,
                        duration: null
                    }
                });
            }
        }

        console.log("Import thanh cong!");
    } catch (error) {
        console.error("Loi:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

importMovies();
