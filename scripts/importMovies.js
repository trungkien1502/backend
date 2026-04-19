const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const API_KEY = "4681c9043d9e01626e5a1833b32be16e"; // 👈 thay key của bạn
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
        for (let page = 1; page <= 7; page++) { // lấy 3 page cho nhẹ
            console.log("Đang lấy page:", page);

            const movies = await fetchMovies(page);

            for (const m of movies) {

                await prisma.movie.upsert({
                    where: { tmdbId: m.id },
                    update: {},
                    create: {
                        tmdbId: m.id,
                        title: m.title,
                        description: m.overview,
                        poster: m.poster_path
                            ? BASE_IMAGE + m.poster_path
                            : null,
                        backdrop: m.backdrop_path
                            ? BASE_IMAGE + m.backdrop_path
                            : null,
                        releaseDate: m.release_date
                            ? new Date(m.release_date)
                            : null,
                        rating: m.vote_average,
                        duration: null // chưa có thì để null
                    }
                });

            }
        }

        console.log("✅ Import thành công!");

    } catch (error) {
        console.error("❌ Lỗi:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

importMovies();