import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}

const tones = {
  default: 'bg-white',
  good:    'bg-brand-50',
  warn:    'bg-amber-50',
  bad:     'bg-rose-50',
};

export default function StatCard({ label, value, hint, icon, tone = 'default' }: Props) {
  return (
    <div className={`card ${tones[tone]} flex flex-col gap-2`}>
      <div className="flex items-center gap-2 text-sub text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold text-ink">{value}</div>
      {hint && <div className="text-xs text-sub">{hint}</div>}
    </div>
  );
}
