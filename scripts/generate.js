import {writeFileSync} from 'node:fs';
import {topology,isSingleLoop,solve,rng} from '../engine.js';
const puzzles=[];
for(const n of [5,7,9])for(const level of ['easy','medium','hard'])for(let variant=0;variant<4;variant++){
 const random=rng(n*9821+variant*1427+level.length*593),t=topology(n);
 const inside=Array(n*n).fill(false);inside[Math.floor(n/2)*n+Math.floor(n/2)]=true;
 const boundary=()=>t.edges.map(e=>Number(e.cells.filter(c=>inside[c]).length===1));
 const target=Math.floor(n*n*(.43+random()*.17));
 for(let tries=0;inside.filter(Boolean).length<target&&tries<2000;tries++){
  const candidates=inside.map((v,c)=>!v&&[c%n?c-1:-1,c%n<n-1?c+1:-1,c-n,c+n].some(i=>i>=0&&i<n*n&&inside[i])?c:-1).filter(c=>c>=0);
  const cell=candidates[Math.floor(random()*candidates.length)];inside[cell]=true;if(!isSingleLoop(t,boundary()))inside[cell]=false;
 }
 const solution=boundary(),clues=t.cells.map(ids=>ids.reduce((a,e)=>a+solution[e],0));
 const order=Array.from({length:n*n},(_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const targetClues=Math.floor(n*n*({easy:.82,medium:.64,hard:.45}[level]));
 for(const c of order){if(clues.filter(v=>v!==null).length<=targetClues)break;const old=clues[c];clues[c]=null;const result=solve(t,clues,{budget:15000});if(result.exhausted||result.solutions.length!==1)clues[c]=old;}
 const verified=solve(t,clues,{budget:100000});if(verified.exhausted||verified.solutions.length!==1)throw Error('Non-unique puzzle');
 puzzles.push({n,level,clues,solution});console.log(`${n} ${level} ${variant+1}: ${clues.filter(x=>x!==null).length} clues, ${verified.nodes} nodes`);
}
writeFileSync(new URL('../puzzles.json',import.meta.url),JSON.stringify(puzzles));
