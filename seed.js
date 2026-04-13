const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const cinemaCount = await prisma.cinema.count();
  if (cinemaCount === 0) {
    await prisma.cinema.create({
      data: {
        name: "Demo Cinema",
        location: "Hanoi"
      }
    });
    console.log("Created Demo Cinema");
  } else {
    console.log("Cinema data already exists");
  }

  const movieCount = await prisma.movie.count();
  if (movieCount === 0) {
    await prisma.movie.create({
      data: {
        title: "Demo Movie",
        description: "Sample backend demo movie",
        duration: 120,
        status: "COMING_SOON"
      }
    });
    console.log("Created Demo Movie");
  } else {
    console.log("Movie data already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
