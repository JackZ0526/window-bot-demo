# Window Bot entrance demo

Run `npm start`, then open http://localhost:4173. No installation or build step is needed.

This is an animation proof of concept on a sample hero, not a replacement for the client's homepage. The logo and SVG robot are provisional original artwork; replace them with approved Window Bot assets. The sample interior photograph is from Unsplash. Google Fonts are optional; system fonts are the fallback.

## Behaviour

- Desktop: 150 ms pause + 1.8 second two-pass clean. Mobile: 80 ms pause + 1.05 second single vertical pass.
- The robot's contact patch erases a Canvas 2D dirt layer using `destination-out`. Interpolated stamps cover the complete travelled path, including turns after dropped frames. Dirt does not fade out independently.
- Rendering uses requestAnimationFrame and a transformed robot. Canvas DPR is capped at 1.5. No animation library or large animation asset is required.
- sessionStorage prevents automatic replay on revisits in the same tab's browsing session. Separate tabs may have separate sessions. Manual demo replay overrides this. If storage is blocked, the instance falls back to an in-memory flag.
- Reduced motion skips the effect, including manual replay. Resize, hidden document, asset failure, or rendering error immediately restores the clean hero. A watchdog removes stale animation layers.
- Overlay is pointer-transparent. The skip button is keyboard accessible. All added nodes are removed at completion. Missing JavaScript leaves the plain hero visible.

## WordPress integration

1. Copy `window-bot.js`, `window-bot.css`, and `assets/robot.svg` into a child theme/plugin. Keep the robot asset relative to the JS file or update its URL.
2. Enqueue the CSS and deferred script on `is_front_page()` only. Do not replace the homepage markup or load the sample demo stylesheet in production.
3. Make the existing hero `position: relative` and initialize after it exists:

```js
const entrance = new WindowBotEntrance(document.querySelector('.your-existing-hero'));
entrance.play();
```

4. Load `demo.js` and replay controls only in this demo. Use `entrance.destroy()` before removing a hero in an SPA/page builder lifecycle.

The actual WordPress hero, production logo, and product reference images were not supplied. Production visual matching, physical device profiling, and Core Web Vitals measurement must be done against that real site. The oversized robot and two-pass timing are intentionally adjustable in `window-bot.js`.
