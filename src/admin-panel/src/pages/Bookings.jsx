import { useEffect, useState } from 'react';
import { Ban, CreditCard, RefreshCcw, Ticket } from 'lucide-react';
import { Alert, Button, Card, DataToolbar, EmptyState, MetricPill, Modal, Select, StatusBadge, Input } from '../components/common';
import { bookingAPI, extractError } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING', label: 'Pending' },
];

const statusTone = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return 'emerald';
    case 'CANCELLED':
      return 'rose';
    case 'PENDING':
      return 'amber';
    default:
      return 'slate';
  }
};

export const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const confirmedCount = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const pendingCount = bookings.filter((booking) => booking.status === 'PENDING').length;
  const cancelledCount = bookings.filter((booking) => booking.status === 'CANCELLED').length;
  const confirmedRevenue = bookings
    .filter((booking) => booking.status === 'CONFIRMED')
    .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

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

      <div className="grid gap-3 md:grid-cols-4">
        <MetricPill label="Confirmed" value={confirmedCount} tone="emerald" />
        <MetricPill label="Pending" value={pendingCount} tone="amber" />
        <MetricPill label="Cancelled" value={cancelledCount} tone="rose" />
        <MetricPill label="Revenue" value={formatCurrency(confirmedRevenue)} tone="sky" />
      </div>

      <div className="grid gap-6">
        <Card title="Booking Queue" action={<span className="text-xs font-medium text-slate-500">{bookings.length} records</span>}>
          <DataToolbar summary={loading ? 'Loading...' : `${bookings.length} matching bookings`}>
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
          </DataToolbar>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="border-b border-slate-200 bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Screening</th>
                  <th className="px-3 py-3 font-semibold">Seats</th>
                  <th className="px-3 py-3 font-semibold">Payment</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={`cursor-pointer border-b border-slate-100 align-middle last:border-b-0 ${
                      selectedBooking?.id === booking.id ? 'bg-amber-50/70' : 'hover:bg-slate-50/80'
                    }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="px-3 py-4">
                      <p className="font-medium text-slate-900">{booking.user?.name || `User #${booking.user?.id || '--'}`}</p>
                      <p className="mt-1 text-xs text-slate-500">{booking.user?.email || '--'}</p>
                      <p className="mt-1 text-[11px] font-medium text-slate-400">#{booking.id}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-medium text-slate-900">{booking.movie.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{booking.cinema.name} · {booking.room.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(booking.showtime.startTime)}</p>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex max-w-[170px] flex-wrap gap-1.5">
                        {booking.seats.map((seat) => (
                          <span key={seat} className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                            {seat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-sm font-medium text-slate-700">{booking.payment?.status || 'No payment'}</p>
                      <p className="mt-1 text-xs text-slate-500">{booking.payment?.provider || '--'}</p>
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge tone={statusTone(booking.status)}>{booking.status}</StatusBadge>
                    </td>
                    <td className="px-3 py-4 text-right font-semibold text-slate-900">{formatCurrency(booking.totalPrice)}</td>
                    <td className="px-3 py-4 text-right">
                      {booking.status !== 'CANCELLED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCancel(booking.id);
                          }}
                        >
                          <Ban size={14} />
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!bookings.length && !loading ? (
            <EmptyState title="No bookings found" description="Try a different search term or status filter." />
          ) : null}
        </Card>
      </div>

      <Modal
        isOpen={Boolean(selectedBooking)}
        title={selectedBooking ? `Booking #${selectedBooking.id}` : 'Booking detail'}
        subtitle={selectedBooking?.user?.name || 'Unknown user'}
        onClose={() => setSelectedBooking(null)}
      >
        {selectedBooking ? (
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Ticket size={16} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Booking #{selectedBooking.id}</h3>
                <p className="mt-1 text-slate-500">{selectedBooking.user?.email || '--'}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CreditCard size={14} />
                  Payment
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{selectedBooking.payment?.status || 'No payment'}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedBooking.payment?.orderId || 'No order id'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking status</p>
                <div className="mt-3">
                  <StatusBadge tone={statusTone(selectedBooking.status)}>{selectedBooking.status}</StatusBadge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{formatCurrency(selectedBooking.totalPrice)}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
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
        ) : null}
      </Modal>
    </div>
  );
};
