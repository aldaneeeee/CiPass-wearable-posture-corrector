import { useMemo, useState } from 'react';
import { Download, LogOut, Mail, Save, User as UserIcon, ShieldCheck, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';
import { downloadCsv, readingsToCsv } from '../lib/csv';

export default function Profile() {
  const { user, signIn, signOut, readings } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [flash, setFlash] = useState(false);

  const memberSince = useMemo(
    () => user ? new Date(user.createdAt).toLocaleDateString() : '—',
    [user],
  );

  if (!user) return null; // RequireAuth handles redirect

  const saveName = () => {
    if (!name.trim()) return;
    signIn(user.email, name.trim()); // re-uses signIn to overwrite the stored profile
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  const exportCsv = () => {
    const csv = readingsToCsv(readings);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`cipass-history-${stamp}.csv`, csv);
  };

  const wipeLocal = () => {
    if (!confirm('Erase all locally-stored posture readings? This cannot be undone.')) return;
    localStorage.removeItem('cipass.readings');
    location.reload();
  };

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Manage your account, export your data, or sign out."
        action={
          <button className="btn-outline" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-500 text-white grid place-items-center text-xl font-semibold">
              {(user.name || user.email)[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-lg">{user.name || 'CiPASS user'}</div>
              <div className="text-sm text-sub flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="name">Display name</label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What should we call you?"
              />
            </div>
            <div>
              <label className="label">Member since</label>
              <div className="input bg-slate-50 cursor-default">{memberSince}</div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button className="btn-primary" onClick={saveName}>
              <Save className="w-4 h-4" /> Save
            </button>
            {flash && <span className="text-xs text-brand-600">Saved.</span>}
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 text-sub text-sm">
              <ShieldCheck className="w-4 h-4" /> Data
            </div>
            <div className="font-semibold mt-1">Your posture data</div>
            <p className="text-sm text-sub mt-1">
              {readings.length.toLocaleString()} readings stored locally on this browser.
            </p>
          </div>

          <button className="btn-outline" onClick={exportCsv} disabled={!readings.length}>
            <Download className="w-4 h-4" /> Download CSV
          </button>
          <button className="btn-outline text-rose-600 hover:bg-rose-50 border-rose-100" onClick={wipeLocal}>
            <Trash2 className="w-4 h-4" /> Erase local data
          </button>

          <p className="text-xs text-sub">
            CiPASS v1 stores your data in your browser. A cloud-synced account is on the roadmap.
          </p>
        </div>
      </div>

      <div className="card mt-6 flex items-start gap-3 bg-brand-50/60 border border-brand-100/60">
        <UserIcon className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
        <div className="text-sm text-brand-900/80">
          <strong>Heads-up:</strong> the sign-in here is a local prototype — no password and no server. When you're
          ready to add real auth, swap <code>signIn</code> in <code>AppContext.tsx</code> for a real backend call.
        </div>
      </div>
    </>
  );
}
