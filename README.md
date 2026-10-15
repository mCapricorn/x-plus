# xClick

xClick is a Chrome / Edge Manifest V3 extension that adds lightweight interaction effects to X:
- Like: neon heart bursts, rotating visual variants, and synthesized click feedback.
- Follow: expanding rings, profile-follow cues, and alternate sound palettes.
- Reply/comment: scanline glitch FX, rotating overlays, and synthesized glitch feedback.

All sounds are synthesized at runtime with the Web Audio API. No audio files or network requests are used.

## Features
- Popup-based global enable switch for all effects.
- Keyboard-triggered FX support for common X shortcuts: `L` like, `R` reply, `F` follow nearby profile actions.
- Visual mode selector: classic, alt, or rotate.
- Sound mode selector: classic, alt, or rotate.
- Independent sound toggle and volume control.
- Test buttons in the popup for like, follow, and reply sounds.
- Reduced-motion friendly defaults.

## Install
1. Open chrome://extensions or edge://extensions.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this project folder.
5. Refresh x.com.

## Release
- Current version: 0.4.0
- Suggested release tag: v0.4.0
- Suggested release asset: xclick-v0.4.0.zip

## Notes
- Effects are decorative only and do not automate any X action.
- All effects run locally.
- X may change its DOM over time, so selectors may need future tuning.
