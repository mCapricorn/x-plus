(() => {
  const fxOn = document.getElementById('fxOn');
  const sceneAnimations = [...document.querySelectorAll('.sceneAnimation')];
  const sceneModes = [...document.querySelectorAll('.sceneMode')];
  const sndOn = document.getElementById('sndOn');
  const sndVol = document.getElementById('sndVol');
  const sndVolPct = document.getElementById('sndVolPct');
  const soundMode = document.getElementById('soundMode');
  const themePreset = document.getElementById('themePreset');
  const randomTheme = document.getElementById('randomTheme');
  const previewStage = document.getElementById('previewStage');
  const previewTarget = previewStage.querySelector('.previewTarget');
  const previewCaption = previewStage.querySelector('.previewCaption');
  const themeKeys = ['xc_theme', 'xc_theme_primary', 'xc_theme_accent'];
  const palettes = {
    cyber: ['#00f6ff', '#ff2bd6'],
    aurora: ['#7bffd6', '#9a7bff'],
    sakura: ['#ff8fae', '#ffe178'],
    mono: ['#f5f5f5', '#929bab']
  };
  const validHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  const applyPalette = (theme, primary, accent) => {
    document.body.dataset.theme = theme;
    const colors = theme === 'custom' && validHex(primary) && validHex(accent)
      ? [primary, accent] : (palettes[theme] || palettes.cyber);
    document.body.style.setProperty('--xp-primary', colors[0]);
    document.body.style.setProperty('--xp-accent', colors[1]);
  };

  // ── Initialize UI from storage ────────────────────────────────────────────
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaultFxEnabled = true;
  const defaultEnabled = !reduceMotion;
  const defaultVolume = 0.15;
  const defaultSoundMode = 'rotate';

  const updateUiState = () => {
    sndOn.disabled = !fxOn.checked;
    sndVol.disabled = !fxOn.checked || !sndOn.checked;
    sceneAnimations.forEach(input => {
      input.disabled = !fxOn.checked;
      const mode = sceneModes.find(select => select.dataset.kind === input.dataset.kind);
      if (mode) mode.disabled = !fxOn.checked || !input.checked;
    });
    soundMode.disabled = !fxOn.checked || !sndOn.checked;
  };

  chrome.storage.local.get([
    'xc_fx_enabled',
    'xc_visual_mode',
    'xc_animation_like_enabled', 'xc_animation_follow_enabled', 'xc_animation_reply_enabled', 'xc_animation_comment_enabled',
    'xc_visual_mode_like', 'xc_visual_mode_follow', 'xc_visual_mode_reply', 'xc_visual_mode_comment',
    'xc_sound_enabled',
    'xc_sound_volume',
    'xc_sound_mode',
    ...themeKeys,
    'np_sound_enabled',
    'np_sound_volume'
  ], res => {
    const fxEnabled = typeof res.xc_fx_enabled === 'boolean' ? res.xc_fx_enabled : defaultFxEnabled;
    const legacyVisualMode = ['classic', 'alt', 'rotate'].includes(res.xc_visual_mode) ? res.xc_visual_mode : 'rotate';
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
    const sceneSettings = {};
    sceneAnimations.forEach(input => {
      const kind = input.dataset.kind;
      const key = `xc_animation_${kind}_enabled`;
      input.checked = typeof res[key] === 'boolean' ? res[key] : true;
      sceneSettings[key] = input.checked;
    });
    sceneModes.forEach(select => {
      const key = `xc_visual_mode_${select.dataset.kind}`;
      select.value = ['classic', 'alt', 'rotate'].includes(res[key]) ? res[key] : legacyVisualMode;
      sceneSettings[key] = select.value;
    });
    sndOn.checked = enabled;
    sndVol.value = Math.round(volume * 100);
    sndVolPct.textContent = Math.round(volume * 100) + '%';
    soundMode.value = savedSoundMode;
    const savedTheme = ['cyber', 'aurora', 'sakura', 'mono', 'custom'].includes(res.xc_theme) ? res.xc_theme : 'cyber';
    themePreset.value = savedTheme;
    applyPalette(savedTheme, res.xc_theme_primary, res.xc_theme_accent);
    updateUiState();

    chrome.storage.local.set({
      xc_fx_enabled: fxEnabled,
      xc_sound_enabled: enabled,
      xc_sound_volume: volume,
      xc_sound_mode: savedSoundMode,
      ...sceneSettings
    });
  });

  // ── Persist changes ───────────────────────────────────────────────────────
  fxOn.addEventListener('change', () => {
    const fxEnabled = fxOn.checked;
    chrome.storage.local.set({ xc_fx_enabled: fxEnabled });
    updateUiState();
  });
  sceneAnimations.forEach(input => input.addEventListener('change', () => {
    chrome.storage.local.set({ [`xc_animation_${input.dataset.kind}_enabled`]: input.checked });
    updateUiState();
  }));
  sceneModes.forEach(select => select.addEventListener('change', () => {
    chrome.storage.local.set({ [`xc_visual_mode_${select.dataset.kind}`]: select.value });
  }));
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

  // ── Shared color themes for the popup and X page effects ─────────────────
  themePreset.addEventListener('change', () => {
    const theme = themePreset.value;
    if (theme === 'shuffle') {
      randomTheme.click();
    } else if (theme === 'custom') {
      chrome.storage.local.get(themeKeys, res => {
        if (validHex(res.xc_theme_primary) && validHex(res.xc_theme_accent)) {
          applyPalette('custom', res.xc_theme_primary, res.xc_theme_accent);
          chrome.storage.local.set({ xc_theme: 'custom' });
        } else {
          randomTheme.click();
        }
      });
    } else {
      applyPalette(theme);
      chrome.storage.local.set({ xc_theme: theme });
    }
  });
  const toHex = value => Math.round(value).toString(16).padStart(2, '0');
  const randomHex = (hue, saturation, lightness) => {
    const s = saturation / 100, l = lightness / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = l - c / 2;
    const rgb = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x]
      : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
    return `#${rgb.map(channel => toHex((channel + m) * 255)).join('')}`;
  };
  randomTheme.addEventListener('click', () => {
    const hue = Math.floor(Math.random() * 360);
    const primary = randomHex(hue, 88, 64);
    const accent = randomHex((hue + 155 + Math.random() * 50) % 360, 92, 68);
    themePreset.value = 'custom';
    applyPalette('custom', primary, accent);
    chrome.storage.local.set({ xc_theme: 'custom', xc_theme_primary: primary, xc_theme_accent: accent });
    previewScene('like', false);
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
  const previewRotation = { like: 0, follow: 0, reply: 0, comment: 0 };
  const pickVariant = kind => {
    if (soundMode.value === 'classic') return 0;
    if (soundMode.value === 'alt') return 1;
    const next = rotation[kind] % 2;
    rotation[kind] += 1;
    return next;
  };
  const play = kind => {
    if (!sndOn.checked || +sndVol.value <= 0) return;
    if (kind === 'comment') kind = 'reply';
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
  const sceneCopy = {
    like: ['♥', 'LIKE CONFIRMED'],
    follow: ['＋', 'FOLLOW SIGNAL'],
    reply: ['↳', 'REPLY UPLINK'],
    comment: ['✦', 'POST TRANSMITTED']
  };
  function previewScene(kind, withSound = true) {
    const [symbol, caption] = sceneCopy[kind] || sceneCopy.like;
    const modeSelect = sceneModes.find(select => select.dataset.kind === kind);
    const mode = modeSelect?.value || 'rotate';
    const variant = mode === 'classic' ? 0 : mode === 'alt' ? 1 : previewRotation[kind]++ % 2;
    previewTarget.textContent = symbol;
    previewStage.dataset.scene = kind;
    previewCaption.textContent = caption;
    previewTarget.classList.remove('playing');
    void previewTarget.offsetWidth;
    previewTarget.classList.add('playing');
    previewStage.querySelectorAll('.previewRing,.previewParticle,.previewScan').forEach(node => node.remove());
    const ringCount = variant ? 3 : 2;
    for (let i = 0; i < ringCount; i++) {
      const ring = document.createElement('span');
      ring.className = `previewRing${i % 2 ? ' alt' : ''}`;
      ring.style.animationDelay = `${i * 90}ms`;
      previewStage.appendChild(ring);
      ring.addEventListener('animationend', () => ring.remove(), { once: true });
    }
    const particleCount = variant ? 14 : 8;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('span');
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = variant ? 38 : 30;
      particle.className = `previewParticle${i % 2 ? ' alt' : ''}`;
      if (kind === 'like') particle.textContent = '♥';
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      particle.style.animationDelay = `${i * 9}ms`;
      previewStage.appendChild(particle);
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
    }
    if (kind === 'reply' || kind === 'comment') {
      const scan = document.createElement('span');
      scan.className = 'previewScan';
      previewStage.appendChild(scan);
      scan.addEventListener('animationend', () => scan.remove(), { once: true });
    }
    if (withSound) play(kind);
  }
  document.querySelectorAll('.test[data-kind]').forEach(btn => {
    btn.addEventListener('click', () => previewScene(btn.dataset.kind));
  });
})();
