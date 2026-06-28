import { useEffect, useState } from 'react';
import { Edit3, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { Alert, Button, Card, DataToolbar, EmptyState, Input, MetricPill, Modal, Select } from '../components/common';
import { cinemaAPI, extractError, movieAPI, roomAPI, showtimeAPI } from '../services/api';
import { formatCurrency, formatDateTime, toDateInputValue, toDateTimeLocalValue } from '../utils/formatters';

const showtimeFormDefaults = {
  movieId: '',
  cinemaId: '',
  roomId: '',
  startTime: '',
  endTime: '',
  price: '',
};

const normalizeShowtimePayload = (formData) => ({
  movieId: Number(formData.movieId),
  roomId: Number(formData.roomId),
  startTime: formData.startTime,
  endTime: formData.endTime,
  price: Number(formData.price),
});

export const ShowtimesPage = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [formData, setFormData] = useState(showtimeFormDefaults);
  const [filters, setFilters] = useState({ movieId: '', cinemaId: '', date: '' });
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchShowtimes();
  }, [filters.movieId, filters.cinemaId, filters.date]);

  const fetchReferenceData = async () => {
    try {
      const [movieData, cinemaData, roomData] = await Promise.all([
        movieAPI.list(),
        cinemaAPI.list(),
        roomAPI.list(),
      ]);

      setMovies(movieData);
      setCinemas(cinemaData);
      setRooms(roomData);
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    }
  };

  const fetchShowtimes = async () => {
    try {
      setLoading(true);
      const data = await showtimeAPI.list({
        ...(filters.movieId ? { movieId: filters.movieId } : {}),
        ...(filters.cinemaId ? { cinemaId: filters.cinemaId } : {}),
        ...(filters.date ? { date: filters.date } : {}),
      });
      setShowtimes(data);

      if (selectedShowtime) {
        const nextSelected = data.find((showtime) => showtime.id === selectedShowtime.id);
        setSelectedShowtime(nextSelected || null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(showtimeFormDefaults);
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const handleEdit = (showtime) => {
    setEditingId(showtime.id);
    setFormData({
      movieId: String(showtime.movieId),
      cinemaId: String(showtime.room.cinema.id),
      roomId: String(showtime.roomId),
      startTime: toDateTimeLocalValue(showtime.startTime),
      endTime: toDateTimeLocalValue(showtime.endTime),
      price: String(showtime.price),
    });
    setFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = normalizeShowtimePayload(formData);

      if (editingId) {
        await showtimeAPI.update(editingId, payload);
        setMessage({ type: 'success', text: 'Showtime updated.' });
      } else {
        await showtimeAPI.create(payload);
        setMessage({ type: 'success', text: 'Showtime created.' });
      }

      await fetchShowtimes();
      closeForm();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (showtimeId) => {
    if (!window.confirm('Delete this showtime?')) return;

    try {
      const result = await showtimeAPI.remove(showtimeId);
      setMessage({ type: 'success', text: result?.message || 'Xóa thành công' });

      if (selectedShowtime?.id === showtimeId) {
        setSelectedShowtime(null);
      }

      if (editingId === showtimeId) {
        closeForm();
      }

      await fetchShowtimes();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    }
  };

  const filteredRoomsForForm = rooms.filter((room) =>
    formData.cinemaId ? String(room.cinemaId) === String(formData.cinemaId) : true
  );

  const movieOptions = [{ value: '', label: 'All movies' }].concat(
    movies.map((movie) => ({
      value: String(movie.id),
      label: movie.title,
    }))
  );

  const cinemaOptions = [{ value: '', label: 'All cinemas' }].concat(
    cinemas.map((cinema) => ({
      value: String(cinema.id),
      label: cinema.name,
    }))
  );

  const editorMovieOptions = [{ value: '', label: 'Select movie' }].concat(
    movies.map((movie) => ({
      value: String(movie.id),
      label: movie.title,
    }))
  );

  const editorCinemaOptions = [{ value: '', label: 'Select cinema' }].concat(
    cinemas.map((cinema) => ({
      value: String(cinema.id),
      label: cinema.name,
    }))
  );

  const editorRoomOptions = [{ value: '', label: 'Select room' }].concat(
    filteredRoomsForForm.map((room) => ({
      value: String(room.id),
      label: `${room.name} (${room._count?.seats || 0}/${room.totalSeats} seats)`,
    }))
  );
  const now = new Date();
  const upcomingCount = showtimes.filter((showtime) => new Date(showtime.startTime) >= now).length;
  const averagePrice = showtimes.length
    ? showtimes.reduce((sum, showtime) => sum + Number(showtime.price || 0), 0) / showtimes.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Scheduling</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Showtimes</h2>
          <p className="mt-2 text-sm text-slate-600">
            Plan screenings by choosing a movie, a room with seats configured, and a start-end time window.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              await fetchReferenceData();
              await fetchShowtimes();
            }}
          >
            <RefreshCcw size={16} />
            Refresh
          </Button>
          <Button onClick={openCreateForm}>
            <Plus size={16} />
            New showtime
          </Button>
        </div>
      </div>

      {message.text ? (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <MetricPill label="Showtimes" value={showtimes.length} tone="sky" />
        <MetricPill label="Upcoming" value={upcomingCount} tone="emerald" />
        <MetricPill label="Avg price" value={formatCurrency(averagePrice)} tone="amber" />
      </div>

      <div className="grid gap-6">
        <Card title="Schedule Board" action={<span className="text-xs font-medium text-slate-500">{showtimes.length} slots</span>}>
          <DataToolbar columns="three" summary={loading ? 'Loading...' : `${showtimes.length} matching slots`}>
            <Select
              label="Movie"
              options={movieOptions}
              value={filters.movieId}
              onChange={(event) => setFilters({ ...filters, movieId: event.target.value })}
            />
            <Select
              label="Cinema"
              options={cinemaOptions}
              value={filters.cinemaId}
              onChange={(event) => setFilters({ ...filters, cinemaId: event.target.value })}
            />
            <Input
              label="Date"
              type="date"
              value={filters.date}
              onChange={(event) => setFilters({ ...filters, date: event.target.value })}
            />
          </DataToolbar>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Movie</th>
                  <th className="px-3 py-3 font-semibold">Cinema</th>
                  <th className="px-3 py-3 font-semibold">Room</th>
                  <th className="px-3 py-3 font-semibold">Start</th>
                  <th className="px-3 py-3 font-semibold">End</th>
                  <th className="px-3 py-3 font-semibold">Price</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map((showtime) => (
                  <tr
                    key={showtime.id}
                    className={`cursor-pointer border-b border-slate-100 align-middle last:border-b-0 ${
                      selectedShowtime?.id === showtime.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedShowtime(showtime)}
                  >
                    <td className="px-3 py-4 font-medium text-slate-900">{showtime.movie.title}</td>
                    <td className="px-3 py-4 text-slate-600">{showtime.room.cinema.name}</td>
                    <td className="px-3 py-4 text-slate-600">{showtime.room.name}</td>
                    <td className="px-3 py-4 text-slate-600">{formatDateTime(showtime.startTime)}</td>
                    <td className="px-3 py-4 text-slate-600">{formatDateTime(showtime.endTime)}</td>
                    <td className="px-3 py-4 text-slate-600">{formatCurrency(showtime.price)}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(showtime);
                          }}
                        >
                          <Edit3 size={14} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(showtime.id);
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!showtimes.length && !loading ? (
            <EmptyState title="No showtimes found" description="Try changing filters or create a new schedule slot." />
          ) : null}
        </Card>

      </div>

      <Modal
        isOpen={formOpen}
        title={editingId ? 'Edit showtime' : 'Create showtime'}
        subtitle={editingId ? 'Update schedule details.' : 'Plan a new screening slot.'}
        onClose={closeForm}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Movie"
            required
            options={editorMovieOptions}
            value={formData.movieId}
            onChange={(event) => setFormData({ ...formData, movieId: event.target.value })}
          />
          <Select
            label="Cinema"
            required
            options={editorCinemaOptions}
            value={formData.cinemaId}
            onChange={(event) =>
              setFormData({
                ...formData,
                cinemaId: event.target.value,
                roomId: '',
              })
            }
          />
          <Select
            label="Room"
            required
            options={editorRoomOptions}
            value={formData.roomId}
            onChange={(event) => setFormData({ ...formData, roomId: event.target.value })}
          />
          <Input
            label="Start time"
            type="datetime-local"
            required
            value={formData.startTime}
            onChange={(event) => setFormData({ ...formData, startTime: event.target.value })}
          />
          <Input
            label="End time"
            type="datetime-local"
            required
            value={formData.endTime}
            onChange={(event) => setFormData({ ...formData, endTime: event.target.value })}
          />
          <Input
            label="Ticket price"
            type="number"
            required
            value={formData.price}
            onChange={(event) => setFormData({ ...formData, price: event.target.value })}
          />
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save changes' : 'Create showtime'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedShowtime)}
        title={selectedShowtime?.movie.title || 'Showtime detail'}
        subtitle={selectedShowtime ? `${selectedShowtime.room.cinema.name} · ${selectedShowtime.room.name}` : ''}
        onClose={() => setSelectedShowtime(null)}
      >
        {selectedShowtime ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900">{toDateInputValue(selectedShowtime.startTime)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-slate-500">Starts</span>
                <span className="font-medium text-slate-900">{formatDateTime(selectedShowtime.startTime)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-slate-500">Ends</span>
                <span className="font-medium text-slate-900">{formatDateTime(selectedShowtime.endTime)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-slate-500">Price</span>
                <span className="font-medium text-slate-900">{formatCurrency(selectedShowtime.price)}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Room readiness</p>
              <p className="mt-2 text-sm text-slate-600">
                {selectedShowtime.room._count?.seats || selectedShowtime.room.totalSeats
                  ? 'Room is attached to the cinema and can be scheduled.'
                  : 'Room has no seats configured yet.'}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
