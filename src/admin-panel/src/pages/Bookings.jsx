import { useEffect, useState } from 'react';
import { Ban, RefreshCcw, Ticket } from 'lucide-react';
import { Alert, Button, Card, Input, Select } from '../components/common';
import { bookingAPI, extractError } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING', label: 'Pending' },
];

const badgeClass = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-700';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  useEffect(() => {
    fetchBookings();
  }, [debouncedSearch, filters.status]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingAPI.list({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      });

      setBookings(data);

      if (selectedBooking) {
        const nextSelected = data.find((booking) => booking.id === selectedBooking.id);
        setSelectedBooking(nextSelected || null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;

    try {
      await bookingAPI.cancel(bookingId);
      setMessage({ type: 'success', text: 'Booking cancelled.' });
      await fetchBookings();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Transactions</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Bookings</h2>
          <p className="mt-2 text-sm text-slate-600">
            Review booking flow, inspect seats per order, and cancel reservations when required.
          </p>
        </div>
        <Button variant="outline" onClick={fetchBookings}>
          <RefreshCcw size={16} />
          Refresh
        </Button>
      </div>

      {message.text ? (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.9fr)]">
        <Card title="Booking list">
          <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              label="Search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Customer name, email, or movie"
            />
            <Select
              label="Status"
              options={statusOptions}
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Movie</th>
                  <th className="pb-3 pr-4 font-medium">Venue</th>
                  <th className="pb-3 pr-4 font-medium">Showtime</th>
                  <th className="pb-3 pr-4 font-medium">Seats</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={`cursor-pointer border-b border-slate-100 align-top last:border-b-0 ${
                      selectedBooking?.id === booking.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="py-4 pr-4">
                      <p className="font-medium text-slate-900">{booking.user?.name || `User #${booking.user?.id || '--'}`}</p>
                      <p className="mt-1 text-xs text-slate-500">{booking.user?.email || '--'}</p>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{booking.movie.title}</td>
                    <td className="py-4 pr-4 text-slate-600">
                      {booking.cinema.name} · {booking.room.name}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{formatDateTime(booking.showtime.startTime)}</td>
                    <td className="py-4 pr-4 text-slate-600">{booking.seats.join(', ')}</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{formatCurrency(booking.totalPrice)}</td>
                    <td className="py-4">
                      {booking.status !== 'CANCELLED' ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCancel(booking.id);
                          }}
                        >
                          <Ban size={14} />
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Already cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!bookings.length && !loading ? <p className="mt-6 text-sm text-slate-500">No bookings found.</p> : null}
        </Card>

        <Card title="Selected booking">
          {selectedBooking ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Ticket size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Booking #{selectedBooking.id}</h3>
                  <p className="mt-1 text-slate-500">{selectedBooking.user?.name || 'Unknown user'}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Movie</span>
                  <span className="text-right font-medium text-slate-900">{selectedBooking.movie.title}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-slate-500">Venue</span>
                  <span className="text-right font-medium text-slate-900">
                    {selectedBooking.cinema.name} · {selectedBooking.room.name}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-slate-500">Starts</span>
                  <span className="text-right font-medium text-slate-900">{formatDateTime(selectedBooking.showtime.startTime)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-slate-500">Total</span>
                  <span className="text-right font-medium text-slate-900">{formatCurrency(selectedBooking.totalPrice)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-slate-500">Status</span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Seats</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.seats.map((seat) => (
                    <span
                      key={seat}
                      className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a booking to inspect it.</p>
          )}
        </Card>
      </div>
    </div>
  );
};
