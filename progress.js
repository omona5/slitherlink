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

export function shareText({ size, level, elapsed, hints, mode, date, records }) {
  const lines = [
    `Slitherlink ${mode === 'daily' ? `오늘의 퍼즐 · ${date}` : '자유 연습'} 완성!`,
    `크기 ${size}×${size} · 난이도 ${LEVEL_LABELS[level]}`,
    `소요 시간 ${formatTime(elapsed)} · ${hints ? `힌트 ${hints}회` : '힌트 없이 완성'}`,
  ];
  if (mode === 'daily') {
    lines.push('', `데일리 ${dailyCount(records)}/9 완성 (행: 5·7·9 / 열: 쉬움·보통·어려움)`);
    for (const n of SIZES) lines.push(LEVELS.map(difficulty => records?.[`${n}:${difficulty}`] ? '🟩' : '⬜').join(''));
  }
  lines.push('', '나도 하나의 고리 완성하기', 'https://slitherlink.omona.dev/');
  return lines.join('\n');
}
