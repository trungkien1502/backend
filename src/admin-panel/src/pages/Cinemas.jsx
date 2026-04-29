import { useEffect, useState } from 'react';
import { Building2, Edit3, MapPin, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { Alert, Button, Card, Input } from '../components/common';
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

  const handleEdit = (cinema) => {
    setEditingId(cinema.id);
    setFormData({
      name: cinema.name || '',
      location: cinema.location || '',
      poster: cinema.poster || '',
      latitude: cinema.latitude ?? '',
      longitude: cinema.longitude ?? '',
    });
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
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cinemaId) => {
    if (!window.confirm('Delete this cinema?')) return;

    try {
      await cinemaAPI.remove(cinemaId);
      setMessage({ type: 'success', text: 'Cinema deleted.' });

      if (selectedCinema?.id === cinemaId) {
        setSelectedCinema(null);
      }

      if (editingId === cinemaId) {
        resetForm();
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
          <Button onClick={resetForm}>
            <Plus size={16} />
            New cinema
          </Button>
        </div>
      </div>

      {message.text ? (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)]">
        <Card title="Cinema list">
          <div className="mb-6">
            <Input
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by cinema name or location"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Cinema</th>
                  <th className="pb-3 pr-4 font-medium">Location</th>
                  <th className="pb-3 pr-4 font-medium">Coordinates</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCinemas.map((cinema) => (
                  <tr
                    key={cinema.id}
                    className={`cursor-pointer border-b border-slate-100 align-top last:border-b-0 ${
                      selectedCinema?.id === cinema.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedCinema(cinema)}
                  >
                    <td className="py-4 pr-4">
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
                    <td className="py-4 pr-4 text-slate-600">{truncate(cinema.location, 80) || '--'}</td>
                    <td className="py-4 pr-4 text-slate-600">
                      {cinema.latitude || cinema.longitude ? `${cinema.latitude || '--'}, ${cinema.longitude || '--'}` : '--'}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
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
                          variant="danger"
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

          {!visibleCinemas.length && !loading ? <p className="mt-6 text-sm text-slate-500">No cinemas found.</p> : null}
        </Card>

        <div className="space-y-6">
          <Card title={editingId ? 'Edit cinema' : 'Create cinema'}>
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

              <div className="flex flex-wrap gap-3">
                <Button type="submit" loading={saving}>
                  {editingId ? 'Save changes' : 'Create cinema'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Clear
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Selected cinema">
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
                    <img
                      src={selectedCinema.poster}
                      alt={selectedCinema.name}
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No poster set.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a cinema to inspect its metadata.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
