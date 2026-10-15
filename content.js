(() => {
  if (window.__xClickLoaded) return;
  window.__xClickLoaded = true;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modes = ['classic', 'alt', 'rotate'];
  const state = {
    fxEnabled: true,
    soundEnabled: !reduceMotion,
    soundVolume: 0.15,
    visualMode: 'rotate',
    soundMode: 'rotate'
  };
  const rotation = {
    visual: { like: 0, follow: 0, reply: 0 },
    sound: { like: 0, follow: 0, reply: 0 }
  };
  const style = document.createElement('style');
  style.textContent = `
  #xp-fx-layer{position:fixed;inset:0;z-index:2147483647;pointer-events:none;overflow:hidden;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .xp-fx{position:fixed;pointer-events:none;transform:translate(-50%,-50%);font-weight:900;white-space:nowrap}
  .xp-label{font-size:10px;letter-spacing:1.5px;color:#eaffff;text-shadow:0 0 7px #00f6ff,0 0 16px #00f6ff,2px 0 #ff2bd6}
  .xp-xglyph{font-size:30px;font-style:italic;color:#fff;text-shadow:0 0 6px #fff,0 0 14px #00f6ff,0 0 26px #00f6ff,2px 2px #ff2bd6}
  .xp-ring{position:fixed;border:2px solid #00f6ff;border-radius:50%;box-shadow:0 0 9px #00f6ff,inset 0 0 8px #00f6ff}
  .xp-particle{position:fixed;width:5px;height:5px;background:#00f6ff;box-shadow:0 0 8px #00f6ff,0 0 14px #ff2bd6;transform:translate(-50%,-50%) rotate(45deg)}
  .xp-heart{font-size:24px;color:#ff2bd6;text-shadow:0 0 7px #ff2bd6,0 0 18px #ff2bd6}
  .xp-glitch{font-size:11px;letter-spacing:1.5px;color:#fff;text-shadow:2px 0 #ff2bd6,-2px 0 #00f6ff}
  .xp-scan{position:fixed;height:2px;background:linear-gradient(90deg,transparent,#00f6ff,#ff2bd6,transparent);box-shadow:0 0 12px #00f6ff}
  @keyframes xp-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.25) rotate(-12deg)}22%{opacity:1;transform:translate(-50%,-65%) scale(1.12) rotate(3deg)}70%{opacity:1;transform:translate(-50%,-90%) scale(1)}100%{opacity:0;transform:translate(-50%,-145%) scale(.8)}}
  @keyframes xp-ring{0%{opacity:1;transform:translate(-50%,-50%) scale(.25)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.8)}}
  @keyframes xp-particle{0%{opacity:1;transform:translate(-50%,-50%) rotate(45deg) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(225deg) scale(.1)}}
  @keyframes xp-heart{0%{opacity:0;transform:translate(-50%,-50%) scale(.2) rotate(-18deg)}35%{opacity:1;transform:translate(-50%,-75%) scale(1.3) rotate(8deg)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),-135%) scale(.7) rotate(20deg)}}
  @keyframes xp-scan{0%{opacity:0;transform:translateX(-25%) scaleX(.2)}20%{opacity:1}100%{opacity:0;transform:translateX(25%) scaleX(1.2)}}
  @keyframes xp-glitch{0%,100%{opacity:0;transform:translate(-50%,-50%) skewX(0) scale(.8)}15%,65%{opacity:1;transform:translate(-50%,-65%) skewX(-9deg) scale(1)}30%{transform:translate(calc(-50% + 3px),-68%) skewX(8deg)}50%{transform:translate(calc(-50% - 2px),-75%) skewX(-4deg)}}
  @media(prefers-reduced-motion:reduce){.xp-fx,.xp-ring,.xp-particle,.xp-scan{animation-duration:.01ms!important;animation-iteration-count:1!important}}
  `;
  document.documentElement.appendChild(style);
  const layer = document.createElement('div'); layer.id = 'xp-fx-layer'; document.documentElement.appendChild(layer);
  const visible = el => { const r=el.getBoundingClientRect(); return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth; };
  const add = (node, duration) => { layer.appendChild(node); setTimeout(()=>node.remove(), duration+80); };
  const pickVariant = (mode, bucket, kind, count) => {
    if (count <= 1) return 0;
    if (mode === 'classic') return 0;
    if (mode === 'alt') return Math.min(1, count - 1);
    const next = rotation[bucket][kind] % count;
    rotation[bucket][kind] += 1;
    return next;
  };
  const clampMode = value => modes.includes(value) ? value : 'rotate';
  const applyStoredState = res => {
    if (typeof res.xc_fx_enabled === 'boolean') state.fxEnabled = res.xc_fx_enabled;
    if (typeof res.xc_sound_enabled === 'boolean') state.soundEnabled = res.xc_sound_enabled;
    else if (typeof res.np_sound_enabled === 'boolean') state.soundEnabled = res.np_sound_enabled;
    if (typeof res.xc_sound_volume === 'number') state.soundVolume = Math.min(1, Math.max(0, res.xc_sound_volume));
    else if (typeof res.np_sound_volume === 'number') state.soundVolume = Math.min(1, Math.max(0, res.np_sound_volume));
    state.visualMode = clampMode(res.xc_visual_mode);
    state.soundMode = clampMode(res.xc_sound_mode);
  };

  try {
    chrome.storage.local.get([
      'xc_fx_enabled',
      'xc_visual_mode',
      'xc_sound_enabled',
      'xc_sound_volume',
      'xc_sound_mode',
      'np_sound_enabled',
      'np_sound_volume'
    ], res => applyStoredState(res));
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.xc_fx_enabled) state.fxEnabled = !!changes.xc_fx_enabled.newValue;
      if (changes.xc_visual_mode) state.visualMode = clampMode(changes.xc_visual_mode.newValue);
      if (changes.xc_sound_enabled) state.soundEnabled = !!changes.xc_sound_enabled.newValue;
      if (changes.xc_sound_volume) state.soundVolume = Math.min(1, Math.max(0, changes.xc_sound_volume.newValue));
      if (changes.xc_sound_mode) state.soundMode = clampMode(changes.xc_sound_mode.newValue);
    });
  } catch (_) { /* chrome.storage unavailable */ }

  // ── Sound module (Web Audio API, lazily initialized) ──────────────────────
  const Sound = (() => {
    let ctx = null;
    let master = null;

    const ensureCtx = () => {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = state.soundVolume;
      master.connect(ctx.destination);
      return ctx;
    };

    // A tiny synth voice: osc → gain envelope → master
    const tone = ({ type = 'sine', f0 = 440, f1 = null, t = 0, dur = 0.15, vol = 1, curve = 'exp' }) => {
      const c = ensureCtx(); if (!c) return;
      if (c.state === 'suspended') c.resume();
      master.gain.value = state.soundVolume;
      const osc = c.createOscillator();
      const g = c.createGain();
      const t0 = c.currentTime + t;
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t0);
      if (f1 !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      if (curve === 'exp') {
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      } else {
        g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
        g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      }
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    };

    // Short noise burst (for glitch / scanline texture)
    const noise = ({ t = 0, dur = 0.08, vol = 0.6, hp = 1500 }) => {
      const c = ensureCtx(); if (!c) return;
      if (c.state === 'suspended') c.resume();
      master.gain.value = state.soundVolume;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(); src.buffer = buf;
      const filt = c.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = hp;
      const g = c.createGain();
      const t0 = c.currentTime + t;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filt); filt.connect(g); g.connect(master);
      src.start(t0);
    };

    const variants = {
      like: [
        () => {
          tone({ type: 'sine', f0: 720, f1: 1440, dur: 0.16, vol: 0.9 });
          tone({ type: 'sine', f0: 1440, f1: 2160, t: 0.02, dur: 0.12, vol: 0.25 });
        },
        () => {
          tone({ type: 'triangle', f0: 540, f1: 1180, dur: 0.12, vol: 0.75 });
          tone({ type: 'triangle', f0: 810, f1: 1620, t: 0.04, dur: 0.18, vol: 0.22 });
        }
      ],
      follow: [
        () => {
          tone({ type: 'square', f0: 660, dur: 0.07, vol: 0.35 });
          tone({ type: 'square', f0: 990, t: 0.08, dur: 0.12, vol: 0.3 });
        },
        () => {
          tone({ type: 'sawtooth', f0: 520, dur: 0.06, vol: 0.22 });
          tone({ type: 'sine', f0: 780, t: 0.05, dur: 0.11, vol: 0.24 });
          tone({ type: 'sine', f0: 1040, t: 0.11, dur: 0.13, vol: 0.2 });
        }
      ],
      reply: [
        () => {
          noise({ dur: 0.07, vol: 0.5, hp: 2000 });
          tone({ type: 'sine', f0: 180, f1: 60, t: 0.03, dur: 0.18, vol: 0.7 });
        },
        () => {
          noise({ dur: 0.05, vol: 0.35, hp: 2600 });
          noise({ t: 0.03, dur: 0.04, vol: 0.25, hp: 3200 });
          tone({ type: 'triangle', f0: 220, f1: 90, t: 0.02, dur: 0.16, vol: 0.45 });
        }
      ]
    };

    const play = kind => {
      if (!state.fxEnabled || !state.soundEnabled || state.soundVolume <= 0) return;
      try {
        const list = variants[kind] || [];
        if (!list.length) return;
        list[pickVariant(state.soundMode, 'sound', kind, list.length)]();
      } catch (_) { /* never break FX if audio fails */ }
    };

    return { play };
  })();
  // ── End sound module ──────────────────────────────────────────────────────
  const Effects = { isEnabled: () => state.fxEnabled };
  function ring(x,y,color='#00f6ff',duration=650,size=24){const n=document.createElement('div');n.className='xp-ring';Object.assign(n.style,{left:x+'px',top:y+'px',width:size+'px',height:size+'px',borderColor:color,boxShadow:`0 0 9px ${color},inset 0 0 8px ${color}`,animation:`xp-ring ${duration}ms ease-out forwards`});add(n,duration);}
  function burst(x,y,count=12){if(reduceMotion)return;for(let i=0;i<count;i++){const n=document.createElement('div');n.className='xp-particle';const a=2*Math.PI*i/count+Math.random()*.25,d=22+Math.random()*40;n.style.left=x+'px';n.style.top=y+'px';n.style.background=i%3===0?'#ff2bd6':'#00f6ff';n.style.setProperty('--dx',Math.cos(a)*d+'px');n.style.setProperty('--dy',Math.sin(a)*d+'px');const t=420+Math.random()*280;n.style.animation=`xp-particle ${t}ms ease-out forwards`;add(n,t);}}
  function text(value,x,y,cls='xp-label',duration=850){const n=document.createElement('div');n.className='xp-fx '+cls;n.textContent=value;n.style.left=x+'px';n.style.top=y+'px';n.style.animation=`xp-${cls==='xp-glitch'?'glitch':'pop'} ${duration}ms cubic-bezier(.2,.8,.2,1) forwards`;add(n,duration);}
  function heart(x,y,dx,duration=900,color='#ff2bd6'){const h=document.createElement('div');h.className='xp-fx xp-heart';h.textContent='♥';h.style.left=x+'px';h.style.top=y+'px';h.style.color=color;h.style.textShadow=`0 0 7px ${color},0 0 18px ${color}`;h.style.setProperty('--dx',dx+'px');h.style.animation=`xp-heart ${duration}ms ease-out forwards`;add(h,duration);}
  const visualVariants = {
    like: [
      r => {const x=r.left+r.width/2,y=r.top+r.height/2;ring(x,y,'#ff2bd6',560);ring(x,y,'#00f6ff',760);burst(x,y,13);heart(x,y,Math.random()>.5?25:-25,900,'#ff2bd6');text('♥ LIKED',x+28,y-8);},
      r => {const x=r.left+r.width/2,y=r.top+r.height/2;ring(x,y,'#7cf7ff',620,20);ring(x,y,'#ff2bd6',860,34);burst(x,y,18);heart(x-10,y-2,-32,820,'#7cf7ff');heart(x+10,y-4,32,980,'#ff2bd6');text('HEART LINKED',x+22,y-10,'xp-label',920);}
    ],
    follow: [
      r => {const x=r.left+r.width/2,y=r.top+r.height/2;ring(x,y,'#00f6ff',680,28);ring(x,y,'#ff2bd6',900,28);burst(x,y,16);text('＋ FOLLOWING',x+26,y-4,'xp-label',950);},
      r => {const x=r.left+r.width/2,y=r.top+r.height/2;ring(x,y,'#7cf7ff',500,18);ring(x,y,'#00f6ff',760,26);ring(x,y,'#ff2bd6',980,38);burst(x,y,12);text('LOCKED ON',x+18,y-8,'xp-label',900);text('X',x-24,y-24,'xp-xglyph',700);}
    ],
    reply: [
      r => {const x=r.left+r.width/2,y=r.top+r.height/2;ring(x,y,'#00f6ff',680,26);burst(x,y,9);const scan=document.createElement('div');scan.className='xp-fx xp-scan';scan.style.left=Math.max(8,x-76)+'px';scan.style.top=y+'px';scan.style.width='152px';scan.style.animation='xp-scan 650ms ease-out forwards';add(scan,650);text('↳ SIGNAL SENT',x+10,y-7,'xp-glitch',850);text('N',x-28,y-27,'xp-xglyph',650);},
      r => {const x=r.left+r.width/2,y=r.top+r.height/2;ring(x,y,'#ff2bd6',760,30);ring(x,y,'#00f6ff',540,18);burst(x,y,14);const scanTop=document.createElement('div');scanTop.className='xp-fx xp-scan';scanTop.style.left=Math.max(8,x-68)+'px';scanTop.style.top=(y-10)+'px';scanTop.style.width='136px';scanTop.style.animation='xp-scan 520ms ease-out forwards';add(scanTop,520);const scanBottom=document.createElement('div');scanBottom.className='xp-fx xp-scan';scanBottom.style.left=Math.max(8,x-68)+'px';scanBottom.style.top=(y+10)+'px';scanBottom.style.width='136px';scanBottom.style.animation='xp-scan 700ms ease-out forwards';add(scanBottom,700);text('REPLY UPLINK',x+18,y-10,'xp-glitch',920);text('X',x-22,y-25,'xp-xglyph',720);}
    ]
  };
  function emit(kind, button){if(!button||!visible(button)||Date.now()-last<120)return;last=Date.now();const list=visualVariants[kind]||[];const variant=list[pickVariant(state.visualMode,'visual',kind,list.length)];if(!variant)return;variant(button.getBoundingClientRect());Sound.play(kind);}
  function describeButton(button){if(!button)return { tid:'', text:'' };const tid=(button.getAttribute('data-testid')||'').toLowerCase();const text=[button.getAttribute('aria-label'),tid,button.getAttribute('title'),button.innerText].filter(Boolean).join(' ').toLowerCase().replace(/\s+/g,' ').trim();return { tid, text };}
  function classifyButton(button){if(!(button instanceof Element)||!visible(button))return null;const { tid, text } = describeButton(button);if(/unlike|remove like/.test(text))return null;if(/(^|[\s_-])(like|favorite)([\s_-]|$)/.test(text)||/like this (post|tweet)/.test(text)||tid==='like')return {type:'like',button};if(/(^|[\s_-])follow([\s_-]|$)/.test(text)||/follow back/.test(text)||tid==='follow')return {type:'follow',button};if(/(^|[\s_-])(reply|replies)([\s_-]|$)|回复/.test(text)||/^tweetbutton(inline)?$/.test(tid)&&/reply|回复/.test(text)||tid==='reply')return {type:'reply',button};return null;}
  function detect(target){if(!(target instanceof Element))return null;let button=target.closest('button,[role="button"]');if(!button){const testNode=target.closest('[data-testid]');if(testNode){button=testNode.closest('button,[role="button"]');if(!button&&/^(like|reply|follow|tweetbutton|tweetbuttoninline)$/.test((testNode.getAttribute('data-testid')||'').toLowerCase()))button=testNode;}}return classifyButton(button);}
  const contextSelector='article,[data-testid="cellInnerDiv"],[role="dialog"],main,section';
  let lastPointerTarget=null;
  function isEditable(target){if(!(target instanceof Element))return false;const tag=target.tagName;return target.isContentEditable||tag==='INPUT'||tag==='TEXTAREA'||target.getAttribute('role')==='textbox';}
  function uniqueRoots(){const roots=[];const push=root=>{if(root&& !roots.includes(root))roots.push(root);};if(document.activeElement instanceof Element)push(document.activeElement.closest(contextSelector));if(lastPointerTarget instanceof Element)push(lastPointerTarget.closest(contextSelector));document.querySelectorAll('[role="dialog"] article, article, [data-testid="cellInnerDiv"]').forEach((root, index)=>{if(index<10)push(root);});push(document.querySelector('main'));return roots.filter(Boolean);}
  function findButtonIn(root, kind){if(!(root instanceof Element))return null;const nodes=root.querySelectorAll('button,[role="button"],[data-testid]');for(const node of nodes){const match=classifyButton(node);if(match&&match.type===kind)return match.button;}return null;}
  function findLikelyButton(kind){for(const root of uniqueRoots()){const button=findButtonIn(root,kind);if(button)return button;}return findButtonIn(document.body,kind);}
  function queueShortcut(kind){window.setTimeout(()=>{if(!Effects.isEnabled())return;const button=findLikelyButton(kind);if(button)emit(kind,button);},24);}
  let last=0;document.addEventListener('mousemove',e=>{if(e.target instanceof Element)lastPointerTarget=e.target;},{capture:true,passive:true});document.addEventListener('click',e=>{if(!Effects.isEnabled())return;const m=detect(e.target);if(!m)return;emit(m.type,m.button);},true);document.addEventListener('keydown',e=>{if(!Effects.isEnabled()||e.defaultPrevented||e.repeat||e.altKey||e.ctrlKey||e.metaKey||isEditable(e.target))return;const key=(e.key||'').toLowerCase();if(key==='l')queueShortcut('like');else if(key==='r')queueShortcut('reply');else if(key==='f')queueShortcut('follow');},true);
})();
