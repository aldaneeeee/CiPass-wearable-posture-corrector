import type { PostureReading } from './types';

export function readingsToCsv(rows: PostureReading[]): string {
  const head = 'timestamp_iso,unix_ms,flex,status';
  const body = rows
    .map(r => `${new Date(r.t).toISOString()},${r.t},${r.flex},${r.status}`)
    .join('\n');
  return `${head}\n${body}\n`;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
