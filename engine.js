// Pure puzzle logic, shared by the browser, generator, and tests.
export function topology(n) {
  const edges = [], cells = Array.from({length:n*n},()=>[]), vertices = Array.from({length:(n+1)**2},()=>[]);
  function add(a,b,adjacent) {
    const id=edges.length; edges.push({a,b,cells:adjacent});
    vertices[a].push(id); vertices[b].push(id); adjacent.forEach(c=>cells[c].push(id));
  }
  for(let r=0;r<=n;r++) for(let c=0;c<n;c++) add(r*(n+1)+c,r*(n+1)+c+1,[...(r?[ (r-1)*n+c ]:[]),...(r<n?[r*n+c]:[])]);
  for(let r=0;r<n;r++) for(let c=0;c<=n;c++) add(r*(n+1)+c,(r+1)*(n+1)+c,[...(c?[r*n+c-1]:[]),...(c<n?[r*n+c]:[])]);
  return {n,edges,cells,vertices};
}
export function isSingleLoop(t,state) {
  const active=t.edges.map((_,i)=>i).filter(i=>state[i]===1);
  if(!active.length || t.vertices.some(v=>{const k=v.filter(e=>state[e]===1).length;return k!==0&&k!==2;})) return false;
  const seen=new Set(), stack=[active[0]];
  while(stack.length){const e=stack.pop();if(seen.has(e))continue;seen.add(e);const {a,b}=t.edges[e];for(const v of [a,b])for(const next of t.vertices[v])if(state[next]===1&&!seen.has(next))stack.push(next);}
  return seen.size===active.length;
}
export function inspect(t,clues,state) {
  const badCells=[],met=[];
  clues.forEach((clue,c)=>{if(clue===null)return;const count=t.cells[c].filter(e=>state[e]===1).length;
    if(count===clue)met.push(c);
    if(count>clue || count+t.cells[c].filter(e=>state[e]===0).length<clue)badCells.push(c);
  });
  const badVertices=t.vertices.map((v,i)=>v.filter(e=>state[e]===1).length>2?i:-1).filter(i=>i>=0);
  return {badCells,badVertices,met,solved:met.length===clues.filter(x=>x!==null).length&&isSingleLoop(t,state)};
}
// Constraint propagation plus bounded search. -1 is undecided; 0 is absent.
export function solve(t,clues,{limit=2,budget=100000}={}) {
  const solutions=[];let nodes=0,exhausted=false;
  function search(s) {
    if(solutions.length>=limit||exhausted)return;
    if(++nodes>budget){exhausted=true;return;}
    let changed=true;
    while(changed){changed=false;
      function assign(ids,value){for(const e of ids)if(s[e]===-1){s[e]=value;changed=true;}}
      for(let c=0;c<clues.length;c++){if(clues[c]===null)continue;const ids=t.cells[c],on=ids.filter(e=>s[e]===1).length,unknown=ids.filter(e=>s[e]===-1);
        if(on>clues[c]||on+unknown.length<clues[c])return;
        if(on===clues[c])assign(unknown,0);else if(on+unknown.length===clues[c])assign(unknown,1);
      }
      for(const ids of t.vertices){const on=ids.filter(e=>s[e]===1).length,unknown=ids.filter(e=>s[e]===-1);
        if(on>2||(on===1&&!unknown.length))return;
        if(on===2||(!on&&unknown.length===1))assign(unknown,0);else if(on===1&&unknown.length===1)assign(unknown,1);
      }
    }
    // A closed component cannot later connect to any other drawn segment.
    const active=s.map((v,i)=>v===1?i:-1).filter(i=>i>=0),seen=new Set();
    for(const start of active){if(seen.has(start))continue;let closed=true;const stack=[start],component=[];
      while(stack.length){const e=stack.pop();if(seen.has(e))continue;seen.add(e);component.push(e);for(const v of [t.edges[e].a,t.edges[e].b]){const next=t.vertices[v].filter(i=>s[i]===1);if(next.length!==2)closed=false;for(const i of next)if(!seen.has(i))stack.push(i);}}
      if(closed){if(component.length!==active.length)return;const candidate=s.map(v=>v===1?1:0);if(clues.every((v,c)=>v===null||t.cells[c].reduce((a,e)=>a+candidate[e],0)===v))solutions.push(candidate);return;}
    }
    let best=-1,score=-1;
    s.forEach((v,e)=>{if(v!==-1)return;const edge=t.edges[e];const weight=edge.cells.reduce((a,c)=>a+(clues[c]===null?0:5-t.cells[c].filter(i=>s[i]===-1).length),0)+[edge.a,edge.b].reduce((a,v)=>a+t.vertices[v].filter(i=>s[i]===1).length*3,0);if(weight>score){best=e;score=weight;}});
    if(best<0)return;
    for(const value of [1,0]){const next=s.slice();next[best]=value;search(next);}
  }
  search(Array(t.edges.length).fill(-1));return {solutions,nodes,exhausted};
}
export function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let a=Math.imul(seed^seed>>>15,1|seed);a^=a+Math.imul(a^a>>>7,61|a);return ((a^a>>>14)>>>0)/4294967296;};}
export function transformPuzzle(p,turns=0,mirror=false){
  const t=topology(p.n),mapVertex=v=>{let r=Math.floor(v/(p.n+1)),c=v%(p.n+1);if(mirror)c=p.n-c;for(let i=0;i<turns;i++)[r,c]=[c,p.n-r];return r*(p.n+1)+c;};
  const lookup=new Map(t.edges.map((e,i)=>[[e.a,e.b].sort((a,b)=>a-b).join(','),i]));
  const solution=Array(t.edges.length).fill(0);t.edges.forEach((e,i)=>{solution[lookup.get([mapVertex(e.a),mapVertex(e.b)].sort((a,b)=>a-b).join(','))]=p.solution[i];});
  const clues=Array(p.n*p.n).fill(null);p.clues.forEach((v,i)=>{let r=Math.floor(i/p.n),c=i%p.n;if(mirror)c=p.n-1-c;for(let k=0;k<turns;k++)[r,c]=[c,p.n-1-r];clues[r*p.n+c]=v;});return {...p,clues,solution};
}
