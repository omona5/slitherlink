import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreElapsed, dailyCount, shareText, puzzleUrl, parsePuzzleLink } from '../progress.js';

test('running timers include reload time and continue across repeated saves', () => {
  const saved = { elapsed: 12500, started: true, running: true, savedAt: 100000 };
  const afterReload = restoreElapsed(saved, 108000);
  assert.equal(afterReload, 20500);
  assert.equal(restoreElapsed({ ...saved, elapsed: afterReload, savedAt: 108000 }, 110500), 23000);
});

test('paused, completed, suspended and unstarted timers never gain offline time', () => {
  const saved = { elapsed: 92000, savedAt: 100000, running: true, started: true };
  for (const flags of [{ paused: true }, { solved: true }, { running: false }, { started: false }]) {
    assert.equal(restoreElapsed({ ...saved, ...flags }, 999999), 92000);
  }
});

test('legacy saves preserve time and backward clock changes never subtract it', () => {
  assert.equal(restoreElapsed({ elapsed: 73500, started: true }, 999999), 73500);
  assert.equal(restoreElapsed({ elapsed: 5000, started: true, running: true, savedAt: 2000 }, 1000), 5000);
  assert.equal(restoreElapsed(null), 0);
  assert.equal(restoreElapsed({ elapsed: -5 }), 0);
});

test('daily completion count only considers the nine supported combinations', () => {
  assert.equal(dailyCount({}), 0);
  assert.equal(dailyCount({ '5:easy': {}, '9:hard': {}, '3:easy': {}, '5:expert': {} }), 2);
  const all = Object.fromEntries([5,7,9].flatMap(size => ['easy','medium','hard'].map(level => [`${size}:${level}`, {}])));
  assert.equal(dailyCount(all), 9);
});

test('daily share includes exact puzzle details and nine completion marks without a solution', () => {
  const text = shareText({ size: 7, level: 'hard', elapsed: 754000, hints: 2, mode: 'daily', date: '2026-11-20', records: { '7:hard': {} } });
  assert.match(text, /2026-11-20/);
  assert.match(text, /크기 7×7 · 난이도 어려움/);
  assert.match(text, /소요 시간 12:34 · 힌트 2회/);
  assert.match(text, /데일리 1\/9/);
  assert.equal([...text.matchAll(/🟩|⬜/gu)].length, 9);
  assert.match(text, /https:\/\/slitherlink.omona.dev\//);
});

test('practice share does not claim daily completion', () => {
  const text = shareText({ size: 5, level: 'easy', elapsed: 1000, hints: 0, mode: 'practice', seed: 123 });
  assert.match(text, /자유 연습 완성/);
  assert.match(text, /00:01 · 힌트 없이 완성/);
  assert.doesNotMatch(text, /데일리|undefined/);
});

test('daily links preserve size, difficulty and original date when opened later', () => {
  const puzzle = { size: 9, level: 'hard', mode: 'daily', date: '2026-11-19' };
  const url = new URL(puzzleUrl(puzzle));
  assert.equal(url.origin, 'https://slitherlink.omona.dev');
  assert.deepEqual(parsePuzzleLink(url.search, '2026-11-20'), puzzle);
  const text = shareText({ ...puzzle, elapsed: 60000, hints: 0, records: {} });
  assert.equal(text.split('\n').at(-1), url.href);
});

test('practice links preserve the exact seed, including zero and the unsigned maximum', () => {
  for (const size of [5,7,9]) for (const level of ['easy','medium','hard']) for (const seed of [0,123456,4294967295]) {
    const puzzle = { size, level, mode: 'practice', seed };
    assert.deepEqual(parsePuzzleLink(new URL(puzzleUrl(puzzle)).search, '2026-11-20'), puzzle);
  }
});

test('malformed links cannot apply invalid dimensions, modes, dates, or seeds', () => {
  const invalid = [
    '', '?mode=daily&size=3&level=easy&date=2026-11-20',
    '?mode=other&size=5&level=easy&date=2026-11-20',
    '?mode=daily&size=5&level=expert&date=2026-11-20',
    '?mode=daily&size=5&level=easy&date=2026-02-30',
    '?mode=daily&size=5&level=easy&date=2026-11-21',
    '?mode=daily&size=5&level=easy',
    '?mode=practice&size=5&level=easy',
    '?mode=practice&size=5&level=easy&seed=-1',
    '?mode=practice&size=5&level=easy&seed=4294967296',
    '?mode=practice&size=5&level=easy&seed=1e4',
    '?mode=practice&size=5&level=easy&seed=1&seed=2',
    '?v=2&mode=practice&size=5&level=easy&seed=1',
  ];
  for (const query of invalid) assert.equal(parsePuzzleLink(query, '2026-11-20'), null, query);
});

test('new puzzle URLs replace stale link parameters and never include sender progress', () => {
  const url = new URL(puzzleUrl({ mode:'practice',size:7,level:'medium',seed:42 }, 'http://localhost:4173/?mode=daily&date=2026-11-19#old'));
  assert.equal(url.origin, 'http://localhost:4173');
  assert.equal(url.searchParams.has('date'), false);
  assert.equal(url.hash, '');
  assert.deepEqual([...url.searchParams.keys()], ['v','mode','size','level','seed']);
});
