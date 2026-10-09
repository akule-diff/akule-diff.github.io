'use strict';
const names={weave:'Canonical Weave',highways:'Highways',conveyor:'Conveyor',basic:'SMD Basic',dense:'SMD Dense',shelf:'SMD Shelf',room:'SMD Room',scaledweave:'ScaledWeave'};
const $=s=>document.querySelector(s);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const tasks={
 weave:{title:'Exchange positions through shared space',description:'Move every robot from its start to its assigned goal across an open workspace. Crossing routes create conflicts even when each individual path is obstacle-free.'},
 highways:{title:'Share the passages around fixed obstacles',description:'Navigate to assigned goals through the free-space corridors around fixed obstacles. Robots must coordinate where their routes meet and share limited passing room.'},
 conveyor:{title:'Coordinate through narrow lanes',description:'Reach assigned goals around long, parallel obstacles. The layout creates narrow lanes and detours, bringing robots together at shared passages.'},
 basic:{title:'Navigate around scattered obstacles',description:'Move the team to assigned goals through a map of circular obstacles. Each robot must avoid the fixed geometry while coordinating with other moving robots.'},
 dense:{title:'Find room to pass in a crowded map',description:'Reach assigned goals in a denser field of circular obstacles. Less open space makes both obstacle avoidance and robot-to-robot coordination more demanding.'},
 shelf:{title:'Move through a shelf-like layout',description:'Navigate between repeated obstacle structures to reach assigned goals. Robots share constrained routes around the shelves and must coordinate when those routes overlap.'},
 room:{title:'Connect starts and goals across a divided space',description:'Reach assigned goals around room-like obstacle arrangements. The team must navigate the available openings while avoiding obstacles and one another.'},
 scaledweave:{title:'Scale the position-exchange task',description:'Move a larger team between assigned start and goal configurations. The workspace grows with population to preserve feasible endpoints, while crossing routes still require coordination.'}
};
let media=[],results=null,environment='weave',resultsEnvironment='weave';
const population=$('#population'),video=$('#gallery-video'),resultPopulation=$('#results-population');
function buttons(container,selected,callback){
 container.replaceChildren(...Object.entries(names).map(([key,name])=>{const b=document.createElement('button');b.type='button';b.dataset.env=key;b.textContent=name;b.setAttribute('aria-pressed',String(key===selected));b.addEventListener('click',()=>callback(key));return b;}));
}
function updatePressed(container,env){container.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.env===env)));}
function selectEnvironment(key,n){
 environment=key;updatePressed($('#environment-tabs'),key);
 const values=media.filter(r=>r.environment===key).map(r=>r.population).sort((a,b)=>a-b);
 population.replaceChildren(...values.map(n=>new Option(`N=${n} · ${n} robots`,n)));
 population.value=String(values.includes(Number(n))?n:values.at(-1));selectVideo();
}
function selectVideo(){
 const r=media.find(r=>r.environment===environment&&r.population===Number(population.value));if(!r)return;
 video.pause();video.poster=r.poster;video.width=r.width;video.height=r.height;video.style.aspectRatio=`${r.width} / ${r.height}`;video.src=r.video;video.load();
 $('#gallery-title').textContent=`Performance on ${names[environment]}, N=${r.population}`;
 $('#gallery-style').textContent='Complete 2D comparison';
 $('#task-title').textContent=tasks[environment].title;$('#gallery-description').textContent=tasks[environment].description;
 $('#task-population').textContent=`${r.population} robots · one assigned goal per robot`;
 $('#gallery-caption').textContent=r.caption;$('#video-link').href=r.video;
 video.setAttribute('aria-label',r.caption);
}
function selectResults(key,n='all'){
 resultsEnvironment=key;updatePressed($('#results-tabs'),key);
 const b=results.benchmarks[key];resultPopulation.replaceChildren(new Option('All populations','all'),...b.populations.map(n=>new Option(`N=${n}`,n)));
 resultPopulation.value=b.populations.includes(Number(n))?String(n):'all';renderResults();
}
function cell(tag,text,scope){const x=document.createElement(tag);x.textContent=text??'—';if(scope)x.scope=scope;return x;}
function renderResults(){
 const b=results.benchmarks[resultsEnvironment],n=resultPopulation.value,rows=b.rows.filter(r=>n==='all'||r.population===Number(n));
 const table=document.createElement('table'),caption=document.createElement('caption');caption.textContent=`${b.name} · ${n==='all'?'All populations':`N=${n}`}`;table.append(caption);
 const head=table.createTHead().insertRow();for(const label of ['N','Method','Success','Plan (s)',...(b.quality_reported?['Path length','Acceleration']:[])])head.append(cell('th',label,'col'));
 const body=table.createTBody();let previous=null;
 for(const r of rows){const tr=body.insertRow();if(r.method.startsWith('Akule'))tr.classList.add('akule-row');if(previous!==null&&previous!==r.population)tr.classList.add('population-start');previous=r.population;
 tr.append(cell('td',r.population),cell('th',r.method,'row'),cell('td',r.success),cell('td',r.planning_seconds));
 if(r.status==='failed')tr.cells[3].title='Not reported: all runs failed';if(r.status==='timeout')tr.cells[3].title='Reported planning timeout';
 if(b.quality_reported)tr.append(cell('td',r.path_length),cell('td',r.acceleration));}
 $('#results-table').replaceChildren(table);$('#results-note').textContent=b.note;$('#results-to-gallery').hidden=n==='all';
}
population.addEventListener('change',selectVideo);resultPopulation.addEventListener('change',renderResults);
$('#gallery-to-results').addEventListener('click',()=>{if(results)selectResults(environment,population.value);});
$('#results-to-gallery').addEventListener('click',()=>{if(media.length)selectEnvironment(resultsEnvironment,resultPopulation.value);});
Promise.all([fetch('assets/media-manifest.json').then(r=>{if(!r.ok)throw Error('Media unavailable');return r.json();}),fetch('assets/benchmark-results.json').then(r=>{if(!r.ok)throw Error('Results unavailable');return r.json();})]).then(([m,r])=>{
 media=m;results=r;buttons($('#environment-tabs'),'weave',selectEnvironment);buttons($('#results-tabs'),'weave',selectResults);selectEnvironment('weave');selectResults('weave');
}).catch(()=>{$('#gallery-title').textContent='Comparison gallery unavailable';$('#gallery-caption').textContent='Reload the page or open the media manifest.';$('#results-note').textContent='Result data could not be loaded. Please reload the page.';});
const dialog=$('#figure-dialog');let figureTrigger=null;
document.querySelectorAll('.figure-open').forEach(button=>button.addEventListener('click',()=>{figureTrigger=button;$('#figure-preview').src=button.dataset.figure;$('#figure-preview').alt=button.dataset.caption;$('#figure-dialog-title').textContent=button.dataset.caption;$('#figure-original').href=button.dataset.figure;dialog.showModal();}));
$('#figure-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>figureTrigger?.focus());
$('#copy-citation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#bibtex').textContent);$('#copy-status').textContent='Citation copied.';}catch{const range=document.createRange();range.selectNodeContents($('#bibtex'));const s=window.getSelection();s.removeAllRanges();s.addRange(range);$('#copy-status').textContent='Citation selected. Use your browser’s copy command.';}});
const hero=$('#hero-video');let heroVisible=false;
new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible&&!reduced.matches&&!navigator.connection?.saveData)hero.play().catch(()=>{});else hero.pause();},{threshold:.25}).observe(hero);
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();},{threshold:.1}).observe(video);
// Both schematics share playback controls. The composer draws an exact vector sum.
const ns='http://www.w3.org/2000/svg',vectors=[[65,-20],[-25,-45],[-15,45]],colors=['#5888e0','#91abd8','#61769b','#1850a0'];
const svg=$('#composer-svg');
colors.forEach((color,i)=>{const m=document.createElementNS(ns,'marker');for(const [k,v] of Object.entries({id:`residual-arrow-${i}`,markerWidth:6,markerHeight:6,refX:5.5,refY:3,orient:'auto-start-reverse'}))m.setAttribute(k,v);const p=document.createElementNS(ns,'path');p.setAttribute('d','M0 0L6 3L0 6Z');p.setAttribute('fill',color);m.append(p);svg.querySelector('defs').append(m);});
function makeVectors(group,x){return [0,1,2,3].map(i=>{const line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:x,y1:135,stroke:colors[i],'stroke-width':i===3?3.5:2.5,'marker-end':`url(#residual-arrow-${i})`}))line.setAttribute(k,v);if(i===3)line.setAttribute('stroke-dasharray','5 3');group.append(line);return line;});}
const naive=makeVectors($('#naive-vectors'),80),weighted=makeVectors($('#weighted-vectors'),290);
function draw(lines,x,coeff){let sx=0,sy=0;vectors.forEach(([dx,dy],i)=>{const vx=dx*coeff[i],vy=dy*coeff[i];lines[i].setAttribute('x2',x+vx);lines[i].setAttribute('y2',135+vy);sx+=vx;sy+=vy;});lines[3].setAttribute('x2',x+sx);lines[3].setAttribute('y2',135+sy);}
draw(naive,80,[1,1,1]);
function compose(t){const a=[1+.3*t,1-.75*t,1-1.7*t];draw(weighted,290,a);$('#g-coefficients').querySelectorAll('span').forEach((s,i)=>{s.style.borderBottom=`2px solid ${colors[i]}`;s.textContent=`R${['₁','₂','₃'][i]} · α${['₁','₂','₃'][i]} = ${a[i]<0?'−':'+'}${Math.abs(a[i]).toFixed(2)}`;});svg.dataset.phase=t.toFixed(3);}
let paused=reduced.matches,visible=false,frame=null,start=null;
function tick(now){if(paused||!visible||document.hidden){frame=null;return;}if(start===null)start=now;const phase=((now-start)%10000)/1000;const v=phase<2?0:phase<4?(phase-2)/2:phase<8?1:1-(phase-8)/2;compose(v*v*(3-2*v));frame=requestAnimationFrame(tick);}
function motion(){document.body.classList.toggle('schematics-paused',paused||!visible||document.hidden);$('#motion-toggle').textContent=paused?'Play schematics':'Pause schematics';$('#motion-toggle').setAttribute('aria-pressed',String(paused));if(paused){compose(1);if(frame)cancelAnimationFrame(frame);frame=null;}else if(visible&&!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;start=null;motion();});new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;motion();},{threshold:.1}).observe($('.decisions'));
reduced.addEventListener('change',e=>{paused=e.matches;hero.pause();motion();});document.addEventListener('visibilitychange',()=>{if(document.hidden){hero.pause();video.pause();}motion();});compose(1);motion();
