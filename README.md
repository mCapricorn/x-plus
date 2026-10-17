# xClick

xClick is a Chrome / Edge Manifest V3 extension that adds lightweight interaction effects to X:
- Like: neon heart bursts, rotating visual variants, and synthesized click feedback.
- Follow: expanding rings, profile-follow cues, and alternate sound palettes.
- Reply: scanline glitch FX, rotating overlays, and synthesized glitch feedback.
- Comment/post send: a separate burst animation with the reply sound palette.

All sounds are synthesized at runtime with the Web Audio API. No audio files or network requests are used.

## Features
- Popup-based global enable switch for all effects.
- Independent animation enable switches for like, follow, and reply scenes.
- A separate animation setting for sending a comment/post.
- Separate animation styles per scene (pulse, neon burst, or rotate).
- Animation studio in the popup with local previews for likes, follows, replies, and comments.
- Cyber neon, aurora, sakura, monochrome, and shuffled custom color palettes shared with X page effects.
- Keyboard-triggered FX support for common X shortcuts: `L` like, `R` reply, `F` follow nearby profile actions.
- Sound mode selector: classic, alt, or rotate.
- Independent sound toggle and volume control.
- Preview buttons in the popup for each scene, with matching synthesized sounds when sound is enabled.
- Reduced-motion friendly defaults.

## Install
1. Open chrome://extensions or edge://extensions.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this project folder.
5. Refresh x.com.

## Privacy
- Privacy policy: https://github.com/mCapricorn/xClick/blob/main/PRIVACY_POLICY.md

## Release
- Current version: 0.4.4
- Suggested release tag: v0.4.4
- Suggested release asset: xclick-v0.4.4.zip

### 0.4.4
- Add a popup animation studio with local visual and sound previews for all four interaction scenes.
- Add shared Cyber neon, Aurora, Sakura, Monochrome, and randomized custom themes for popup and X page effects.

### 0.4.3
- Fix the `R` reply shortcut so X handling the key does not suppress its visual feedback.
- Unlock synthesized audio during the keyboard gesture so reply shortcut sounds can play.
- Add independent animation switches and style selectors for like, follow, and reply.
- Separate reply-composer and comment-send animation controls.

### 0.4.2
- Fix the `R` reply shortcut so X handling the key does not suppress its visual feedback.
- Unlock synthesized audio during the keyboard gesture so reply shortcut sounds can play.

### 0.4.1
- Fix clicks on the Enable effects and Enable sounds switch tracks.
- Add visible keyboard focus and disabled styling for switches.

## Notes
- Effects are decorative only and do not automate any X action.
- All effects run locally.
- X may change its DOM over time, so selectors may need future tuning.
