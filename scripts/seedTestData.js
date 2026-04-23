const bcrypt = require("bcrypt");
const {
  PrismaClient,
  BookingStatus,
  MovieStatus,
  SeatStatus,
} = require("@prisma/client");

const prisma = new PrismaClient();

const DEMO_PASSWORD = "123456";

// Coordinates:
// - Galaxy Nguyễn Du: exact coordinate from Wikimapia listing.
// - Galaxy Kinh Dương Vương: exact camera/location coordinate from Wikimedia Commons.
// - Galaxy Tân Bình: approximate sample coordinate inferred from the public address listing.
const CINEMAS = [
  {
    name: "Galaxy Nguyễn Du",
    location: "116 Nguyễn Du, Quận 1, TP.HCM",
    poster:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    latitude: "10.7730560",
    longitude: "106.6927780",
    rooms: [
      { name: "Phòng 1", totalSeats: 48 },
      { name: "Phòng 2", totalSeats: 64 },
    ],
  },
  {
    name: "Galaxy Tân Bình",
    location: "246 Nguyễn Hồng Đào, Phường 14, Tân Bình, TP.HCM",
    poster:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
    latitude: "10.8011200",
    longitude: "106.6438700",
    rooms: [
      { name: "Phòng 1", totalSeats: 56 },
      { name: "Phòng 2", totalSeats: 72 },
    ],
  },
  {
    name: "Galaxy Kinh Dương Vương",
    location: "718bis Kinh Dương Vương, Quận 6, TP.HCM",
    poster:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80",
    latitude: "10.7497280",
    longitude: "106.6285560",
    rooms: [
      { name: "Phòng 1", totalSeats: 48 },
      { name: "Phòng 2", totalSeats: 64 },
    ],
  },
];

const DEMO_USERS = [
  {
    name: "Nguyen Van Test",
    email: "test1@example.com",
    phone: "0900000001",
    gender: "male",
  },
  {
    name: "Tran Thi Demo",
    email: "test2@example.com",
    phone: "0900000002",
    gender: "female",
  },
];

function buildSeatNumbers(totalSeats) {
  const perRow = 8;
  const rowsNeeded = Math.ceil(totalSeats / perRow);
  const seats = [];

  for (let rowIndex = 0; rowIndex < rowsNeeded; rowIndex += 1) {
    const rowLabel = String.fromCharCode(65 + rowIndex);
    for (let seatIndex = 1; seatIndex <= perRow; seatIndex += 1) {
      if (seats.length >= totalSeats) break;
      seats.push(`${rowLabel}${seatIndex}`);
    }
  }

  return seats;
}

async function findOrCreateCinema(cinemaData) {
  const existing = await prisma.cinema.findFirst({
    where: { name: cinemaData.name },
  });

  if (existing) {
    return prisma.cinema.update({
      where: { id: existing.id },
      data: {
        location: cinemaData.location,
        poster: cinemaData.poster,
        latitude: cinemaData.latitude,
        longitude: cinemaData.longitude,
      },
    });
  }

  return prisma.cinema.create({
    data: {
      name: cinemaData.name,
      location: cinemaData.location,
      poster: cinemaData.poster,
      latitude: cinemaData.latitude,
      longitude: cinemaData.longitude,
    },
  });
}

async function findOrCreateRoom(cinemaId, roomData) {
  const existing = await prisma.room.findFirst({
    where: {
      cinemaId,
      name: roomData.name,
    },
  });

  if (existing) {
    return prisma.room.update({
      where: { id: existing.id },
      data: { totalSeats: roomData.totalSeats },
    });
  }

  return prisma.room.create({
    data: {
      cinemaId,
      name: roomData.name,
      totalSeats: roomData.totalSeats,
    },
  });
}

