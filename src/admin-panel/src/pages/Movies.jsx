import { useEffect, useState } from 'react';
import { Calendar, Clock, Edit3, Film, Plus, RefreshCcw, Star, Trash2 } from 'lucide-react';
import { Alert, Button, Card, DataToolbar, EmptyState, MetricPill, Modal, Select, StatusBadge, Input } from '../components/common';
import { extractError, movieAPI } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  formatDate,
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

const statusTone = (status) => {
  switch (status) {
    case 'NOW_SHOWING':
      return 'emerald';
    case 'COMING_SOON':
      return 'amber';
    case 'ENDED':
      return 'slate';
    default:
      return 'slate';
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
      setSelectedMovie(null);
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
  const nowShowingCount = movies.filter((movie) => movie.status === 'NOW_SHOWING').length;
  const comingSoonCount = movies.filter((movie) => movie.status === 'COMING_SOON').length;
  const endedCount = movies.filter((movie) => movie.status === 'ENDED').length;
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

      <div className="grid gap-3 md:grid-cols-4">
        <MetricPill label="Total movies" value={movies.length} tone="sky" />
        <MetricPill label="Now showing" value={nowShowingCount} tone="emerald" />
        <MetricPill label="Coming soon" value={comingSoonCount} tone="amber" />
        <MetricPill label="Ended" value={endedCount} tone="slate" />
      </div>

      <div className="grid gap-6">
        <Card title="Movie Catalog" action={<span className="text-xs font-medium text-slate-500">{visibleMovies.length} visible</span>}>
          <DataToolbar summary={loading ? 'Loading...' : `${visibleMovies.length} matching movies`}>
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
          </DataToolbar>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Title</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Genres</th>
                  <th className="px-3 py-3 font-semibold">Runtime</th>
                  <th className="px-3 py-3 font-semibold">Release</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleMovies.map((movie) => (
                  <tr
                    key={movie.id}
                    className={`cursor-pointer border-b border-slate-100 align-middle last:border-b-0 ${
                      selectedMovie?.id === movie.id ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => loadMovieDetail(movie.id)}
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-start gap-3">
                        {movie.poster ? (
                          <img src={movie.poster} alt="" className="h-16 w-11 shrink-0 rounded-md object-cover shadow-sm" />
                        ) : (
                          <div className="inline-flex h-16 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                            <Film size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{movie.title}</p>
                          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">{truncate(movie.description, 120) || 'No description'}</p>
                          <p className="mt-1 text-[11px] font-medium text-slate-400">TMDB {movie.tmdbId || '--'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge tone={statusTone(movie.status)}>{statusLabel(movie.status)}</StatusBadge>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{movie.genres?.join(', ') || '--'}</td>
                    <td className="px-3 py-4 text-slate-600">{formatRuntime(movie.duration)}</td>
                    <td className="px-3 py-4 text-slate-600">{formatDate(movie.releaseDate)}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
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
                          variant="outline"
                          className="text-rose-700 hover:border-rose-200 hover:bg-rose-50"
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

          {!visibleMovies.length && !loading ? (
            <EmptyState title="No movies found" description="Try clearing the search or choosing another status." />
          ) : null}
        </Card>

      </div>

      <Modal
        isOpen={detailLoading || Boolean(selectedMovie)}
        title={selectedMovie?.title || 'Movie detail'}
        subtitle={selectedMovie ? `${statusLabel(selectedMovie.status)} · ${formatRuntime(selectedMovie.duration)} · ${formatDate(selectedMovie.releaseDate)}` : 'Loading movie detail...'}
        onClose={() => {
          setSelectedMovie(null);
          setDetailLoading(false);
        }}
        size="xl"
      >
        {detailLoading ? (
          <p className="text-sm text-slate-500">Loading movie detail...</p>
        ) : selectedMovie ? (
          <div className="space-y-5 text-sm">
            <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
              {selectedMovie.poster ? (
                <img src={selectedMovie.poster} alt="" className="h-44 w-28 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="flex h-44 w-28 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <Film size={22} />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={statusTone(selectedMovie.status)}>{statusLabel(selectedMovie.status)}</StatusBadge>
                  <span className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 px-2.5 text-xs font-semibold text-slate-600">
                    <Star size={13} />
                    {selectedMovie.rating ?? '--'}
                  </span>
                </div>
                <p className="mt-3 leading-6 text-slate-600">{selectedMovie.description || 'No description.'}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Clock size={14} />
                  Runtime
                </div>
                <p className="mt-2 font-semibold text-slate-900">{formatRuntime(selectedMovie.duration)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Calendar size={14} />
                  Release
                </div>
                <p className="mt-2 font-semibold text-slate-900">{formatDate(selectedMovie.releaseDate)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Showtimes</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedMovie.showtimes?.length || 0}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Genres</p>
              <div className="flex flex-wrap gap-2">
                {selectedGenres.length ? selectedGenres.map((genre) => (
                  <span key={genre} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {genre}
                  </span>
                )) : <p className="text-sm text-slate-500">No genres attached.</p>}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Directors</p>
              <div className="space-y-2">
                {selectedDirectors.length ? (
                  selectedDirectors.map((item) => (
                    <div key={`${item.role}-${item.person.id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cast</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedCast.length ? (
                  selectedCast.map((item) => (
                    <div key={`${item.role}-${item.person.id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
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
        ) : null}
      </Modal>

      <Modal
        isOpen={formOpen}
        title={editingId ? 'Edit movie' : 'Create movie'}
        subtitle={editingId ? 'Update movie metadata.' : 'Add a new movie.'}
        onClose={closeForm}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save changes' : 'Create movie'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
