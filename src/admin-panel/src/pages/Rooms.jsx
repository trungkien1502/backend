import { useEffect, useState } from 'react';
import { DoorOpen, Edit3, Plus, RefreshCcw, Rows3, Trash2 } from 'lucide-react';
import { Alert, Button, Card, Input, Select } from '../components/common';
import { cinemaAPI, extractError, roomAPI, seatAPI } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDateTime } from '../utils/formatters';

const roomFormDefaults = {
  name: '',
  cinemaId: '',
  totalSeats: '',
};

const seatFormDefaults = {
  rows: 'A,B,C,D,E',
  columns: '10',
};

const normalizeRoomPayload = (formData) => ({
  name: formData.name.trim(),
  cinemaId: Number(formData.cinemaId),
  totalSeats: Number(formData.totalSeats),
});

export const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [seats, setSeats] = useState([]);
  const [roomForm, setRoomForm] = useState(roomFormDefaults);
  const [seatForm, setSeatForm] = useState(seatFormDefaults);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ search: '', cinemaId: '' });
  const [loading, setLoading] = useState(true);
  const [seatLoading, setSeatLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seatSaving, setSeatSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [debouncedSearch, filters.cinemaId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [roomData, cinemaData] = await Promise.all([roomAPI.list(), cinemaAPI.list()]);
      setRooms(roomData);
      setCinemas(cinemaData);
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomAPI.list({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(filters.cinemaId ? { cinemaId: filters.cinemaId } : {}),
      });
      setRooms(data);

      if (selectedRoom) {
        const nextSelected = data.find((room) => room.id === selectedRoom.id);
        setSelectedRoom(nextSelected || null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async (roomId) => {
    try {
      setSeatLoading(true);
      const data = await seatAPI.listByRoom(roomId);
      setSeats(data);
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setSeatLoading(false);
    }
  };

  const selectRoom = async (room) => {
    setSelectedRoom(room);
    await fetchSeats(room.id);
  };

  const resetRoomForm = () => {
    setEditingId(null);
    setRoomForm(roomFormDefaults);
  };

  const handleEdit = (room) => {
    setEditingId(room.id);
    setRoomForm({
      name: room.name || '',
      cinemaId: String(room.cinemaId || ''),
      totalSeats: room.totalSeats ?? '',
    });
  };

  const handleRoomSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = normalizeRoomPayload(roomForm);

      if (editingId) {
        await roomAPI.update(editingId, payload);
        setMessage({ type: 'success', text: 'Room updated.' });
      } else {
        await roomAPI.create(payload);
        setMessage({ type: 'success', text: 'Room created.' });
      }

      await fetchRooms();
      resetRoomForm();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Delete this room?')) return;

    try {
      await roomAPI.remove(roomId);
      setMessage({ type: 'success', text: 'Room deleted.' });

      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setSeats([]);
      }

      if (editingId === roomId) {
        resetRoomForm();
      }

      await fetchRooms();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    }
  };

  const handleGenerateSeats = async (event) => {
    event.preventDefault();

    if (!selectedRoom) {
      setMessage({ type: 'warning', text: 'Select a room before generating seats.' });
      return;
    }

    try {
      setSeatSaving(true);

      const rows = seatForm.rows
        .split(',')
        .map((row) => row.trim().toUpperCase())
        .filter(Boolean);

      await seatAPI.generate({
        roomId: selectedRoom.id,
        rows,
        columns: Number(seatForm.columns),
      });

      setMessage({ type: 'success', text: 'Seats generated.' });
      await fetchSeats(selectedRoom.id);
      await fetchRooms();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setSeatSaving(false);
    }
  };

  const handleClearSeats = async () => {
    if (!selectedRoom) {
      setMessage({ type: 'warning', text: 'Select a room before clearing seats.' });
      return;
    }

    if (!window.confirm('Delete all seats in this room?')) return;

    try {
      await seatAPI.clearRoom(selectedRoom.id);
      setMessage({ type: 'success', text: 'Seats removed.' });
      await fetchSeats(selectedRoom.id);
      await fetchRooms();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    }
  };

  const cinemaOptions = [
    { value: '', label: 'All cinemas' },
    ...cinemas.map((cinema) => ({
      value: String(cinema.id),
      label: cinema.name,
    })),
  ];

  const editorCinemaOptions = [{ value: '', label: 'Select cinema' }].concat(
    cinemas.map((cinema) => ({
      value: String(cinema.id),
      label: cinema.name,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Venue setup</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Rooms and seats</h2>
          <p className="mt-2 text-sm text-slate-600">
            Create rooms, assign them to cinemas, then generate seat maps before scheduling showtimes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={fetchInitialData}>
            <RefreshCcw size={16} />
            Refresh
          </Button>
          <Button onClick={resetRoomForm}>
            <Plus size={16} />
            New room
          </Button>
        </div>
      </div>

      {message.text ? (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <Card title="Room list">
          <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              label="Search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Search by room name"
            />
            <Select
              label="Cinema"
              options={cinemaOptions}
              value={filters.cinemaId}
              onChange={(event) => setFilters({ ...filters, cinemaId: event.target.value })}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Room</th>
                  <th className="pb-3 pr-4 font-medium">Cinema</th>
                  <th className="pb-3 pr-4 font-medium">Seat target</th>
                  <th className="pb-3 pr-4 font-medium">Configured</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className={`cursor-pointer border-b border-slate-100 align-top last:border-b-0 ${
                      selectedRoom?.id === room.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => selectRoom(room)}
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <DoorOpen size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{room.name}</p>
                          <p className="mt-1 text-xs text-slate-500">Updated through room service</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{room.cinema?.name || `Cinema #${room.cinemaId}`}</td>
                    <td className="py-4 pr-4 text-slate-600">{room.totalSeats}</td>
                    <td className="py-4 pr-4 text-slate-600">{room._count?.seats || 0}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(room);
                          }}
                        >
                          <Edit3 size={14} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteRoom(room.id);
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

          {!rooms.length && !loading ? <p className="mt-6 text-sm text-slate-500">No rooms found.</p> : null}
        </Card>

        <div className="space-y-6">
          <Card title={editingId ? 'Edit room' : 'Create room'}>
            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <Input
                label="Room name"
                required
                value={roomForm.name}
                onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })}
                placeholder="Screen 1"
              />
              <Select
                label="Cinema"
                required
                options={editorCinemaOptions}
                value={roomForm.cinemaId}
                onChange={(event) => setRoomForm({ ...roomForm, cinemaId: event.target.value })}
              />
              <Input
                label="Target seat count"
                type="number"
                required
                value={roomForm.totalSeats}
                onChange={(event) => setRoomForm({ ...roomForm, totalSeats: event.target.value })}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" loading={saving}>
                  {editingId ? 'Save changes' : 'Create room'}
                </Button>
                <Button type="button" variant="outline" onClick={resetRoomForm}>
                  Clear
                </Button>
              </div>
            </form>
          </Card>

          <Card
            title="Seat management"
            action={
              selectedRoom ? (
                <span className="text-sm text-slate-500">
                  {(selectedRoom._count?.seats || seats.length)} / {selectedRoom.totalSeats} configured
                </span>
              ) : null
            }
          >
            {selectedRoom ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">{selectedRoom.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedRoom.cinema?.name || `Cinema #${selectedRoom.cinemaId}`}</p>
                  <p className="mt-2 text-xs text-slate-500">Last fetched {formatDateTime(new Date())}</p>
                </div>

                <form onSubmit={handleGenerateSeats} className="space-y-4">
                  <Input
                    label="Rows"
                    value={seatForm.rows}
                    onChange={(event) => setSeatForm({ ...seatForm, rows: event.target.value })}
                    placeholder="A,B,C,D,E"
                  />
                  <Input
                    label="Columns per row"
                    type="number"
                    value={seatForm.columns}
                    onChange={(event) => setSeatForm({ ...seatForm, columns: event.target.value })}
                    placeholder="10"
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" loading={seatSaving}>
                      <Rows3 size={16} />
                      Generate seats
                    </Button>
                    <Button type="button" variant="outline" onClick={() => fetchSeats(selectedRoom.id)}>
                      Refresh seats
                    </Button>
                    <Button type="button" variant="danger" onClick={handleClearSeats}>
                      <Trash2 size={16} />
                      Clear room seats
                    </Button>
                  </div>
                </form>

                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                    Configured seats
                  </div>
                  <div className="px-4 py-4">
                    {seatLoading ? (
                      <p className="text-sm text-slate-500">Loading seats...</p>
                    ) : seats.length ? (
                      <div className="flex flex-wrap gap-2">
                        {seats.map((seat) => (
                          <span
                            key={seat.id}
                            className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            {seat.seatNumber}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No seats configured yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a room to generate or inspect seats.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
