const axios = require("axios");
const { PrismaClient, MoviePersonRole, MovieStatus } = require("@prisma/client");

const prisma = new PrismaClient();

const API_KEY = process.env.TMDB_API_KEY || "4681c9043d9e01626e5a1833b32be16e";
const BASE_IMAGE = "https://image.tmdb.org/t/p/w500";
const LANGUAGE = process.env.TMDB_LANGUAGE || "vi-VN";
const IMPORT_PAGES = Number(process.env.TMDB_IMPORT_PAGES || 5);
const CAST_LIMIT = Number(process.env.TMDB_CAST_LIMIT || 8);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildImageUrl(path) {
  return path ? `${BASE_IMAGE}${path}` : null;
}

async function fetchMovieList(page = 1) {
  const res = await axios.get("https://api.themoviedb.org/3/movie/now_playing", {
    params: {
      api_key: API_KEY,
      language: LANGUAGE,
      page,
    },
  });

  return res.data.results || [];
}

async function fetchMovieDetail(tmdbId) {
  const res = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
    params: {
      api_key: API_KEY,
      language: LANGUAGE,
      append_to_response: "credits",
    },
  });

  return res.data;
}

async function upsertMovie(detail) {
  return prisma.movie.upsert({
    where: { tmdbId: detail.id },
    update: {
      title: detail.title,
      description: detail.overview,
      duration: detail.runtime ?? null,
      poster: buildImageUrl(detail.poster_path),
      backdrop: buildImageUrl(detail.backdrop_path),
      releaseDate: detail.release_date ? new Date(detail.release_date) : null,
      rating: detail.vote_average ?? null,
      status: MovieStatus.NOW_SHOWING,
    },
    create: {
      tmdbId: detail.id,
      title: detail.title,
      description: detail.overview,
      duration: detail.runtime ?? null,
      poster: buildImageUrl(detail.poster_path),
      backdrop: buildImageUrl(detail.backdrop_path),
      releaseDate: detail.release_date ? new Date(detail.release_date) : null,
      rating: detail.vote_average ?? null,
      status: MovieStatus.NOW_SHOWING,
    },
  });
}

async function syncGenres(movieId, genres) {
  await prisma.movieGenre.deleteMany({
    where: { movieId },
  });

  for (const item of genres || []) {
    const genre = await prisma.genre.upsert({
      where: { tmdbGenreId: item.id },
      update: {
        name: item.name,
      },
      create: {
        tmdbGenreId: item.id,
        name: item.name,
      },
    });

    await prisma.movieGenre.create({
      data: {
        movieId,
        genreId: genre.id,
      },
    });
  }
}

async function upsertPerson(personData) {
  return prisma.person.upsert({
    where: { tmdbPersonId: personData.id },
    update: {
      name: personData.name,
      profile: buildImageUrl(personData.profile_path),
    },
    create: {
      tmdbPersonId: personData.id,
      name: personData.name,
      profile: buildImageUrl(personData.profile_path),
    },
  });
}

async function syncPeople(movieId, credits) {
  await prisma.moviePerson.deleteMany({
    where: { movieId },
  });

  const castList = (credits?.cast || []).slice(0, CAST_LIMIT);
  for (const actor of castList) {
    const person = await upsertPerson(actor);

    await prisma.moviePerson.create({
      data: {
        movieId,
        personId: person.id,
        role: MoviePersonRole.CAST,
        character: actor.character || null,
        job: null,
      },
    });
  }

  const directors = (credits?.crew || []).filter(
    (member) => member.job === "Director"
  );

  for (const directorData of directors) {
    const person = await upsertPerson(directorData);

    await prisma.moviePerson.create({
      data: {
        movieId,
        personId: person.id,
        role: MoviePersonRole.DIRECTOR,
        character: null,
        job: directorData.job || "Director",
      },
    });
  }
}

async function importTmdbData() {
  try {
    for (let page = 1; page <= IMPORT_PAGES; page += 1) {
      console.log(`Dang lay danh sach phim trang ${page}...`);
      const movies = await fetchMovieList(page);

      for (const movieSummary of movies) {
        try {
          const detail = await fetchMovieDetail(movieSummary.id);
          const movie = await upsertMovie(detail);
          await syncGenres(movie.id, detail.genres);
          await syncPeople(movie.id, detail.credits);

          console.log(`Done: ${movie.title}`);
          await sleep(250);
        } catch (error) {
          console.log(`Loi import phim ${movieSummary.id}: ${error.message}`);
        }
      }
    }

    console.log("Import TMDB thanh cong.");
  } catch (error) {
    console.error("Import TMDB that bai:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importTmdbData();
