export const SIZES = [5, 7, 9];
export const LEVELS = ['easy', 'medium', 'hard'];
export const LEVEL_LABELS = { easy: '쉬움', medium: '보통', hard: '어려움' };

export function formatTime(ms) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

// A running timer includes time spent reloading or away from the page.
// Old saves without a wall-clock timestamp keep their recorded elapsed time.
export function restoreElapsed(saved, now = Date.now()) {
  const elapsed = Number.isFinite(saved?.elapsed) ? Math.max(0, saved.elapsed) : 0;
  if (!saved?.started || saved.paused || saved.solved || !saved.running ||
      !Number.isFinite(saved.savedAt)) return elapsed;
  return elapsed + Math.max(0, now - saved.savedAt);
}

export function dailyCount(records) {
  return SIZES.reduce((count, size) =>
    count + LEVELS.filter(level => records?.[`${size}:${level}`]).length, 0);
}

export function puzzleUrl({ size, level, mode, date, seed }, base = 'https://slitherlink.omona.dev/') {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('v', '1');
  url.searchParams.set('mode', mode);
  url.searchParams.set('size', size);
  url.searchParams.set('level', level);
  if (mode === 'daily') url.searchParams.set('date', date);
  else url.searchParams.set('seed', seed);
  return url.href;
}

export function parsePuzzleLink(search, today) {
  const params = new URLSearchParams(search);
  for (const key of ['v', 'mode', 'size', 'level', 'date', 'seed']) {
    if (params.getAll(key).length > 1) return null;
  }
  if (params.has('v') && params.get('v') !== '1') return null;
  const mode = params.get('mode'), size = Number(params.get('size')), level = params.get('level');
  if (!['daily', 'practice'].includes(mode) || !SIZES.includes(size) || !LEVELS.includes(level)) return null;
  if (mode === 'daily') {
    const date = params.get('date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date > today) return null;
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return null;
    return { mode, size, level, date };
  }
  const rawSeed = params.get('seed');
  if (!/^\d{1,10}$/.test(rawSeed || '')) return null;
  const seed = Number(rawSeed);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return null;
  return { mode, size, level, seed };
}

export function shareText({ size, level, elapsed, hints, mode, date, records, seed }) {
  const lines = [
    `Slitherlink ${mode === 'daily' ? `오늘의 퍼즐 · ${date}` : '자유 연습'} 완성!`,
    `크기 ${size}×${size} · 난이도 ${LEVEL_LABELS[level]}`,
    `소요 시간 ${formatTime(elapsed)} · ${hints ? `힌트 ${hints}회` : '힌트 없이 완성'}`,
  ];
  if (mode === 'daily') {
    lines.push('', `데일리 ${dailyCount(records)}/9 완성 (행: 5·7·9 / 열: 쉬움·보통·어려움)`);
    for (const n of SIZES) lines.push(LEVELS.map(difficulty => records?.[`${n}:${difficulty}`] ? '🟩' : '⬜').join(''));
  }
  lines.push('', '같은 퍼즐 풀어보기', puzzleUrl({ size, level, mode, date, seed }));
  return lines.join('\n');
}