async function ensureSeats(room) {
  const existingSeats = await prisma.seat.findMany({
    where: { roomId: room.id },
    orderBy: { id: "asc" },
  });

  if (existingSeats.length >= room.totalSeats) {
    return existingSeats;
  }

  const existingNumbers = new Set(existingSeats.map((seat) => seat.seatNumber));
  const allSeatNumbers = buildSeatNumbers(room.totalSeats);
  const missingSeatNumbers = allSeatNumbers.filter(
    (seatNumber) => !existingNumbers.has(seatNumber)
  );

  if (missingSeatNumbers.length > 0) {
    await prisma.seat.createMany({
      data: missingSeatNumbers.map((seatNumber) => ({
        roomId: room.id,
        seatNumber,
      })),
    });
  }

  return prisma.seat.findMany({
    where: { roomId: room.id },
    orderBy: { id: "asc" },
  });
}

async function ensureDemoUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];

  for (const userData of DEMO_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: userData.name,
          phone: userData.phone,
          gender: userData.gender,
          password: existing.password || passwordHash,
        },
      });
      users.push(updated);
      continue;
    }

    const created = await prisma.user.create({
      data: {
        ...userData,
        password: passwordHash,
      },
    });
    users.push(created);
  }

  return users;
}

function computeMovieStatus(releaseDate) {
  if (!releaseDate) return MovieStatus.NOW_SHOWING;

  const now = new Date();
  const release = new Date(releaseDate);
  const diffDays = (release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays > 7) return MovieStatus.COMING_SOON;
  if (diffDays < -45) return MovieStatus.ENDED;
  return MovieStatus.NOW_SHOWING;
}

async function normalizeMovieStatuses() {
  const movies = await prisma.movie.findMany({
    select: {
      id: true,
      releaseDate: true,
    },
  });

  for (const movie of movies) {
    await prisma.movie.update({
      where: { id: movie.id },
      data: {
        status: computeMovieStatus(movie.releaseDate),
      },
    });
  }
}

async function ensureShowtime(room, movie, startTime, price) {
  const durationMinutes = movie.duration || 110;
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const existing = await prisma.showtime.findFirst({
    where: {
      roomId: room.id,
      movieId: movie.id,
      startTime,
    },
  });

  const showtime = existing
    ? await prisma.showtime.update({
        where: { id: existing.id },
        data: {
          endTime,
          price,
        },
      })
    : await prisma.showtime.create({
        data: {
          roomId: room.id,
          movieId: movie.id,
          startTime,
          endTime,
          price,
        },
      });

  const seatCount = await prisma.showtimeSeat.count({
    where: { showtimeId: showtime.id },
  });

  if (seatCount === 0) {
    const seats = await prisma.seat.findMany({
      where: { roomId: room.id },
      select: { id: true },
    });

    await prisma.showtimeSeat.createMany({
      data: seats.map((seat) => ({
        showtimeId: showtime.id,
        seatId: seat.id,
        status: SeatStatus.AVAILABLE,
      })),
    });
  }

  return showtime;
}

async function seedShowtimes(rooms, movies) {
  const seededShowtimes = [];
  const baseDays = [0, 1, 2];
  const baseHours = [10, 14, 19];

  for (let roomIndex = 0; roomIndex < rooms.length; roomIndex += 1) {
    const room = rooms[roomIndex];

    for (let dayIndex = 0; dayIndex < baseDays.length; dayIndex += 1) {
      const movie = movies[(roomIndex + dayIndex) % movies.length];

      for (let slotIndex = 0; slotIndex < baseHours.length; slotIndex += 1) {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + baseDays[dayIndex]);
        startTime.setHours(baseHours[slotIndex] + roomIndex, 0, 0, 0);

        const price = 90000 + slotIndex * 15000;
        const showtime = await ensureShowtime(room, movie, startTime, price);
        seededShowtimes.push(showtime);
      }
    }
  }

  return seededShowtimes;
}

