'use strict';
// Reassert the document title when a browser restores a cached page.
const pageTitle=document.head.querySelector('title').textContent;
document.title=pageTitle;
window.addEventListener('pageshow',()=>{document.title=pageTitle;});
const names={weave:'Canonical Weave',highways:'Highways',conveyor:'Conveyor',basic:'SMD Basic',dense:'SMD Dense',shelf:'SMD Shelf',room:'SMD Room',scaledweave:'ScaledWeave'};
const $=s=>document.querySelector(s);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const tasks={
  "weave": {
    "title": "Exchange positions across an open square",
    "description": "Robots start near the four sides of an obstacle-free square and move to assigned goals on the opposite side. Horizontal and vertical flows cross in the shared interior, requiring collision-free coordination."
  },
  "highways": {
    "title": "Move anticlockwise around the central obstacle",
    "description": "Reach assigned goals while following an anticlockwise motion pattern around the central obstacle. Robots must avoid the fixed obstacles and one another as they merge into and share the surrounding passages."
  },
  "conveyor": {
    "title": "Traverse a corridor in its prescribed direction",
    "description": "Each robot must traverse either the upper corridor from right to left or the lower corridor from left to right before reaching its assigned goal. Narrow entrances and shared passages require coordinated obstacle and robot avoidance."
  },
  "basic": {
    "title": "Reach assigned goals among scattered obstacles",
    "description": "Navigate from individual starts to assigned goals in a workspace with 10 scattered circular obstacles. Trajectories must avoid both the static obstacles and other robots."
  },
  "dense": {
    "title": "Coordinate through a dense obstacle field",
    "description": "Reach assigned goals among 20 circular obstacles. The denser layout restricts free space and passing opportunities, so robots must coordinate their routes while avoiding obstacles and one another."
  },
  "shelf": {
    "title": "Navigate the aisles around shelf-like structures",
    "description": "Move from individual starts to assigned goals through a repeated shelf-like obstacle layout. Robots must share the aisles and route around shelf ends without colliding with the structures or one another."
  },
  "room": {
    "title": "Pass through openings between room-like regions",
    "description": "Reach assigned goals in a workspace divided by wall-like obstacle structures. Robots must use the connecting openings and coordinate through these bottlenecks while avoiding obstacles and one another."
  },
  "scaledweave": {
    "title": "Exchange positions with a larger robot team",
    "description": "Robots exchange positions between opposite sides of an open square, creating intersecting horizontal and vertical flows. The geometry expands with population to keep start and goal configurations separated, while robot size remains fixed."
  }
};
const posterCache=new Map();
let media=[],results=null,environment='weave',resultsEnvironment='weave';
const population=$('#population'),resultPopulation=$('#results-population');
let video=$('#gallery-video');
function buttons(container,selected,callback){
 container.replaceChildren(...Object.entries(names).map(([key,name])=>{const b=document.createElement('button');b.type='button';b.dataset.env=key;b.textContent=name;b.setAttribute('aria-pressed',String(key===selected));b.addEventListener('click',()=>callback(key));return b;}));
}
function updatePressed(container,env){container.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.env===env)));}
function selectEnvironment(key,n){
 environment=key;updatePressed($('#environment-tabs'),key);
 const values=media.filter(r=>r.environment===key).map(r=>r.population).sort((a,b)=>a-b);
 population.replaceChildren(...values.map(n=>new Option(`${n} robots`,n)));
 population.value=String(values.includes(Number(n))?n:values.at(-1));selectVideo();
}
function selectVideo(){
 const r=media.find(r=>r.environment===environment&&r.population===Number(population.value));if(!r)return;
 // A fresh media element prevents stale playback/control state after source changes.
 video.pause();video.removeAttribute('src');
 const next=document.createElement('video');next.id='gallery-video';next.muted=true;next.defaultMuted=true;next.loop=true;next.playsInline=true;next.preload='none';next.poster=r.poster;next.width=r.width;next.height=r.height;next.style.aspectRatio=`${r.width} / ${r.height}`;next.src=r.video;
 const start=document.createElement('button');start.type='button';start.className='comparison-start';start.setAttribute('aria-label',`Play ${names[environment]} comparison with ${r.population} robots`);
 const poster=document.createElement('img');poster.src=r.poster;poster.alt=`${names[environment]}, ${r.population} robots: ${r.methods.join(', ')} comparison preview`;poster.width=r.width;poster.height=r.height;poster.decoding='async';
 const badge=document.createElement('span');badge.className='comparison-play';badge.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4L21 12L8 20Z" fill="currentColor"/></svg><span>Play comparison</span>';
 start.append(poster,badge);
 const status=document.createElement('span');status.className='comparison-status';status.setAttribute('role','status');
 const frame=$('#comparison-frame');frame.style.aspectRatio=`${r.width} / ${r.height}`;frame.replaceChildren(next,start,status);video=next;
 function retry(){if(video!==next)return;next.pause();next.controls=false;start.hidden=false;start.disabled=false;badge.querySelector('span').textContent='Play comparison';status.textContent='Could not start playback. Try again or open the full-resolution clip.';}
 start.addEventListener('click',()=>{if(video!==next)return;start.disabled=true;status.textContent='';badge.querySelector('span').textContent='Loading comparison…';next.play().catch(retry);});
 next.addEventListener('playing',()=>{if(video!==next)return;start.hidden=true;next.controls=true;status.textContent='';});
 next.addEventListener('error',retry);
 // Cache only the small posters for the active environment; videos remain on demand.
 for(const item of media.filter(item=>item.environment===environment)){if(!posterCache.has(item.poster)){const img=new Image();img.src=item.poster;posterCache.set(item.poster,img);}}
 $('#gallery-title').textContent=`Performance on ${names[environment]}, N=${r.population}`;
 $('#task-title').textContent=tasks[environment].title;$('#gallery-description').textContent=tasks[environment].description;
 $('#task-population').textContent=`${r.population} robots · one assigned goal per robot`;
 $('#gallery-caption').textContent=r.methods.join(' · ');$('#video-link').href=r.video;
 video.setAttribute('aria-label',r.caption);
}
function selectResults(key,n='all'){
 resultsEnvironment=key;updatePressed($('#results-tabs'),key);
 const b=results.benchmarks[key];resultPopulation.replaceChildren(new Option('All populations','all'),...b.populations.map(n=>new Option(`${n} robots`,n)));
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
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();},{threshold:.1}).observe($('.gallery-player'));
// Both schematics share playback controls. The composer draws an exact vector sum.
const ns='http://www.w3.org/2000/svg',vectors=[[65,-20],[-25,-45],[-15,45]],colors=['#5888e0','#91abd8','#61769b','#1850a0'];
const svg=$('#composer-svg');
colors.forEach((color,i)=>{const m=document.createElementNS(ns,'marker');for(const [k,v] of Object.entries({id:`residual-arrow-${i}`,markerWidth:6,markerHeight:6,refX:5.5,refY:3,orient:'auto-start-reverse'}))m.setAttribute(k,v);const p=document.createElementNS(ns,'path');p.setAttribute('d','M0 0L6 3L0 6Z');p.setAttribute('fill',color);m.append(p);svg.querySelector('defs').append(m);});
function makeVectors(group,x){return [0,1,2,3].map(i=>{const line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:x,y1:135,stroke:colors[i],'stroke-width':i===3?3.5:2.5,'marker-end':`url(#residual-arrow-${i})`}))line.setAttribute(k,v);if(i===3)line.setAttribute('stroke-dasharray','5 3');group.append(line);return line;});}
const naive=makeVectors($('#naive-vectors'),80),weighted=makeVectors($('#weighted-vectors'),290);
function draw(lines,x,coeff){let sx=0,sy=0;vectors.forEach(([dx,dy],i)=>{const vx=dx*coeff[i],vy=dy*coeff[i];lines[i].setAttribute('x2',x+vx);lines[i].setAttribute('y2',135+vy);sx+=vx;sy+=vy;});lines[3].setAttribute('x2',x+sx);lines[3].setAttribute('y2',135+sy);}
draw(naive,80,[1,1,1]);
function compose(t){const a=[1+.3*t,1-.75*t,1-1.7*t];draw(weighted,290,a);$('#g-stage').textContent=t<.05?'Uniform contributions':t<.95?'Applying contextual weights':'Amplify · attenuate · reverse';$('#g-coefficients').querySelectorAll('span').forEach((s,i)=>{s.style.borderBottom=`2px solid ${colors[i]}`;s.textContent=`R${['₁','₂','₃'][i]} · α${['₁','₂','₃'][i]} = ${a[i]<0?'−':'+'}${Math.abs(a[i]).toFixed(2)}`;});svg.dataset.phase=t.toFixed(3);}
// Schematic robot states and directed supports; no benchmark trajectories are used.
const uSVG=$('#selector-svg'),uCandidates=$('#u-candidates'),uSupport=$('#u-support'),uRobots=$('#u-robots');
const uBase=[[45,99],[137,48],[278,46],[374,99],[279,149],[137,151]];
const uStates=[[[0,1],[1,2],[3,4],[4,5],[5,0]],[[0,5],[1,5],[2,3],[3,4],[5,4]],[[0,1],[1,5],[2,1],[3,2],[4,3]]];
function uEl(tag,attrs,parent){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;}
const candidates=[];
for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)candidates.push([i,j,uEl('line',{},uCandidates)]);
const supports=[];
for(let i=0;i<6;i++)for(let j=0;j<6;j++)if(i!==j){const line=uEl('line',{'marker-end':'url(#selector-arrow)'},uSupport);const dot=uEl('circle',{r:2.5,fill:'#1850a0'},uSupport);supports.push({i,j,line,dot});}
const robots=uBase.map((_,i)=>{const halo=uEl('circle',{r:17,class:'robot-halo'},uRobots);const disk=uEl('circle',{r:9,class:'robot-disk'},uRobots);const label=uEl('text',{'text-anchor':'middle',class:'robot-label'},uRobots);label.textContent=String(i+1);return {halo,disk,label};});
function selectGraph(seconds){
 const cycle=seconds%12,epoch=Math.floor(seconds/12)%3,selected=uStates[epoch],fade=cycle<1.5?cycle/1.5:cycle>10.5?(12-cycle)/1.5:1;
 const points=uBase.map(([x,y],i)=>[x+Math.sin(seconds*.35+i)*5,y+Math.cos(seconds*.3+i*.8)*5]);
 for(const [i,j,l] of candidates){l.setAttribute('x1',points[i][0]);l.setAttribute('y1',points[i][1]);l.setAttribute('x2',points[j][0]);l.setAttribute('y2',points[j][1]);}
 supports.forEach(({i,j,line,dot})=>{const enabled=selected.some(([a,b])=>a===i&&b===j),[x,y]=points[i],[xx,yy]=points[j],d=Math.hypot(xx-x,yy-y),dx=(xx-x)/d,dy=(yy-y)/d;
  line.setAttribute('x1',x+dx*13);line.setAttribute('y1',y+dy*13);line.setAttribute('x2',xx-dx*15);line.setAttribute('y2',yy-dy*15);line.style.opacity=enabled?fade:0;
  const flow=(seconds*.45+i*.17)%1;dot.setAttribute('cx',x+dx*13+(xx-x-dx*28)*flow);dot.setAttribute('cy',y+dy*13+(yy-y-dy*28)*flow);dot.style.opacity=enabled&&cycle>3&&cycle<10?fade:0;
 });
 robots.forEach(({halo,disk,label},i)=>{const [x,y]=points[i];for(const e of [halo,disk]){e.setAttribute('cx',x);e.setAttribute('cy',y);}halo.style.opacity=selected.some(([a])=>a===i)?(.18+.12*Math.sin(seconds*1.2+i)**2)*fade:0;label.setAttribute('x',x);label.setAttribute('y',y+3.5);});
 $('#u-stage').textContent=cycle<1.5?'Score candidate pairs':cycle<3?'Select directed interactions':'Evaluate R on selected pairs';uSVG.dataset.support=String(epoch);uSVG.dataset.phase=cycle.toFixed(3);
}
let paused=reduced.matches,visible=false,frame=null,start=null;
function tick(now){if(paused||!visible||document.hidden){frame=null;return;}if(start===null)start=now;const phase=((now-start)%10000)/1000;const v=phase<2?0:phase<4?(phase-2)/2:phase<8?1:1-(phase-8)/2;compose(v*v*(3-2*v));selectGraph((now-start)/1000);frame=requestAnimationFrame(tick);}
function motion(){document.body.classList.toggle('schematics-paused',paused||!visible||document.hidden);$('#motion-toggle').textContent=paused?'Play schematics':'Pause schematics';$('#motion-toggle').setAttribute('aria-pressed',String(paused));if(paused){compose(1);selectGraph(6);if(frame)cancelAnimationFrame(frame);frame=null;}else if(visible&&!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;start=null;motion();});new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;motion();},{threshold:.1}).observe($('.decisions'));
reduced.addEventListener('change',e=>{paused=e.matches;hero.pause();motion();});document.addEventListener('visibilitychange',()=>{if(document.hidden){hero.pause();video.pause();}motion();});compose(1);selectGraph(6);motion();
