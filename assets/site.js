(function(){
  /* mobile menu */
  const mb=document.querySelector('.menu-btn'), nav=document.querySelector('nav.main');
  if(mb&&nav) mb.addEventListener('click',()=>{const o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});

  /* videos: start automatically (muted), retry through a blob if the file fails,
     pause off-screen to save bandwidth, and keep a manual pause button on the hero */
  const vids=[...document.querySelectorAll('video[data-src]')];
  const tryPlay=v=>{ if(v.dataset.paused) return; v.muted=true; const p=v.play(); if(p&&p.catch) p.catch(()=>{}); };
  vids.forEach(v=>{
    const url=v.dataset.src; let tried=false;
    v.muted=true; v.defaultMuted=true; v.setAttribute('muted',''); v.playsInline=true;
    const viaBlob=()=>{ if(tried) return; tried=true;
      fetch(url).then(r=>r.ok?r.blob():Promise.reject()).then(b=>{v.src=URL.createObjectURL(b);tryPlay(v);}).catch(()=>{});
    };
    v.addEventListener('error',viaBlob);
    v.addEventListener('loadeddata',()=>tryPlay(v));
    v.src=url; tryPlay(v);
    setTimeout(()=>{ if(v.readyState<2) viaBlob(); },4000);
    if('IntersectionObserver' in window){
      new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) tryPlay(v); else v.pause(); }),{threshold:0.1}).observe(v);
    }
  });
  /* if the browser held autoplay back, start on the first interaction anywhere */
  const kick=()=>{ vids.forEach(v=>{ if(v.paused && v.getBoundingClientRect().bottom>0 && v.getBoundingClientRect().top<innerHeight) tryPlay(v); }); };
  ['pointerdown','keydown','scroll','touchstart'].forEach(ev=>addEventListener(ev,kick,{passive:true}));
  const pause=document.querySelector('.vctrl');
  if(pause){const v=document.querySelector('.hero video');
    pause.addEventListener('click',()=>{ if(v.paused){delete v.dataset.paused;tryPlay(v);pause.textContent='Pause video';} else {v.dataset.paused='1';v.pause();pause.textContent='Play video';} });}

  /* copy email */
  document.querySelectorAll('[data-copy]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const el=document.getElementById(btn.dataset.copy);
      const done=()=>{btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy address',1800)};
      const sel=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent='Selected, press Ctrl+C';};
      try{navigator.clipboard.writeText(el.textContent).then(done,sel)}catch(e){sel()}
    });
  });

  /* publications filter */
  const chips=[...document.querySelectorAll('.chip[data-f]')], list=document.getElementById('pubs');
  if(chips.length&&list){
    const apply=f=>{chips.forEach(c=>c.setAttribute('aria-pressed',c.dataset.f===f));list.querySelectorAll('.pub').forEach(li=>li.hidden=!(f==='all'||li.dataset.f.split(' ').includes(f)));const pc=document.getElementById('pubcount');if(pc){const n=list.querySelectorAll('.pub:not([hidden])').length;pc.textContent=n+(n===1?' paper':' papers');}try{localStorage.setItem('hcx-f',f)}catch(e){}};
    chips.forEach(c=>c.addEventListener('click',()=>apply(c.dataset.f)));
    let s='all';try{s=localStorage.getItem('hcx-f')||'all'}catch(e){}
    apply(chips.some(c=>c.dataset.f===s)?s:'all');
  }

  /* joint exceedance demo */
  const cv=document.getElementById('jp'); if(!cv) return;
  const ctx=cv.getContext('2d'), slider=document.getElementById('rho'), out=document.getElementById('rhoOut'), readout=document.getElementById('readout');
  const N=2000; let s=20171; const rnd=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646};
  const Z1=new Float32Array(N),Z2=new Float32Array(N);
  for(let i=0;i<N;i++){const u=Math.max(rnd(),1e-9),v=rnd(),r=Math.sqrt(-2*Math.log(u));Z1[i]=r*Math.cos(2*Math.PI*v);Z2[i]=r*Math.sin(2*Math.PI*v);}
  const erfc=x=>{const z=Math.abs(x),t=1/(1+.5*z);const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(.37409196+t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398+t*(1.48851587+t*(-.82215223+t*.17087277)))))))));return x>=0?r:2-r};
  const Phi=z=>.5*erfc(-z/Math.SQRT2);
  const jointSurv=(z,rho)=>{ if(rho<1e-6) return Math.pow(1-Phi(z),2);
    const q=Math.sqrt(1-rho*rho),n=500,h=(8.5-z)/n;let a=0;
    for(let i=0;i<n;i++){const t=z+(i+.5)*h;a+=Math.exp(-t*t/2)/Math.sqrt(2*Math.PI)*(1-Phi((z-rho*t)/q))*h;} return a;};
  const RP=[[2,0],[5,.8416],[10,1.2816],[20,1.6449],[100,2.3263]], Z20=1.6449, Z100=2.3263, LO=-2.6, HI=3.1;
  const tok=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let rect; const size=()=>{const r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);rect=r;};
  function draw(){
    const rho=parseFloat(slider.value); out.textContent=rho.toFixed(2);
    const W=rect.width,H=rect.height,m={l:46,r:12,t:10,b:40},pw=W-m.l-m.r,ph=H-m.t-m.b;
    const X=z=>m.l+(z-LO)/(HI-LO)*pw, Y=z=>m.t+ph-(z-LO)/(HI-LO)*ph;
    const muted=tok('--muted'),line=tok('--line'),depth=tok('--depth'),sig=tok('--signal'),sigs=tok('--signal-soft'),surf=tok('--surface');
    ctx.clearRect(0,0,W,H);ctx.fillStyle=surf;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=sigs;ctx.fillRect(X(Z20),m.t,X(HI)-X(Z20),Y(Z20)-m.t);
    ctx.font='11px "JetBrains Mono", ui-monospace, monospace';ctx.textBaseline='middle';
    RP.forEach(([T,z])=>{ctx.strokeStyle=line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(z),m.t);ctx.lineTo(X(z),m.t+ph);ctx.moveTo(m.l,Y(z));ctx.lineTo(m.l+pw,Y(z));ctx.stroke();
      ctx.fillStyle=muted;ctx.textAlign='center';ctx.fillText(T,X(z),m.t+ph+12);ctx.textAlign='right';ctx.fillText(T,m.l-6,Y(z));});
    ctx.fillStyle=muted;ctx.textAlign='center';ctx.fillText('Annual max rainfall, return period (yr)',m.l+pw/2,H-8);
    ctx.save();ctx.translate(11,m.t+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText('Storm surge, return period (yr)',0,0);ctx.restore();
    ctx.strokeStyle=sig;ctx.setLineDash([4,3]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(X(Z20),m.t);ctx.lineTo(X(Z20),m.t+ph);ctx.moveTo(m.l,Y(Z20));ctx.lineTo(m.l+pw,Y(Z20));ctx.stroke();ctx.setLineDash([]);
    const q=Math.sqrt(1-rho*rho);let hits=0;const joint=[];ctx.globalAlpha=.42;ctx.fillStyle=depth;
    for(let i=0;i<N;i++){const a=Z1[i],b=rho*Z1[i]+q*Z2[i];if(a<LO||a>HI||b<LO||b>HI)continue;if(a>Z20&&b>Z20){hits++;joint.push([a,b]);continue;}ctx.beginPath();ctx.arc(X(a),Y(b),1.8,0,7);ctx.fill();}
    ctx.globalAlpha=1;ctx.fillStyle=sig;joint.forEach(([a,b])=>{ctx.beginPath();ctx.arc(X(a),Y(b),3.2,0,7);ctx.fill();});
    ctx.strokeStyle=line;ctx.strokeRect(m.l+.5,m.t+.5,pw-1,ph-1);
    ctx.fillStyle=sig;ctx.textAlign='right';ctx.textBaseline='top';ctx.font='600 11px "Public Sans", system-ui, sans-serif';ctx.fillText('both above 20-yr',m.l+pw-6,Y(Z20)+5);
    const T=1/jointSurv(Z100,rho),fmt=v=>v>=1000?Math.round(v/100)*100:Math.round(v/10)*10,expd=Math.round(2000*jointSurv(Z20,rho));
    readout.innerHTML=rho<0.025
      ?`In this sample, <strong>${hits}</strong> of 2,000 years exceed the 20-year level for both drivers (5 expected). With no dependence, a year with both 100-year rain and 100-year surge is a <strong>1-in-10,000</strong> event. Move the slider to see what shared storms do.`
      :`In this sample, <strong>${hits}</strong> of 2,000 years exceed the 20-year level for both rain and surge (about ${expd} expected at this ρ, 5 if independent). Theory puts a year with <em>both</em> 100-year rain and 100-year surge at roughly <strong>1-in-${fmt(T).toLocaleString()}</strong>, not 1-in-10,000.`;
  }
  size();
  slider.addEventListener('input',draw);
  new ResizeObserver(()=>{size();draw();}).observe(cv);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',draw);
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw);
  draw();
})();
