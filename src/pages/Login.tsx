import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Leaf, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { user, signIn } = useApp();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  if (user) return <Navigate to="/" replace />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName  = name.trim();
    if (!trimmedEmail || !/.+@.+\..+/.test(trimmedEmail)) {
      setErr('Please enter a valid email.');
      return;
    }
    signIn(trimmedEmail, trimmedName || trimmedEmail.split('@')[0]);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white grid place-items-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-lg">CiPASS</div>
            <div className="text-xs text-sub">Your posture companion</div>
          </div>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-sub mt-1">
            Sign in to view your posture dashboard. This prototype keeps your account locally on this device.
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="name">Display name <span className="text-sub text-xs">(optional)</span></label>
              <input
                id="name"
                className="input"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {err && <div className="text-sm text-rose-600">{err}</div>}

            <button type="submit" className="btn-primary w-full">
              <LogIn className="w-4 h-4" /> Continue
            </button>
          </form>

          <p className="text-xs text-sub mt-4 text-center">
            No password required — this is a local-only sign-in stub.
          </p>
        </div>
      </div>
    </div>
  );
}
