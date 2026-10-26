(function(){
  /* Probability of working, two-hour steps 0..42 h, read approximately from
     Bakhtiari, Najafi, Goda and Peerhossaini (2025), Reliability Engineering and System Safety. */
  const D={
    fac:[1,.895,.715,.5,.3,.15,.06,.02,.005,0,.13,.345,.575,.765,.89,.955,.985,.995,.998,1,1,1],
    air:[.97,.78,.495,.24,.085,.02,.003,0,0,0,0,.04,.185,.435,.69,.855,.93,.96,.967,.97,.97,.97],
    road:[.99,.99,.99,.4,.4,.4,.4,.4,.4,.4,.4,.4,.55,.55,.55,.7,.7,.7,.85,.85,.85,.85],
    tour:[.95,.76,.485,.095,.035,.01,0,0,0,0,0,.015,.1,.235,.37,.585,.64,.66,.805,.808,.808,.81]
  };
  const NAMES={fac:'Airport facilities',air:'Airport operations',road:'Inter-city road',tour:'Tourism'};
  const cv=document.getElementById('xc'); if(!cv) return;
  const ctx=cv.getContext('2d'), sl=document.getElementById('xt'), out=document.getElementById('xh'),
        btn=document.getElementById('xplay'), st=document.getElementById('xstate'), leg=document.getElementById('xleg');
  const tok=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const col=()=>({fac:tok('--depth'),air:tok('--ink'),road:tok('--slate'),tour:tok('--coral')});
  const pct=v=>Math.round(v*100)+'%';
  function legend(){const c=col();leg.innerHTML=Object.keys(D).map(k=>`<span><i style="background:${c[k]}"></i>${NAMES[k]}</span>`).join('');}

  function msg(i){
    const h=i*2;
    if(h===0) return 'Hour 0. Everything is working. Flood water starts to reach the airfield.';
    if(h<6) return `Hour ${h}. The runway, taxiway and apron are flooding. Airport operations are already falling faster than the facilities themselves, because they need all of them at once.`;
    if(h<12) return `Hour ${h}. The inter-city road is disrupted at hour 6. Airport operations are close to a standstill, and tourism drops sharply because visitors can neither fly nor travel by road.`;
    if(h<20) return `Hour ${h}. The low point. Facilities, airport operations and tourism are all effectively down.`;
    if(h<26) return `Hour ${h}. Water recedes and the airfield comes back first. Airport operations lag a few hours behind their facilities.`;
    if(h<34) return `Hour ${h}. The airport is largely back in service. Tourism is still recovering, held back by the partly reopened road.`;
    return `Hour ${h}. Facilities are fully back and airport operations near normal, but tourism and the road have still not fully recovered after ${h} hours.`;
  }

  let rect;
  const size=()=>{const r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);rect=r;};
  function draw(i){
    const W=rect.width,H=rect.height,m={l:40,r:10,t:10,b:34},pw=W-m.l-m.r,ph=H-m.t-m.b;
    const X=h=>m.l+h/42*pw, Y=p=>m.t+(1-p)*ph, c=col();
    ctx.clearRect(0,0,W,H); ctx.fillStyle=tok('--surface'); ctx.fillRect(0,0,W,H);
    ctx.font='11px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle=tok('--muted'); ctx.strokeStyle=tok('--line'); ctx.lineWidth=1;
    ctx.textBaseline='middle';
    [0,.25,.5,.75,1].forEach(p=>{ctx.beginPath();ctx.moveTo(m.l,Y(p));ctx.lineTo(m.l+pw,Y(p));ctx.stroke();ctx.textAlign='right';ctx.fillText(pct(p),m.l-6,Y(p));});
    ctx.textAlign='center';
    for(let h=0;h<=42;h+=6){ctx.fillText(h,X(h),m.t+ph+12);}
    ctx.fillText('Hours since flooding began',m.l+pw/2,H-7);
    ctx.fillStyle=tok('--signal-soft'); ctx.globalAlpha=.7; ctx.fillRect(X(0),m.t,X(i*2)-X(0),ph); ctx.globalAlpha=1;
    Object.keys(D).forEach(k=>{
      ctx.strokeStyle=c[k]; ctx.lineWidth=k==='tour'?2.6:2; ctx.setLineDash(k==='road'?[5,4]:[]);
      ctx.beginPath(); D[k].forEach((v,j)=>{const x=X(j*2),y=Y(v); j?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=c[k]; ctx.beginPath(); ctx.arc(X(i*2),Y(D[k][i]),4.2,0,7); ctx.fill();
    });
    ctx.strokeStyle=tok('--signal'); ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(X(i*2),m.t); ctx.lineTo(X(i*2),m.t+ph); ctx.stroke();
  }
  function update(i){
    out.textContent='Hour '+(i*2);
    document.querySelectorAll('#net .node[data-s]').forEach(n=>{
      const v=D[n.dataset.s][i]; n.querySelector('.bar i').style.width=(v*100)+'%';
      n.querySelector('.pv').textContent=pct(v)+' likely working'; n.classList.toggle('down',v<.5);
    });
    const facDown=D.fac[i]<.5;
    document.querySelectorAll('#net .node[data-p]').forEach(n=>{n.classList.toggle('path',facDown);n.querySelector('.pv').textContent=facDown?'In failure pathway':'Supported';});
    const road=document.querySelector('[data-hz-road]'); if(road) road.textContent=i*2>=6?'Active since hour 6':'Starts at hour 6';
    document.querySelector('#net [data-k="hzR"]').style.opacity=i*2>=6?1:.5;
    st.textContent=msg(i); draw(i);
  }
  let timer=null;
  const stop=()=>{clearInterval(timer);timer=null;btn.textContent='Play';};
  btn.addEventListener('click',()=>{
    if(timer){stop();return;}
    if(+sl.value>=21) sl.value=0;
    btn.textContent='Pause';
    timer=setInterval(()=>{const v=+sl.value+1; if(v>21){stop();return;} sl.value=v; update(v);},700);
  });
  sl.addEventListener('input',()=>{stop();update(+sl.value);});
  size(); legend(); update(0);
  new ResizeObserver(()=>{size();draw(+sl.value);}).observe(cv);
  const redraw=()=>{legend();draw(+sl.value);};
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redraw);
  new MutationObserver(redraw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(redraw);
})();
