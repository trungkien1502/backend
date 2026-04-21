const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const API_KEY = "4681c9043d9e01626e5a1833b32be16e";
const BASE_IMAGE = "https://image.tmdb.org/t/p/w500";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCast(tmdbId) {
    const res = await axios.get(
        `https://api.themoviedb.org/3/movie/${tmdbId}/credits`,
        {
            params: {
                api_key: API_KEY
            }
        }
    );

    return res.data.cast;
}

async function importCast() {
    const movies = await prisma.movie.findMany();

    console.log("Số phim:", movies.length);

    for (const movie of movies) {
        try {
            const castList = await fetchCast(movie.tmdbId);


            await prisma.cast.deleteMany({
                where: { movieId: movie.id }
            });


            const topCast = castList.slice(0, 6);

            for (const actor of topCast) {
                await prisma.cast.create({
                    data: {
                        name: actor.name,
                        character: actor.character,
                        profile: actor.profile_path
                            ? BASE_IMAGE + actor.profile_path
                            : null,
                        movieId: movie.id
                    }
                });
            }

            console.log("✔ Done:", movie.title);

            await sleep(250); // ❗ tránh rate limit

        } catch (err) {
            console.log("❌ Lỗi:", movie.title);
        }
    }

    console.log("✅ Import cast xong");
}

importCast();