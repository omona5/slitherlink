import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreElapsed, dailyCount, shareText } from '../progress.js';

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
  const text = shareText({ size: 5, level: 'easy', elapsed: 1000, hints: 0, mode: 'practice' });
  assert.match(text, /자유 연습 완성/);
  assert.match(text, /00:01 · 힌트 없이 완성/);
  assert.doesNotMatch(text, /데일리|undefined/);
});
