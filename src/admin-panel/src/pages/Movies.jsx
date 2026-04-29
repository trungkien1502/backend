import { useEffect, useState } from 'react';
import { Edit3, Film, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import { Alert, Button, Card, Input, Select } from '../components/common';
import { extractError, movieAPI } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  formatDate,
  formatDateTime,
  formatRuntime,
  toDateInputValue,
  truncate,
} from '../utils/formatters';

const movieStatusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'COMING_SOON', label: 'Coming soon' },
  { value: 'NOW_SHOWING', label: 'Now showing' },
  { value: 'ENDED', label: 'Ended' },
];

const movieFormDefaults = {
  title: '',
  description: '',
  duration: '',
  poster: '',
  backdrop: '',
  rating: '',
  tmdbId: '',
  releaseDate: '',
  status: 'COMING_SOON',
};

const badgeClass = (status) => {
  switch (status) {
    case 'NOW_SHOWING':
      return 'bg-emerald-50 text-emerald-700';
    case 'COMING_SOON':
      return 'bg-amber-50 text-amber-700';
    case 'ENDED':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const statusLabel = (status) => {
  switch (status) {
    case 'NOW_SHOWING':
      return 'Now showing';
    case 'COMING_SOON':
      return 'Coming soon';
    case 'ENDED':
      return 'Ended';
    default:
      return status || '--';
  }
};

const buildMoviePayload = (formData) => ({
  title: formData.title.trim(),
  description: formData.description.trim(),
  duration: formData.duration,
  poster: formData.poster.trim(),
  backdrop: formData.backdrop.trim(),
  rating: formData.rating,
  tmdbId: formData.tmdbId,
  releaseDate: formData.releaseDate,
  status: formData.status,
});

export const MoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [formData, setFormData] = useState(movieFormDefaults);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const debouncedSearch = useDebouncedValue(filters.search, 250);

  useEffect(() => {
    fetchMovies();
  }, [filters.status]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const data = await movieAPI.list({
        ...(filters.status ? { status: filters.status } : {}),
      });

      setMovies(data);

      if (selectedMovie) {
        const stillExists = data.find((movie) => movie.id === selectedMovie.id);

        if (!stillExists) {
          setSelectedMovie(null);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(movieFormDefaults);
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const loadMovieDetail = async (movieId) => {
    try {
      setDetailLoading(true);
      const data = await movieAPI.detail(movieId);
      setSelectedMovie(data);
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEdit = (movie) => {
    setEditingId(movie.id);
    setFormData({
      title: movie.title || '',
      description: movie.description || '',
      duration: movie.duration ?? '',
      poster: movie.poster || '',
      backdrop: movie.backdrop || '',
      rating: movie.rating ?? '',
      tmdbId: movie.tmdbId ?? '',
      releaseDate: toDateInputValue(movie.releaseDate),
      status: movie.status || 'COMING_SOON',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = buildMoviePayload(formData);

      if (editingId) {
        await movieAPI.update(editingId, payload);
        setMessage({ type: 'success', text: 'Movie updated.' });
      } else {
        await movieAPI.create(payload);
        setMessage({ type: 'success', text: 'Movie created.' });
      }

      await fetchMovies();

      if (editingId || selectedMovie) {
        await loadMovieDetail(editingId || selectedMovie?.id);
      }

      closeForm();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movieId) => {
    if (!window.confirm('Delete this movie?')) return;

    try {
      await movieAPI.remove(movieId);
      setMessage({ type: 'success', text: 'Movie deleted.' });

      if (selectedMovie?.id === movieId) {
        setSelectedMovie(null);
      }

      if (editingId === movieId) {
        closeForm();
      }

      await fetchMovies();
    } catch (error) {
      setMessage({ type: 'error', text: extractError(error) });
    }
  };

  const selectedGenres = selectedMovie?.genres?.map((item) => item.genre.name) || [];
  const selectedDirectors = selectedMovie?.people?.filter((item) => item.role === 'DIRECTOR') || [];
  const selectedCast = selectedMovie?.people?.filter((item) => item.role === 'CAST') || [];
  const visibleMovies = movies.filter((movie) => {
    const keyword = debouncedSearch.trim().toLowerCase();

    if (!keyword) return true;

    return [movie.title, movie.description, movie.genres?.join(' ')]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(keyword));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Catalog</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Movies</h2>
          <p className="mt-2 text-sm text-slate-600">
            Manage core movie metadata. Genres and people shown in details are read-only from the current API surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={fetchMovies}>
            <RefreshCcw size={16} />
            Refresh
          </Button>
          <Button onClick={openCreateForm}>
            <Plus size={16} />
            New movie
          </Button>
        </div>
      </div>

      {message.text ? (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(360px,1fr)]">
        <Card title="Movie list">
          <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              label="Search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Search by title"
            />
            <Select
              label="Status"
              options={movieStatusOptions}
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Title</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Genres</th>
                  <th className="pb-3 pr-4 font-medium">Runtime</th>
                  <th className="pb-3 pr-4 font-medium">Release</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleMovies.map((movie) => (
                  <tr
                    key={movie.id}
                    className={`cursor-pointer border-b border-slate-100 align-top last:border-b-0 ${
                      selectedMovie?.id === movie.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => loadMovieDetail(movie.id)}
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Film size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{movie.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{truncate(movie.description, 72) || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(movie.status)}`}>
                        {statusLabel(movie.status)}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{movie.genres?.join(', ') || '--'}</td>
                    <td className="py-4 pr-4 text-slate-600">{formatRuntime(movie.duration)}</td>
                    <td className="py-4 pr-4 text-slate-600">{formatDate(movie.releaseDate)}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(movie);
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
                            handleDelete(movie.id);
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

          {!visibleMovies.length && !loading ? <p className="mt-6 text-sm text-slate-500">No movies found.</p> : null}
        </Card>

        <div className="space-y-6">
          <Card title="Selected movie">
            {detailLoading ? (
              <p className="text-sm text-slate-500">Loading movie detail...</p>
            ) : selectedMovie ? (
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{selectedMovie.title}</h3>
                  <p className="mt-1 text-slate-500">
                    {statusLabel(selectedMovie.status)} · {formatRuntime(selectedMovie.duration)} · {formatDate(selectedMovie.releaseDate)}
                  </p>
                </div>

                <p className="leading-6 text-slate-600">{selectedMovie.description || 'No description.'}</p>

                <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Genres</span>
                    <span className="text-right font-medium text-slate-900">
                      {selectedGenres.join(', ') || '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Showtimes</span>
                    <span className="font-medium text-slate-900">{selectedMovie.showtimes?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Created</span>
                    <span className="font-medium text-slate-900">{formatDateTime(selectedMovie.createdAt)}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Directors</p>
                  <div className="space-y-2">
                    {selectedDirectors.length ? (
                      selectedDirectors.map((item) => (
                          <div key={`${item.role}-${item.person.id}`} className="rounded-lg border border-slate-200 px-3 py-2">
                            <p className="font-medium text-slate-900">{item.person.name}</p>
                            <p className="text-xs text-slate-500">{item.job || 'Director'}</p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-slate-500">No directors attached.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Cast</p>
                  <div className="space-y-2">
                    {selectedCast.length ? (
                      selectedCast.map((item) => (
                          <div key={`${item.role}-${item.person.id}`} className="rounded-lg border border-slate-200 px-3 py-2">
                            <p className="font-medium text-slate-900">{item.person.name}</p>
                            <p className="text-xs text-slate-500">{item.character || 'No character name'}</p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-slate-500">No cast attached.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a movie to inspect its detail payload.</p>
            )}
          </Card>
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <button type="button" className="flex-1 cursor-default" aria-label="Close movie form" onClick={closeForm} />
          <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl shadow-slate-950/30">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                  {editingId ? 'Edit movie' : 'Create movie'}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {editingId ? 'Update movie metadata' : 'Add a new movie'}
                </h3>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <Input
                  label="Title"
                  required
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="Movie title"
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    rows="5"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    placeholder="Synopsis"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Duration (minutes)"
                    type="number"
                    value={formData.duration}
                    onChange={(event) => setFormData({ ...formData, duration: event.target.value })}
                  />
                  <Input
                    label="Rating"
                    type="number"
                    step="0.1"
                    value={formData.rating}
                    onChange={(event) => setFormData({ ...formData, rating: event.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="TMDB ID"
                    type="number"
                    value={formData.tmdbId}
                    onChange={(event) => setFormData({ ...formData, tmdbId: event.target.value })}
                  />
                  <Input
                    label="Release date"
                    type="date"
                    value={formData.releaseDate}
                    onChange={(event) => setFormData({ ...formData, releaseDate: event.target.value })}
                  />
                </div>

                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                  options={movieStatusOptions.filter((option) => option.value)}
                />

                <Input
                  label="Poster URL"
                  value={formData.poster}
                  onChange={(event) => setFormData({ ...formData, poster: event.target.value })}
                  placeholder="https://..."
                />

                <Input
                  label="Backdrop URL"
                  value={formData.backdrop}
                  onChange={(event) => setFormData({ ...formData, backdrop: event.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editingId ? 'Save changes' : 'Create movie'}
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
};