async function seedSampleBooking(user, showtime) {
  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId: user.id,
      showtimeId: showtime.id,
    },
  });

  if (existingBooking) {
    return existingBooking;
  }

  const availableSeats = await prisma.showtimeSeat.findMany({
    where: {
      showtimeId: showtime.id,
      status: SeatStatus.AVAILABLE,
    },
    take: 2,
    orderBy: { seatId: "asc" },
  });

  if (availableSeats.length < 2) {
    return null;
  }

  const totalPrice = Number(showtime.price) * availableSeats.length;

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      showtimeId: showtime.id,
      totalPrice,
      status: BookingStatus.CONFIRMED,
    },
  });

  await prisma.bookingSeat.createMany({
    data: availableSeats.map((seat) => ({
      bookingId: booking.id,
      showtimeSeatId: seat.id,
    })),
  });

  await prisma.showtimeSeat.updateMany({
    where: {
      id: { in: availableSeats.map((seat) => seat.id) },
    },
    data: {
      status: SeatStatus.BOOKED,
      holdUntil: null,
      heldBy: null,
    },
  });

  return booking;
}

async function seedHoldSeats(user, showtime) {
  const alreadyHeld = await prisma.showtimeSeat.count({
    where: {
      showtimeId: showtime.id,
      heldBy: user.id,
      status: SeatStatus.HOLD,
    },
  });

  if (alreadyHeld > 0) {
    return;
  }

  const availableSeats = await prisma.showtimeSeat.findMany({
    where: {
      showtimeId: showtime.id,
      status: SeatStatus.AVAILABLE,
    },
    take: 2,
    orderBy: { seatId: "asc" },
  });

  if (availableSeats.length === 0) {
    return;
  }

  const holdUntil = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.showtimeSeat.updateMany({
    where: {
      id: { in: availableSeats.map((seat) => seat.id) },
    },
    data: {
      status: SeatStatus.HOLD,
      heldBy: user.id,
      holdUntil,
    },
  });
}

async function seedOperationalData() {
  console.log("Bat dau seed du lieu test...");

  await normalizeMovieStatuses();

  const movies = await prisma.movie.findMany({
    where: {
      status: {
        in: [MovieStatus.NOW_SHOWING, MovieStatus.COMING_SOON],
      },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: 6,
  });

  if (movies.length === 0) {
    throw new Error(
      "Khong tim thay movie de tao du lieu test. Hay import movie tu TMDB truoc."
    );
  }

  const users = await ensureDemoUsers();
  const rooms = [];

  for (const cinemaData of CINEMAS) {
    const cinema = await findOrCreateCinema(cinemaData);
    console.log(`Cinema: ${cinema.name}`);

    for (const roomData of cinemaData.rooms) {
      const room = await findOrCreateRoom(cinema.id, roomData);
      await ensureSeats(room);
      rooms.push(room);
    }
  }

  const showtimes = await seedShowtimes(rooms, movies);

  const firstShowtime = await prisma.showtime.findFirst({
    orderBy: { startTime: "asc" },
  });
  const secondShowtime = await prisma.showtime.findFirst({
    skip: 1,
    orderBy: { startTime: "asc" },
  });

  if (firstShowtime) {
    await seedSampleBooking(users[0], firstShowtime);
  }

  if (secondShowtime) {
    await seedHoldSeats(users[1], secondShowtime);
  }

  const summary = await Promise.all([
    prisma.cinema.count(),
    prisma.room.count(),
    prisma.seat.count(),
    prisma.showtime.count(),
    prisma.showtimeSeat.count(),
    prisma.user.count(),
    prisma.booking.count(),
  ]);

  console.log("Seed xong.");
  console.log(
    `Cinema: ${summary[0]}, Room: ${summary[1]}, Seat: ${summary[2]}, Showtime: ${summary[3]}, ShowtimeSeat: ${summary[4]}, User: ${summary[5]}, Booking: ${summary[6]}`
  );
  console.log(`Tai khoan test: ${DEMO_USERS[0].email} / ${DEMO_PASSWORD}`);
  console.log(`Tai khoan test: ${DEMO_USERS[1].email} / ${DEMO_PASSWORD}`);
  console.log(`Showtime da tao trong lan nay: ${showtimes.length}`);
}

seedOperationalData()
  .catch(async (error) => {
    console.error("Seed du lieu test that bai:", error.message);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
