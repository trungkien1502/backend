import { useEffect, useState } from 'react';
import {
  Building2,
  CalendarRange,
  CircleDollarSign,
  DoorOpen,
  Film,
  Ticket,
} from 'lucide-react';
import { Alert, Button, Card } from '../components/common';
import { bookingAPI, cinemaAPI, extractError, movieAPI, roomAPI, showtimeAPI } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const StatCard = ({ title, value, subtitle, icon: Icon, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-900 text-white',
    amber: 'bg-amber-400 text-slate-950',
    emerald: 'bg-emerald-500 text-white',
    blue: 'bg-blue-600 text-white',
    rose: 'bg-rose-500 text-white',
    violet: 'bg-violet-500 text-white',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
          {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const statusLabel = (status) => {
  switch (status) {
    case 'NOW_SHOWING':
      return 'Now showing';
    case 'COMING_SOON':
      return 'Coming soon';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    movies: [],
    cinemas: [],
    rooms: [],
    showtimes: [],
    bookings: [],
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        movieAPI.list(),
        cinemaAPI.list(),
        roomAPI.list(),
        showtimeAPI.list(),
        bookingAPI.list(),
      ]);

      const keys = ['movies', 'cinemas', 'rooms', 'showtimes', 'bookings'];
      const labels = ['Movies', 'Cinemas', 'Rooms', 'Showtimes', 'Bookings'];
      const nextData = {};
      const failedRequests = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          nextData[keys[index]] = Array.isArray(result.value) ? result.value : [];
          return;
        }

        nextData[keys[index]] = [];
        failedRequests.push(`${labels[index]}: ${extractError(result.reason)}`);
      });

      setData(nextData);
      setError(failedRequests.join(' | '));
    } catch (nextError) {
      setError(extractError(nextError));
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const upcomingShowtimes = data.showtimes
    .filter((showtime) => new Date(showtime.startTime) >= now)
    .slice(0, 6);
  const recentBookings = data.bookings.slice(0, 6);
  const roomsWithoutSeats = data.rooms.filter((room) => (room._count?.seats || 0) === 0);
  const confirmedRevenue = data.bookings
    .filter((booking) => booking.status === 'CONFIRMED')
    .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
  const nowShowingCount = data.movies.filter((movie) => movie.status === 'NOW_SHOWING').length;
  const comingSoonCount = data.movies.filter((movie) => movie.status === 'COMING_SOON').length;
  const confirmedBookings = data.bookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const cancelledBookings = data.bookings.filter((booking) => booking.status === 'CANCELLED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Overview</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Operations dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Snapshot of current inventory, schedule readiness, and booking flow for the cinema system.
          </p>
        </div>
        <Button onClick={fetchDashboard} loading={loading}>
          Refresh data
        </Button>
      </div>

      {error ? <Alert type="error" message={error} onClose={() => setError('')} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Movies"
          value={data.movies.length}
          subtitle={`${nowShowingCount} now showing`}
          icon={Film}
          tone="amber"
        />
        <StatCard
          title="Cinemas"
          value={data.cinemas.length}
          subtitle="Registered venues"
          icon={Building2}
          tone="slate"
        />
        <StatCard
          title="Rooms"
          value={data.rooms.length}
          subtitle={`${roomsWithoutSeats.length} need seats`}
          icon={DoorOpen}
          tone="blue"
        />
        <StatCard
          title="Showtimes"
          value={data.showtimes.length}
          subtitle={`${upcomingShowtimes.length} upcoming`}
          icon={CalendarRange}
          tone="violet"
        />
        <StatCard
          title="Bookings"
          value={data.bookings.length}
          subtitle={`${cancelledBookings} cancelled`}
          icon={Ticket}
          tone="emerald"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(confirmedRevenue)}
          subtitle={`${confirmedBookings} confirmed bookings`}
          icon={CircleDollarSign}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <Card
          title="Upcoming showtimes"
          action={<span className="text-sm text-slate-500">{upcomingShowtimes.length} scheduled</span>}
        >
          {upcomingShowtimes.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-slate-200 text-left text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Movie</th>
                    <th className="pb-3 pr-4 font-medium">Cinema</th>
                    <th className="pb-3 pr-4 font-medium">Room</th>
                    <th className="pb-3 pr-4 font-medium">Start</th>
                    <th className="pb-3 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingShowtimes.map((showtime) => (
                    <tr key={showtime.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">{showtime.movie.title}</td>
                      <td className="py-3 pr-4 text-slate-600">{showtime.room.cinema.name}</td>
                      <td className="py-3 pr-4 text-slate-600">{showtime.room.name}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatDateTime(showtime.startTime)}</td>
                      <td className="py-3 text-slate-600">{formatCurrency(showtime.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No upcoming showtimes.</p>
          )}
        </Card>

        <Card title="Readiness">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Movie mix</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Now showing</span>
                <span className="font-medium text-slate-900">{nowShowingCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Coming soon</span>
                <span className="font-medium text-slate-900">{comingSoonCount}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Rooms without configured seats</p>
              {roomsWithoutSeats.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {roomsWithoutSeats.slice(0, 5).map((room) => (
                    <li key={room.id} className="flex items-center justify-between gap-4">
                      <span>{room.name}</span>
                      <span className="text-slate-500">{room.cinema?.name || 'Unknown cinema'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">All rooms have seats configured.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Recent bookings"
        action={<span className="text-sm text-slate-500">{data.bookings.length} total bookings</span>}
      >
        {recentBookings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Movie</th>
                  <th className="pb-3 pr-4 font-medium">Showtime</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{booking.user?.name || `User #${booking.user?.id || '--'}`}</p>
                      <p className="text-xs text-slate-500">{booking.user?.email || '--'}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{booking.movie.title}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatDateTime(booking.showtime.startTime)}</td>
                    <td className="py-3 pr-4 text-slate-600">{statusLabel(booking.status)}</td>
                    <td className="py-3 text-slate-600">{formatCurrency(booking.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No bookings available.</p>
        )}
      </Card>
    </div>
  );
};
