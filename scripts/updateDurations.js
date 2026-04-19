const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const API_KEY = "4681c9043d9e01626e5a1833b32be16e";

async function fetchDetail(id) {
    const res = await axios.get(
        `https://api.themoviedb.org/3/movie/${id}`,
        {
            params: { api_key: API_KEY }
        }
    );
    return res.data;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateDuration() {
    const movies = await prisma.movie.findMany({
        where: {
            duration: null
        }
    });

    console.log("Số phim cần update:", movies.length);

    for (const movie of movies) {

        try {
            const detail = await fetchDetail(movie.tmdbId);

            await prisma.movie.update({
                where: { id: movie.id },
                data: {
                    duration: detail.runtime
                }
            });

            console.log("Updated:", movie.title);

            await sleep(250); // 🔥 tránh rate limit

        } catch (err) {
            console.log("Lỗi:", movie.title);
        }
    }

    console.log("✅ Update duration xong");
}

updateDuration();