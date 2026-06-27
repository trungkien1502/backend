require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_USER_ID = Number(process.env.MANUAL_BOOKING_USER_ID || 6);
const DEFAULT_SHOWTIME_ID = Number(process.env.MANUAL_BOOKING_SHOWTIME_ID || 56);
const DEFAULT_SEAT_IDS = process.env.MANUAL_BOOKING_SEAT_IDS || "1-48";
const HOLD_MINUTES = Number(process.env.MANUAL_BOOKING_HOLD_MINUTES || 5);

const parseArgs = () => {
  const args = {};

  for (const entry of process.argv.slice(2)) {
    if (!entry.startsWith("--")) continue;

    const eqIndex = entry.indexOf("=");
    if (eqIndex === -1) {
      args[entry.slice(2)] = true;
      continue;
    }

    const key = entry.slice(2, eqIndex);
    const value = entry.slice(eqIndex + 1);
    args[key] = value;
  }

  return args;
};

const parseSeatIds = (value) => {
  if (!value) return [];

  const trimmed = String(value).trim();
  if (!trimmed) return [];

  if (trimmed.includes(",")) {
    return [...new Set(
      trimmed
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0)
    )].sort((a, b) => a - b);
  }

  if (trimmed.includes("-")) {
    const [startRaw, endRaw] = trimmed.split("-");
    const start = Number(startRaw);
    const end = Number(endRaw);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end <= 0 || end < start) {
      throw new Error(`Invalid seat range: ${value}`);
    }

    const seatIds = [];
    for (let seatId = start; seatId <= end; seatId += 1) {
      seatIds.push(seatId);
    }
    return seatIds;
  }

  const single = Number(trimmed);
  if (!Number.isInteger(single) || single <= 0) {
    throw new Error(`Invalid seatIds value: ${value}`);
  }

  return [single];
};

const toPositiveInt = (value, fallback, label) => {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label}`);
  }

  return parsed;
};

async function main() {
  const args = parseArgs();
  const userId = toPositiveInt(args.userId, DEFAULT_USER_ID, "userId");
  const showtimeId = toPositiveInt(args.showtimeId, DEFAULT_SHOWTIME_ID, "showtimeId");
  const seatIds = parseSeatIds(args.seatIds || args.seats || DEFAULT_SEAT_IDS);

  if (!seatIds.length) {
    throw new Error("seatIds are required");
  }

  const now = new Date();
  const holdUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const showtime = await tx.showtime.findUnique({
      where: { id: showtimeId },
      select: {
        id: true,
        price: true,
        startTime: true,
        endTime: true,
        movie: {
          select: {
            id: true,
            title: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            cinema: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!showtime) {
      throw new Error(`Showtime ${showtimeId} not found`);
    }

    const showtimeSeats = await tx.showtimeSeat.findMany({
      where: {
        showtimeId,
        seatId: { in: seatIds }
      },
      select: {
        id: true,
        seatId: true,
        status: true,
        holdUntil: true,
        heldBy: true,
        seat: {
          select: {
            seatNumber: true
          }
        }
      }
    });

    if (showtimeSeats.length !== seatIds.length) {
      const foundIds = new Set(showtimeSeats.map((seat) => seat.seatId));
      const missing = seatIds.filter((seatId) => !foundIds.has(seatId));
      throw new Error(`Missing showtime seats for ids: ${missing.join(", ")}`);
    }

    const blockedSeats = showtimeSeats.filter((seat) => seat.status === "BOOKED");
    if (blockedSeats.length) {
      throw new Error(
        `Some seats are already BOOKED: ${blockedSeats.map((seat) => seat.seatId).join(", ")}`
      );
    }

    const holdResult = await tx.showtimeSeat.updateMany({
      where: {
        showtimeId,
        seatId: { in: seatIds },
        OR: [
          { status: "AVAILABLE" },
          { status: "HOLD", heldBy: userId },
          { status: "HOLD", holdUntil: { lt: now } }
        ]
      },
      data: {
        status: "HOLD",
        holdUntil,
        heldBy: userId
      }
    });

    if (holdResult.count !== seatIds.length) {
      throw new Error("Some seats cannot be held");
    }

    const totalPrice = Number(showtime.price) * seatIds.length;

    const booking = await tx.booking.create({
      data: {
        userId,
        showtimeId,
        totalPrice,
        status: "CONFIRMED"
      }
    });

    await tx.bookingSeat.createMany({
      data: showtimeSeats.map((seat) => ({
        bookingId: booking.id,
        showtimeSeatId: seat.id
      }))
    });

    const bookedResult = await tx.showtimeSeat.updateMany({
      where: {
        id: { in: showtimeSeats.map((seat) => seat.id) },
        OR: [
          { status: "HOLD", heldBy: userId },
          { status: "HOLD", holdUntil: { gte: now } }
        ]
      },
      data: {
        status: "BOOKED",
        holdUntil: null,
        heldBy: null
      }
    });

    if (bookedResult.count !== seatIds.length) {
      throw new Error("Failed to confirm all seats");
    }

    const orderId = `MANUAL_BOOKING_${booking.id}`;
    const requestId = `${orderId}_${Date.now()}`;

    const payment = await tx.payment.create({
      data: {
        bookingId: booking.id,
        provider: "MANUAL",
        amount: totalPrice,
        currency: "VND",
        status: "PAID",
        orderId,
        requestId,
        transId: `MANUAL_${booking.id}`,
        rawResponse: {
          source: "manualPaidBookingScript",
          createdAt: now.toISOString()
        }
      }
    });

    return {
      user,
      showtime,
      booking,
      payment,
      seatIds,
      holdUntil,
      totalPrice
    };
  });

  const output = {
    ok: true,
    user: result.user,
    showtime: {
      id: result.showtime.id,
      movie: result.showtime.movie,
      room: result.showtime.room,
      startTime: result.showtime.startTime,
      endTime: result.showtime.endTime
    },
    booking: {
      id: result.booking.id,
      status: result.booking.status,
      totalPrice: Number(result.booking.totalPrice)
    },
    payment: {
      id: result.payment.id,
      status: result.payment.status,
      orderId: result.payment.orderId,
      requestId: result.payment.requestId,
      amount: Number(result.payment.amount)
    },
    seats: result.seatIds,
    holdUntil: result.holdUntil
  };

  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
