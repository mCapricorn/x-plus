(() => {
  const fxOn = document.getElementById('fxOn');
  const visualMode = document.getElementById('visualMode');
  const sndOn = document.getElementById('sndOn');
  const sndVol = document.getElementById('sndVol');
  const sndVolPct = document.getElementById('sndVolPct');
  const soundMode = document.getElementById('soundMode');

  // ── Initialize UI from storage ────────────────────────────────────────────
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaultFxEnabled = true;
  const defaultEnabled = !reduceMotion;
  const defaultVolume = 0.15;
  const defaultVisualMode = 'rotate';
  const defaultSoundMode = 'rotate';

  const updateUiState = () => {
    sndOn.disabled = !fxOn.checked;
    sndVol.disabled = !fxOn.checked || !sndOn.checked;
    visualMode.disabled = !fxOn.checked;
    soundMode.disabled = !fxOn.checked || !sndOn.checked;
  };

  chrome.storage.local.get([
    'xc_fx_enabled',
    'xc_visual_mode',
    'xc_sound_enabled',
    'xc_sound_volume',
    'xc_sound_mode',
    'np_sound_enabled',
    'np_sound_volume'
  ], res => {
    const fxEnabled = typeof res.xc_fx_enabled === 'boolean' ? res.xc_fx_enabled : defaultFxEnabled;
    const savedVisualMode = ['classic', 'alt', 'rotate'].includes(res.xc_visual_mode)
      ? res.xc_visual_mode
      : defaultVisualMode;
    const enabled = typeof res.xc_sound_enabled === 'boolean'
      ? res.xc_sound_enabled
      : (typeof res.np_sound_enabled === 'boolean' ? res.np_sound_enabled : defaultEnabled);
    const volume = typeof res.xc_sound_volume === 'number'
      ? res.xc_sound_volume
      : (typeof res.np_sound_volume === 'number' ? res.np_sound_volume : defaultVolume);
    const savedSoundMode = ['classic', 'alt', 'rotate'].includes(res.xc_sound_mode)
      ? res.xc_sound_mode
      : defaultSoundMode;
    fxOn.checked = fxEnabled;
    visualMode.value = savedVisualMode;
    sndOn.checked = enabled;
    sndVol.value = Math.round(volume * 100);
    sndVolPct.textContent = Math.round(volume * 100) + '%';
    soundMode.value = savedSoundMode;
    updateUiState();

    chrome.storage.local.set({
      xc_fx_enabled: fxEnabled,
      xc_visual_mode: savedVisualMode,
      xc_sound_enabled: enabled,
      xc_sound_volume: volume,
      xc_sound_mode: savedSoundMode
    });
  });

  // ── Persist changes ───────────────────────────────────────────────────────
  fxOn.addEventListener('change', () => {
    const fxEnabled = fxOn.checked;
    chrome.storage.local.set({ xc_fx_enabled: fxEnabled });
    updateUiState();
  });
  visualMode.addEventListener('change', () => {
    chrome.storage.local.set({ xc_visual_mode: visualMode.value });
  });
  sndOn.addEventListener('change', () => {
    chrome.storage.local.set({ xc_sound_enabled: sndOn.checked });
    updateUiState();
  });
  sndVol.addEventListener('input', () => {
    const v = Math.min(100, Math.max(0, +sndVol.value)) / 100;
    sndVolPct.textContent = Math.round(v * 100) + '%';
    chrome.storage.local.set({ xc_sound_volume: v });
  });
  soundMode.addEventListener('change', () => {
    chrome.storage.local.set({ xc_sound_mode: soundMode.value });
  });

  // ── Test sounds (uses the same synth logic as content.js) ─────────────────
  let ctx = null, master = null;
  const ensureCtx = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    return ctx;
  };
  const tone = ({ type = 'sine', f0 = 440, f1 = null, t = 0, dur = 0.15, vol = 1, curve = 'exp' }) => {
    const c = ensureCtx(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    master.gain.value = +sndVol.value / 100;
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
  const noise = ({ t = 0, dur = 0.08, vol = 0.6, hp = 1500 }) => {
    const c = ensureCtx(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    master.gain.value = +sndVol.value / 100;
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
  const rotation = { like: 0, follow: 0, reply: 0 };
  const pickVariant = kind => {
    if (soundMode.value === 'classic') return 0;
    if (soundMode.value === 'alt') return 1;
    const next = rotation[kind] % 2;
    rotation[kind] += 1;
    return next;
  };
  const play = kind => {
    const variant = pickVariant(kind);
    if (kind === 'like') {
      if (variant === 0) {
        tone({ type: 'sine', f0: 720, f1: 1440, dur: 0.16, vol: 0.9 });
        tone({ type: 'sine', f0: 1440, f1: 2160, t: 0.02, dur: 0.12, vol: 0.25 });
      } else {
        tone({ type: 'triangle', f0: 540, f1: 1180, dur: 0.12, vol: 0.75 });
        tone({ type: 'triangle', f0: 810, f1: 1620, t: 0.04, dur: 0.18, vol: 0.22 });
      }
    } else if (kind === 'follow') {
      if (variant === 0) {
        tone({ type: 'square', f0: 660, dur: 0.07, vol: 0.35 });
        tone({ type: 'square', f0: 990, t: 0.08, dur: 0.12, vol: 0.3 });
      } else {
        tone({ type: 'sawtooth', f0: 520, dur: 0.06, vol: 0.22 });
        tone({ type: 'sine', f0: 780, t: 0.05, dur: 0.11, vol: 0.24 });
        tone({ type: 'sine', f0: 1040, t: 0.11, dur: 0.13, vol: 0.2 });
      }
    } else if (kind === 'reply') {
      if (variant === 0) {
        noise({ dur: 0.07, vol: 0.5, hp: 2000 });
        tone({ type: 'sine', f0: 180, f1: 60, t: 0.03, dur: 0.18, vol: 0.7 });
      } else {
        noise({ dur: 0.05, vol: 0.35, hp: 2600 });
        noise({ t: 0.03, dur: 0.04, vol: 0.25, hp: 3200 });
        tone({ type: 'triangle', f0: 220, f1: 90, t: 0.02, dur: 0.16, vol: 0.45 });
      }
    }
  };
  document.querySelectorAll('.test').forEach(btn => {
    btn.addEventListener('click', () => play(btn.dataset.kind));
  });
})();
