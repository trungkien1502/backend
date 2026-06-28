import { useEffect, useState } from 'react';
import { Building2, Edit3, MapPin, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { Alert, Button, Card, DataToolbar, EmptyState, Input, MetricPill, Modal } from '../components/common';
import { cinemaAPI, extractError } from '../services/api';
import { formatDateTime, truncate } from '../utils/formatters';

const cinemaFormDefaults = {
  name: '',
  location: '',
  poster: '',
  latitude: '',
  longitude: '',
};

const normalizeCinemaPayload = (formData) => ({
  name: formData.name.trim(),
  location: formData.location.trim() || null,
  poster: formData.poster.trim() || null,
  latitude: formData.latitude === '' ? null : Number(formData.latitude),
  longitude: formData.longitude === '' ? null : Number(formData.longitude),
});

export const CinemasPage = () => {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [formData, setFormData] = useState(cinemaFormDefaults);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const data = await cinemaAPI.list();
      setCinemas(data);

      if (selectedCinema) {
        const nextSelected = data.find((cinema) => cinema.id === selectedCinema.id);
        setSelectedCinema(nextSelected || null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(cinemaFormDefaults);
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const handleEdit = (cinema) => {
    setEditingId(cinema.id);
    setFormData({
      name: cinema.name || '',
      location: cinema.location || '',
      poster: cinema.poster || '',
      latitude: cinema.latitude ?? '',
      longitude: cinema.longitude ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = normalizeCinemaPayload(formData);

      if (editingId) {
        await cinemaAPI.update(editingId, payload);
        setMessage({ type: 'success', text: 'Cinema updated.' });
      } else {
        await cinemaAPI.create(payload);
        setMessage({ type: 'success', text: 'Cinema created.' });
      }

      await fetchCinemas();
      closeForm();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cinemaId) => {
    if (!window.confirm('Delete this cinema?')) return;

    try {
      const result = await cinemaAPI.remove(cinemaId);
      setMessage({ type: 'success', text: result?.message || 'Xóa thành công' });

      if (selectedCinema?.id === cinemaId) {
        setSelectedCinema(null);
      }

      if (editingId === cinemaId) {
        closeForm();
      }

      await fetchCinemas();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    }
  };

  const visibleCinemas = cinemas.filter((cinema) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return true;

    return [cinema.name, cinema.location].some((value) => value?.toLowerCase().includes(keyword));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Venues</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Cinemas</h2>
          <p className="mt-2 text-sm text-slate-600">Register venues and keep address, poster, and coordinates in sync.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={fetchCinemas}>
            <RefreshCcw size={16} />
            Refresh
          </Button>
          <Button onClick={openCreateForm}>
            <Plus size={16} />
            New cinema
          </Button>
        </div>
      </div>

      {message.text ? (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <MetricPill label="Venues" value={cinemas.length} tone="sky" />
        <MetricPill label="Visible" value={visibleCinemas.length} tone="emerald" />
        <MetricPill label="Mapped" value={cinemas.filter((cinema) => cinema.latitude || cinema.longitude).length} tone="amber" />
      </div>

      <div className="grid gap-6">
        <Card title="Cinema Directory" action={<span className="text-xs font-medium text-slate-500">{visibleCinemas.length} visible</span>}>
          <DataToolbar columns="one" summary={loading ? 'Loading...' : `${visibleCinemas.length} matching venues`}>
            <Input
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by cinema name or location"
            />
          </DataToolbar>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Cinema</th>
                  <th className="px-3 py-3 font-semibold">Location</th>
                  <th className="px-3 py-3 font-semibold">Coordinates</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCinemas.map((cinema) => (
                  <tr
                    key={cinema.id}
                    className={`cursor-pointer border-b border-slate-100 align-middle last:border-b-0 ${
                      selectedCinema?.id === cinema.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedCinema(cinema)}
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{cinema.name}</p>
                          <p className="mt-1 text-xs text-slate-500">Created {formatDateTime(cinema.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{truncate(cinema.location, 80) || '--'}</td>
                    <td className="px-3 py-4 text-slate-600">
                      {cinema.latitude || cinema.longitude ? `${cinema.latitude || '--'}, ${cinema.longitude || '--'}` : '--'}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(cinema);
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
                            handleDelete(cinema.id);
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

          {!visibleCinemas.length && !loading ? (
            <EmptyState title="No cinemas found" description="Try changing the search term or create a new venue." />
          ) : null}
        </Card>

      </div>

      <Modal
        isOpen={formOpen}
        title={editingId ? 'Edit cinema' : 'Create cinema'}
        subtitle={editingId ? 'Update venue metadata.' : 'Register a new cinema venue.'}
        onClose={closeForm}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            required
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            placeholder="Cinema name"
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(event) => setFormData({ ...formData, location: event.target.value })}
            placeholder="Address or area"
          />
          <Input
            label="Poster URL"
            value={formData.poster}
            onChange={(event) => setFormData({ ...formData, poster: event.target.value })}
            placeholder="https://..."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Latitude"
              type="number"
              step="0.0000001"
              value={formData.latitude}
              onChange={(event) => setFormData({ ...formData, latitude: event.target.value })}
            />
            <Input
              label="Longitude"
              type="number"
              step="0.0000001"
              value={formData.longitude}
              onChange={(event) => setFormData({ ...formData, longitude: event.target.value })}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save changes' : 'Create cinema'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedCinema)}
        title={selectedCinema?.name || 'Cinema detail'}
        subtitle="Venue metadata"
        onClose={() => setSelectedCinema(null)}
      >
        {selectedCinema ? (
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-950">{selectedCinema.name}</h3>
              </div>
              <p className="mt-2 leading-6 text-slate-600">{selectedCinema.location || 'No location set.'}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Latitude</span>
                <span className="font-medium text-slate-900">{selectedCinema.latitude || '--'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-slate-500">Longitude</span>
                <span className="font-medium text-slate-900">{selectedCinema.longitude || '--'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-slate-500">Created</span>
                <span className="font-medium text-slate-900">{formatDateTime(selectedCinema.createdAt)}</span>
              </div>
            </div>

            {selectedCinema.poster ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={selectedCinema.poster} alt={selectedCinema.name} className="h-56 w-full object-cover" />
              </div>
            ) : (
              <p className="text-sm text-slate-500">No poster set.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
