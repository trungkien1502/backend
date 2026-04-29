import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Clapperboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Button, Input } from '../components/common';

export const Login = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/50 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="relative hidden min-h-[620px] overflow-hidden bg-slate-900 lg:block">
          <img
            src="/thaythe.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/70 to-slate-950/20" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              <Clapperboard size={16} />
              Cinema Admin
            </div>

            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">Operations workspace</p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight text-white">
                Control the cinema floor from one focused console.
              </h1>
            </div>
          </div>
        </section>

        <section className="flex items-center bg-white p-6 text-slate-900 sm:p-8 lg:p-10">
          <div className="w-full">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Sign in</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Admin access</h2>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={20} />
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              placeholder="admin@example.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          </div>
        </section>
      </div>
    </div>
  );
};
