import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {topology,solve,inspect,isSingleLoop,transformPuzzle} from '../engine.js';
const bank=JSON.parse(readFileSync(new URL('../puzzles.json',import.meta.url)));
test('all 36 puzzles have exactly one solution and valid stored answers',()=>{
 assert.equal(bank.length,36);
 for(const p of bank){const t=topology(p.n),result=solve(t,p.clues);assert.equal(result.exhausted,false);assert.equal(result.solutions.length,1,`${p.n} ${p.level}`);assert.deepEqual(result.solutions[0],p.solution);assert.ok(inspect(t,p.clues,p.solution).solved);}
});
test('every rotation and reflection preserves clue placement and uniqueness',()=>{
 for(const p of bank)for(let r=0;r<4;r++)for(const m of [false,true]){const transformed=transformPuzzle(p,r,m),t=topology(p.n);assert.ok(inspect(t,transformed.clues,transformed.solution).solved);const result=solve(t,transformed.clues);assert.equal(result.exhausted,false);assert.equal(result.solutions.length,1);assert.deepEqual(result.solutions[0],transformed.solution);}
});
test('separate loops never count as a win, even with every clue satisfied',()=>{
 const t=topology(3),s=Array(t.edges.length).fill(0);for(const c of [0,8])for(const e of t.cells[c])s[e]=1;
 assert.equal(isSingleLoop(t,s),false);assert.equal(inspect(t,Array(9).fill(null),s).solved,false);
});
test('branches, empty boards, and incorrect clues are rejected',()=>{
 const t=topology(2),s=Array(t.edges.length).fill(0);assert.equal(isSingleLoop(t,s),false);
 for(const e of t.cells[0])s[e]=1;assert.equal(isSingleLoop(t,s),true);assert.equal(inspect(t,[3,null,null,null],s).solved,false);
 assert.deepEqual(inspect(t,[0,null,null,null],s).badCells,[0]);
 const v=t.vertices.find(ids=>ids.length>2&&ids.filter(e=>s[e]===1).length===2);s[v.find(e=>!s[e])]=1;assert.equal(isSingleLoop(t,s),false);
});
test('impossible clues and exceeded search budget never claim uniqueness',()=>{
 const t=topology(2);assert.equal(solve(t,[5,null,null,null]).solutions.length,0);assert.equal(solve(t,Array(4).fill(null),{budget:0}).exhausted,true);
});
