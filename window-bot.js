/* Standalone, dependency-free entrance. Attach to any positioned hero. */
(() => {
  'use strict';
  const source = document.currentScript?.src || location.href;
  const robotURL = new URL('assets/robot.svg', source).href;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const KEY = 'windowbot:entrance:v1';
  let memoryPlayed = false;
  class WindowBotEntrance {
    constructor(hero, { onState = () => {} } = {}) {
      this.hero = hero; this.onState = onState; this.active = false;
      this.cancelOnChange = () => this.finish('Ready. A beautifully clear view.');
      this.resizeObserver = new ResizeObserver(() => {
        if (this.active && (Math.abs(hero.clientWidth - this.w) > 2 || Math.abs(hero.clientHeight - this.h) > 2)) this.cancelOnChange();
      });
      this.resizeObserver.observe(hero);
      reduced.addEventListener('change', this.cancelOnChange);
      this.visibilityHandler = () => { if (document.hidden) this.cancelOnChange(); };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
    async play({ force = false, speed = 1 } = {}) {
      if (this.active) return;
      if (reduced.matches) { this.onState('Reduced motion · your clear view is ready', false); return; }
      let played = memoryPlayed;
      try { played ||= sessionStorage.getItem(KEY) === '1'; } catch { /* Storage may be unavailable. */ }
      if (!force && played) { this.onState('Welcome back. Your clear view is ready.', false); return; }
      this.w = this.hero.clientWidth; this.h = this.hero.clientHeight;
      if (!this.w || !this.h || document.hidden) return;
      this.active = true;
      this.onState('A fresh perspective is on its way…', true);
      const token = this.token = {};
      // Do not put an overlay on the page before the robot asset is ready.
      const robot = new Image(); robot.src = robotURL; robot.alt = '';
      try { await Promise.race([robot.decode(), new Promise((_, reject) => { this.assetTimer = setTimeout(() => reject(new Error('Asset timeout')), 1600); })]); }
      catch { this.finish('Your clear view is ready.'); return; }
      finally { clearTimeout(this.assetTimer); }
      if (!this.active || this.token !== token) return;
      try {
        const layer = this.layer = document.createElement('div'); layer.className = 'wb-layer'; layer.setAttribute('aria-hidden', 'true');
        const canvas = document.createElement('canvas'); canvas.className = 'wb-dirt';
        const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.ceil(this.w * dpr); canvas.height = Math.ceil(this.h * dpr);
        const ctx = this.ctx = canvas.getContext('2d'); if (!ctx) throw new Error('No canvas');
        ctx.scale(dpr, dpr); this.paintDirt(ctx);
        const bot = document.createElement('div'); bot.className = 'wb-robot'; bot.append(robot);
        this.mobile = this.w < 640;
        this.size = this.mobile ? this.w * 1.16 : this.h * .64;
        bot.style.width = bot.style.height = `${this.size}px`;
        bot.style.transform = `translate3d(${-this.size * 2}px,0,0)`;
        const glint = document.createElement('div'); glint.className = 'wb-glint';
        layer.append(canvas, bot, glint); this.hero.append(layer);
        const skip = this.skip = document.createElement('button'); skip.className = 'wb-skip'; skip.textContent = '跳过'; skip.onclick = () => this.finish('Your clear view is ready.'); this.hero.append(skip);
        memoryPlayed = true; try { sessionStorage.setItem(KEY, '1'); } catch { /* In-memory fallback. */ }
        const s = this.size, w = this.w, h = this.h;
        const points = this.mobile ? [[w / 2, -s * .55], [w / 2, h + s * .55]] : [[-s * .55, h * .23], [w + s * .55, h * .23], [w + s * .55, h * .77], [-s * .55, h * .77]];
        const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
        const total = lengths.reduce((a, b) => a + b, 0);
        const duration = (this.mobile ? 1050 : 1800) / Math.max(.2, speed);
        const delay = this.mobile ? 80 : 150;
        let start = null, previous = points[0];
        this.watchdog = setTimeout(() => this.finish('Your clear view is ready.'), duration + delay + 2000);
        const tick = now => {
          if (!this.active || this.token !== token) return;
          try {
            if (start === null) start = now;
            const progress = Math.max(0, Math.min(1, (now - start - delay) / duration));
            // Constant travel speed keeps the robot's contact patch and cleaned area aligned.
            let distance = total * progress, index = 0;
            while (index < lengths.length - 1 && distance > lengths[index]) { distance -= lengths[index]; index++; }
            const t = distance / lengths[index];
            const position = [points[index][0] + (points[index + 1][0] - points[index][0]) * t, points[index][1] + (points[index + 1][1] - points[index][1]) * t];
            // Stamp along the traversed path, including every corner if a frame was dropped.
            const oldDistance = this.lastDistance || 0; let cumulative = 0;
            for (let i = 0; i < lengths.length - 1; i++) { cumulative += lengths[i]; if (cumulative > oldDistance && cumulative < total * progress) { this.erase(previous, points[i + 1]); previous = points[i + 1]; } }
            this.erase(previous, position); previous = position; this.lastDistance = total * progress;
            bot.style.transform = `translate3d(${position[0] - s / 2}px,${position[1] - s / 2}px,0)`;
            if (progress > .9) glint.style.opacity = String(Math.sin((progress - .9) / .1 * Math.PI) * .5);
            if (progress < 1) this.frame = requestAnimationFrame(tick); else this.finish('All clear. Enjoy the view.');
          } catch { this.finish('Your clear view is ready.'); }
        };
        this.frame = requestAnimationFrame(tick);
      } catch { this.finish('Your clear view is ready.'); }
    }
    paintDirt(ctx) {
      const w = this.w, h = this.h;
      let seed = 73; const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      // A neutral, uneven film of dust. All texture is baked once, never per frame.
      ctx.fillStyle = 'rgba(205,207,201,.16)'; ctx.fillRect(0, 0, w, h);
      const film = document.createElement('canvas');
      film.width = Math.ceil(w / 2); film.height = Math.ceil(h / 2);
      const filmCtx = film.getContext('2d');
      const pixels = filmCtx.createImageData(film.width, film.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const dust = random();
        pixels.data[i] = 191; pixels.data[i + 1] = 192; pixels.data[i + 2] = 181;
        pixels.data[i + 3] = dust > .96 ? 30 + random() * 26 : random() * 10;
      }
      filmCtx.putImageData(pixels, 0, 0); ctx.drawImage(film, 0, 0, w, h);
      for (let i = 0; i < 28; i++) {
        const x = random() * w, y = random() * h, r = 70 + random() * 210;
        const haze = ctx.createRadialGradient(x, y, 0, x, y, r);
        haze.addColorStop(0, `rgba(226,226,215,${.035 + random() * .065})`);
        haze.addColorStop(1, 'rgba(226,226,215,0)');
        ctx.save(); ctx.translate(x, y); ctx.scale(1, .55 + random()); ctx.translate(-x, -y);
        ctx.fillStyle = haze; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
      }
      // Mineral deposits left by evaporated droplets: asymmetric, broken rims,
      // concentrated near runoff trails instead of uniformly spaced bubble outlines.
      const trails = Array.from({ length: Math.max(6, Math.round(w / 85)) }, () => ({ x: random() * w, y: random() * h }));
      for (let i = 0; i < w * h / 2100; i++) {
        const trail = trails[Math.floor(random() * trails.length)];
        const clustered = random() < .65;
        const x = clustered ? trail.x + (random() - .5) * 100 : random() * w;
        const y = clustered ? (trail.y + random() * 260) % h : random() * h;
        const r = 1.3 + Math.pow(random(), 2.2) * 15;
        const stretch = .75 + random() * .8, phase = random() * Math.PI * 2;
        const opacity = .07 + random() * .12;
        const outline = (offsetX, offsetY) => {
          ctx.beginPath();
          for (let j = 0; j <= 40; j++) {
            const a = j / 40 * Math.PI * 2;
            const irregular = 1 + .12 * Math.sin(a * 3 + phase) + .07 * Math.cos(a * 5 - phase);
            const px = x + Math.cos(a) * r * irregular + offsetX;
            const py = y + Math.sin(a) * r * stretch * irregular + offsetY;
            if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
        };
        outline(0, 0); ctx.fillStyle = `rgba(218,215,199,${opacity * .28})`; ctx.fill();
        ctx.setLineDash([r * 1.6, r * .45, r * .8, r * .25]); ctx.lineDashOffset = phase * r;
        ctx.strokeStyle = `rgba(246,244,227,${opacity})`; ctx.lineWidth = .45 + random() * .65; ctx.stroke();
        outline(.6, .7); ctx.strokeStyle = `rgba(92,96,84,${opacity * .42})`; ctx.lineWidth = .45; ctx.stroke();
        ctx.setLineDash([]);
      }
      // Hairline gravity trails with tapered, translucent edges and quiet wipe marks.
      for (const trail of trails) {
        const length = 45 + random() * 240, bend = (random() - .5) * 9;
        const fade = ctx.createLinearGradient(0, trail.y, 0, trail.y + length);
        fade.addColorStop(0, 'rgba(238,235,218,0)'); fade.addColorStop(.25, 'rgba(238,235,218,.16)'); fade.addColorStop(1, 'rgba(238,235,218,0)');
        for (let edge = 0; edge < 2; edge++) {
          ctx.beginPath(); ctx.moveTo(trail.x + edge * 2, trail.y);
          ctx.bezierCurveTo(trail.x + bend, trail.y + length * .3, trail.x - bend, trail.y + length * .7, trail.x + edge, trail.y + length);
          ctx.strokeStyle = fade; ctx.lineWidth = edge ? .6 : 1.5; ctx.stroke();
        }
      }
      for (let i = 0; i < 7; i++) {
        const x = random() * w, y = random() * h;
        for (let j = 0; j < 9; j++) {
          ctx.beginPath(); ctx.moveTo(x - 140, y + j * 2.2);
          ctx.bezierCurveTo(x - 40, y - 25 + j * 2.2, x + 80, y + 50 + j * 2.2, x + 220, y + 40 + j * 2.2);
          ctx.strokeStyle = `rgba(232,231,216,${.012 + random() * .023})`; ctx.lineWidth = 1 + random() * 2; ctx.stroke();
        }
      }
    }
    erase(from, to) {
      const ctx = this.ctx, half = this.size * .468;
      const count = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 9));
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000';
      for (let i = 0; i <= count; i++) { const t = i / count, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t; ctx.beginPath(); ctx.roundRect(x - half, y - half, half * 2, half * 2, this.size * .17); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    finish(message) {
      if (!this.active) return;
      this.active = false; this.token = null;
      cancelAnimationFrame(this.frame); clearTimeout(this.watchdog); clearTimeout(this.assetTimer);
      const restoreFocus = document.activeElement === this.skip;
      this.layer?.remove(); this.skip?.remove(); this.layer = this.skip = this.ctx = null; this.lastDistance = 0;
      this.onState(message, false);
      if (restoreFocus) (this.hero.querySelector('a,button') || document.querySelector('#replay'))?.focus({ preventScroll: true });
    }
    destroy() { this.finish(''); this.resizeObserver.disconnect(); reduced.removeEventListener('change', this.cancelOnChange); document.removeEventListener('visibilitychange', this.visibilityHandler); }
  }
  window.WindowBotEntrance = WindowBotEntrance;
})();
