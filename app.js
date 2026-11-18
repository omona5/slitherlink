import {topology,inspect,rng,transformPuzzle} from './engine.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE='slitherlink:v1:';
let storageOK=true;
function read(key,fallback){try{const v=localStorage.getItem(STORE+key);return v?JSON.parse(v):fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(STORE+key,JSON.stringify(value));}catch{storageOK=false;$('.under-board>p').textContent='브라우저 저장 공간을 사용할 수 없어요.';}}
const stored=read('preferences',{});
let mode=stored.mode==='practice'?'practice':'daily',size=[5,7,9].includes(stored.size)?stored.size:5,level=['easy','medium','hard'].includes(stored.level)?stored.level:'easy';
let bank=[],puzzle,t,state=[],history=[],future=[],elapsed=0,started=false,paused=false,solved=false,hints=0,sessionKey='',puzzleId='',lastTick=performance.now(),confirmAction=null,highlight=-1;
let tool='line',hiddenPause=false;
const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function hash(text){let h=2166136261;for(const char of text)h=Math.imul(h^char.charCodeAt(0),16777619);return h>>>0;}
function formatTime(ms){const s=Math.floor(ms/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function recordTime(){const now=performance.now();if(started&&!paused&&!solved&&!document.hidden)elapsed+=now-lastTick;lastTick=now;$('#timer').textContent=formatTime(elapsed);}
function save(){if(!puzzle)return;write(sessionKey,{id:puzzleId,state,history,future,elapsed,started,hints});}
function requestChange(title,text,action){if(!started||solved){action();return;}confirmAction=action;$('#confirm-title').textContent=title;$('#confirm-text').textContent=text;$('#confirm-dialog').showModal();}
function syncControls(){
 $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));$$('[data-size]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.size===size));$$('[data-level]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.level===level));$$('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool));
 $('#difficulty-note').textContent={easy:'숫자 힌트가 넉넉한, 가벼운 시작.',medium:'조금 더 생각하는 즐거움.',hard:'적은 숫자 사이에 숨은 길을 찾아요.'}[level];
 $('#new-game').innerHTML=mode==='daily'?'자유 연습 시작 <span aria-hidden="true">↗</span>':'새 퍼즐 시작 <span aria-hidden="true">↗</span>';
 $('#mode-note').textContent=mode==='daily'?'하루 한 번, 작은 성취':'내 속도로, 자유롭게';$('#mode-description').textContent=mode==='daily'?'한국 시간 자정에 새로운 퍼즐이 찾아와요.':'새로운 조합의 퍼즐을 천천히 즐겨요.';
 write('preferences',{mode,size,level});$('#wins').innerHTML=`${read('completed',[]).length} <small>puzzles</small>`;
}
function loadGame(){
 recordTime();save();syncControls();
 const date=day();sessionKey=`game:${mode}:${size}:${level}:${mode==='daily'?date:'current'}`;
 let practiceSeed=read(`seed:${size}:${level}`,null);
 if(!Number.isInteger(practiceSeed)){practiceSeed=crypto.getRandomValues(new Uint32Array(1))[0];write(`seed:${size}:${level}`,practiceSeed);}
 const seed=mode==='daily'?hash(`${date}:${size}:${level}`):practiceSeed;
 const random=rng(seed),candidates=bank.filter(p=>p.n===size&&p.level===level),index=Math.floor(random()*candidates.length),turns=Math.floor(random()*4),mirror=random()>.5;
 puzzle=transformPuzzle(candidates[index],turns,mirror);puzzleId=`${size}:${level}:${index}:${turns}:${mirror}`;t=topology(size);
 const saved=read(sessionKey,null),valid=saved?.id===puzzleId&&Array.isArray(saved.state)&&saved.state.length===t.edges.length&&saved.state.every(v=>[0,1,2].includes(v));
 state=valid?saved.state:Array(t.edges.length).fill(0);
 const cleanHistory=items=>Array.isArray(items)?items.filter(a=>Number.isInteger(a.e)&&a.e>=0&&a.e<t.edges.length&&[0,1,2].includes(a.before)&&[0,1,2].includes(a.after)).slice(-1000):[];
 history=valid?cleanHistory(saved.history):[];future=valid?cleanHistory(saved.future):[];elapsed=valid&&Number.isFinite(saved.elapsed)?Math.max(0,saved.elapsed):0;started=valid&&Boolean(saved.started);hints=valid&&Number.isInteger(saved.hints)?Math.max(0,saved.hints):0;paused=false;hiddenPause=false;solved=inspect(t,puzzle.clues,state).solved;highlight=-1;lastTick=performance.now();
 $('#puzzle-tag').textContent=mode==='daily'?'DAILY PUZZLE':'PRACTICE PUZZLE';$('#puzzle-title').textContent=mode==='daily'?'오늘의 작은 도전':'나만의 몰입 시간';$('#puzzle-date').textContent=`${date.replaceAll('-','.')} · ${size} × ${size} · ${{easy:'쉬움',medium:'보통',hard:'어려움'}[level]}`;
 $('#loading').hidden=true;$('#pause-cover').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','일시 정지');$('#timer').textContent=formatTime(elapsed);buildBoard();render();save();
}
function buildBoard(){
 const board=$('#board');board.replaceChildren();const inset=4,unit=92/size;
 puzzle.clues.forEach((v,c)=>{if(v===null)return;const el=document.createElement('span');el.className='clue';el.dataset.cell=c;el.textContent=v;el.style.left=`${inset+(c%size+.5)*unit}%`;el.style.top=`${inset+(Math.floor(c/size)+.5)*unit}%`;if(size===9)el.style.fontSize='17px';board.append(el);});
 t.edges.forEach((edge,e)=>{const r=Math.floor(edge.a/(size+1)),c=edge.a%(size+1),horizontal=edge.b-edge.a===1;const b=document.createElement('button');b.className=`edge ${horizontal?'horizontal':'vertical'}`;b.dataset.edge=e;b.style.left=`${inset+c*unit}%`;b.style.top=`${inset+r*unit}%`;b.style[horizontal?'width':'height']=`${unit}%`;b.setAttribute('aria-label',`${r+1}행 ${c+1}열 ${horizontal?'가로':'세로'} 변`);b.addEventListener('click',()=>play(e,tool));b.addEventListener('contextmenu',event=>{event.preventDefault();play(e,'cross');});b.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='x'){event.preventDefault();play(e,'cross');}});board.append(b);});
 t.vertices.forEach((_,v)=>{const dot=document.createElement('span');dot.className='grid-dot';dot.dataset.vertex=v;dot.style.left=`${inset+v%(size+1)*unit}%`;dot.style.top=`${inset+Math.floor(v/(size+1))*unit}%`;board.append(dot);});
}
function render(){
 const result=inspect(t,puzzle.clues,state);
 $$('[data-edge]').forEach(el=>{const e=+el.dataset.edge;el.classList.toggle('on',state[e]===1);el.classList.toggle('cross',state[e]===2);el.classList.toggle('highlight',e===highlight);el.setAttribute('aria-pressed',state[e]===1);el.setAttribute('aria-description',state[e]===1?'선 있음':state[e]===2?'× 표시':'빈 변');el.disabled=solved;});
 $$('.clue').forEach(el=>{const c=+el.dataset.cell;el.classList.toggle('met',result.met.includes(c));el.classList.toggle('bad',result.badCells.includes(c));});$$('.grid-dot').forEach(el=>el.classList.toggle('bad',result.badVertices.includes(+el.dataset.vertex)));
 $('#clues-met').textContent=result.met.length;$('#clues-total').textContent=puzzle.clues.filter(v=>v!==null).length;$('#undo').disabled=!history.length||solved||paused;$('#redo').disabled=!future.length||solved||paused;$('#hint').disabled=solved||paused;$('#reset').disabled=!started;$('#pause').disabled=solved;$('#board').classList.toggle('solved',solved);
 const bad=result.badCells.length||result.badVertices.length;$('.board-status').classList.toggle('error',!!bad);
 $('#status').textContent=solved?'하나의 고리, 완성했어요!':bad?'빨간 표시 주변을 다시 살펴보세요.':paused?'잠시 쉬어가는 중이에요.':!started?'첫 번째 선을 그어보세요.':result.met.length===puzzle.clues.filter(v=>v!==null).length?'모든 선이 하나의 고리로 이어져야 해요.':hints?`천천히 이어보세요. · 힌트 ${hints}회`:'좋아요. 나만의 길을 이어보세요.';
}
function play(e,input){if(paused||solved)return;recordTime();const value=input==='cross'?2:1;change(e,state[e]===value?0:value);}
function change(e,value){const before=state[e];if(before===value)return;started=true;history.push({e,before,after:value});if(history.length>1000)history.shift();future=[];state[e]=value;highlight=-1;finishMove();}
function finishMove(){
 if(inspect(t,puzzle.clues,state).solved){solved=true;const complete=read('completed',[]);if(!complete.includes(puzzleId)){complete.push(puzzleId);write('completed',complete);syncControls();}$('#win-detail').textContent=`${size} × ${size} · ${formatTime(elapsed)} · ${hints?`힌트 ${hints}회`:'힌트 없이 완성'}`;$('#win-dialog').showModal();}
 render();save();
}
function undo(redo=false){if(paused||solved)return;const from=redo?future:history,to=redo?history:future,action=from.pop();if(!action)return;recordTime();state[action.e]=redo?action.after:action.before;to.push(action);highlight=-1;render();save();}
function togglePause(){if(solved)return;recordTime();paused=!paused;$('#pause-cover').hidden=!paused;$('#pause').textContent=paused?'▷':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'계속 풀기':'일시 정지');render();save();}
$$('[data-mode]').forEach(b=>b.onclick=()=>{if(mode===b.dataset.mode)return;mode=b.dataset.mode;loadGame();});$$('[data-size]').forEach(b=>b.onclick=()=>{if(size===+b.dataset.size)return;size=+b.dataset.size;loadGame();});$$('[data-level]').forEach(b=>b.onclick=()=>{if(level===b.dataset.level)return;level=b.dataset.level;loadGame();});$$('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;syncControls();});
function newPractice(){requestChange('새로운 퍼즐을 시작할까요?','현재 퍼즐 대신 새로운 자유 연습 퍼즐을 시작해요.',()=>{mode='practice';let seed;
 do{seed=crypto.getRandomValues(new Uint32Array(1))[0];const random=rng(seed),count=bank.filter(p=>p.n===size&&p.level===level).length,index=Math.floor(random()*count),turns=Math.floor(random()*4),mirror=random()>.5;if(`${size}:${level}:${index}:${turns}:${mirror}`!==puzzleId)break;}while(true);
 write(`seed:${size}:${level}`,seed);loadGame();});}
$('#new-game').onclick=newPractice;$('#undo').onclick=()=>undo();$('#redo').onclick=()=>undo(true);$('#pause').onclick=togglePause;$('#resume').onclick=togglePause;
$('#reset').onclick=()=>requestChange('처음부터 다시 풀까요?','이 퍼즐의 선과 × 표시, 시간 및 힌트 기록을 초기화해요.',()=>{state.fill(0);history=[];future=[];elapsed=0;hints=0;highlight=-1;started=false;solved=false;paused=false;$('#pause-cover').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','일시 정지');lastTick=performance.now();$('#timer').textContent='00:00';render();save();});
$('#hint').onclick=()=>{if(solved||paused)return;recordTime();const mismatch=state.findIndex((v,e)=>(v===1&&puzzle.solution[e]!==1)||(v===2&&puzzle.solution[e]===1));let e=mismatch;
 if(e<0)e=state.findIndex((v,i)=>v===0&&puzzle.solution[i]===1);if(e<0)return;hints++;change(e,puzzle.solution[e]===1?1:2);highlight=e;render();save();};
$('#help').onclick=()=>$('#help-dialog').showModal();$$('.dialog-close,.dialog-close-action').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('#confirm-no').onclick=()=>{$('#confirm-dialog').close();confirmAction=null;};$('#confirm-yes').onclick=()=>{$('#confirm-dialog').close();const action=confirmAction;confirmAction=null;action?.();};$('#confirm-dialog').addEventListener('cancel',()=>{confirmAction=null;});
$('#win-next').onclick=()=>{$('#win-dialog').close();newPractice();};
document.addEventListener('keydown',event=>{if(document.querySelector('dialog[open]'))return;if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo(event.shiftKey);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){recordTime();if(started&&!paused&&!solved){hiddenPause=true;togglePause();}save();}else{lastTick=performance.now();if(hiddenPause){hiddenPause=false;/* Resume explicitly so background time is never charged. */}}});
window.addEventListener('pagehide',()=>{recordTime();save();});setInterval(()=>{recordTime();if(started&&!paused&&!solved)save();},1000);
try{const response=await fetch('./puzzles.json');if(!response.ok)throw Error('퍼즐 파일을 불러오지 못했어요.');bank=await response.json();loadGame();}catch(error){$('#loading').textContent='퍼즐을 불러오지 못했어요. 새로고침해 주세요.';$('#status').textContent=error.message;$$('button').forEach(b=>{if(b.id!=='help')b.disabled=true;});}
