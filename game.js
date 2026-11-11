/* ==========================================================================
   MINI GAME — MALWARE SORTER
   Two big targets: 🗑️ Recycle Bin (malware) · 📁 Documents (safe files).
   Windows Explorer-style drag (ghost follows pointer), works on mouse & touch.
   3 levels, per-file timer, streak bonus, educational feedback, sound effects.
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- Level data ---------- */
  const LEVELS = [
    {
      time: 15,
      hint: 'warm-up — the malware is not even trying to hide.',
      files: [
        { name: 'virus.exe', malware: true, reason: 'An unknown executable is the classic delivery method — never trust a random .exe.' },
        { name: 'Antivirus_Report.docx', malware: false },
        { name: 'FREE_MONEY.bat', malware: true, reason: 'Too good to be true = bait. A .bat script can run any command on your machine.' },
        { name: 'Meeting_Notes.txt', malware: false },
        { name: 'trojan_horse.exe', malware: true, reason: 'Named after the legend — a harmless-looking package hiding an attack inside.' },
        { name: 'Budget_2025.xlsx', malware: false },
        { name: 'hacktool_free.exe', malware: true, reason: '"Free" hacking tools from unknown sources are frequently backdoored.' },
        { name: 'Research_Data.pdf', malware: false },
        { name: 'ransomware_locky.exe', malware: true, reason: 'Ransomware encrypts everything it can reach, then demands payment. Quarantine it.' },
        { name: 'Setup_Guide.txt', malware: false },
      ],
    },
    {
      time: 12,
      hint: 'double extensions & scripts in disguise — read the FULL filename.',
      files: [
        { name: 'invoice.pdf.exe', malware: true, reason: 'Double extension! Windows hides the real .exe so it looks like a harmless PDF.' },
        { name: 'Vacation_Photo.jpg', malware: false },
        { name: 'photo.jpg.vbs', malware: true, reason: 'The real extension is .vbs — a Visual Basic script that executes code when opened.' },
        { name: 'Project_Plan.pdf', malware: false },
        { name: 'update.txt.scr', malware: true, reason: '.scr screensavers are executables in disguise — a favorite malware trick.' },
        { name: 'crack_tool.exe', malware: true, reason: 'Pirated software is one of the most common ways malware spreads. "Free" can cost you.' },
        { name: 'Homework.docx', malware: false },
        { name: 'song.mp3.cmd', malware: true, reason: "That's no MP3 — the .cmd suffix runs shell commands the moment you open it." },
        { name: 'Family_Photo.png', malware: false },
        { name: 'wallpaper.png.bat', malware: true, reason: "Images never need a batch script to open. The .bat is the payload." },
      ],
    },
    {
      time: 10,
      hint: 'final round — impersonation, fake updates & typosquatting.',
      files: [
        { name: 'Security_Update.scr', malware: true, reason: 'Fake "security updates" are a top social-engineering tactic — real updates never arrive as random files.' },
        { name: 'README.txt.lnk', malware: true, reason: 'The .txt is a mask: .lnk shortcuts can silently point to a hidden payload.' },
        { name: 'svch0st.exe', malware: true, reason: "It impersonates the real svchost.exe using a zero instead of an 'o' — classic typosquatting." },
        { name: 'Resume_Final.pdf', malware: false },
        { name: 'passwords.txt.exe', malware: true, reason: 'Password lists are prime targets — but the trailing .exe gives this one away.' },
        { name: 'Firewall_Rules.txt', malware: false },
        { name: 'Microsoft_Office_Setup.msi', malware: true, reason: 'Installers impersonating big brands are a common way attackers get in the door.' },
        { name: 'Thesis_Draft.docx', malware: false },
        { name: 'bitcoin_generator.exe', malware: true, reason: 'Crypto "generators" are 100% scams — and always executables.' },
        { name: 'Network_Diagram.vsdx', malware: false },
      ],
    },
  ];

  /* File icons mirror Windows behaviour: disguised files show the icon of
     the FAKE extension — exactly how real malware fools people. */
  const EXT_ICONS = {
    doc: '📝', docx: '📝', txt: '📄', pdf: '📕',
    xls: '📊', xlsx: '📊', csv: '📊', mp3: '🎵',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    vsdx: '🗺️', msi: '📦', exe: '⚙️', bat: '⚙️',
    cmd: '⚙️', scr: '🖥️', vbs: '📜', lnk: '🔗',
  };

  const START_LIVES = 3;
  const TICK_MS = 100;
  const FEEDBACK_OK_MS = 1100;
  const FEEDBACK_BAD_MS = 2400;
  const HIGHSCORE_KEY = 'malware-sorter-highscore';
  const MUTE_KEY = 'malware-sorter-muted';
  const DRAG_THRESHOLD = 8; // px before a press becomes a drag

  /* ---------- DOM ---------- */
  const stage = document.getElementById('game-stage');
  const zones = [...document.querySelectorAll('.drop-zone')];
  const hud = {
    level: document.getElementById('hud-level'),
    score: document.getElementById('hud-score'),
    streak: document.getElementById('hud-streak'),
    progress: document.getElementById('hud-progress'),
    lives: document.getElementById('hud-lives'),
  };
  const soundButton = document.getElementById('hud-sound');
  const timerFill = document.getElementById('game-timer-fill');
  const feedbackBox = document.getElementById('game-feedback');
  const feedbackIcon = document.getElementById('feedback-icon');
  const feedbackText = document.getElementById('feedback-text');

  /* ---------- State ---------- */
  const state = {
    phase: 'idle', // idle | playing | transition | over
    level: 0,
    score: 0,
    lives: START_LIVES,
    streak: 0,
    queue: [],
    fileIdx: 0,
    current: null,
    cardEl: null,
    timeLeft: 0,
    timerId: null,
    pendingTimeoutId: null,
    zoneFlashTimeoutId: null,
    selected: false, // tap-to-select fallback
  };

  let dragSession = null; // active pointer drag { card, ghost, startX/Y, offX/Y, w, moved, pointerId }

  /* ---------- Sound (tiny WebAudio synth — no files needed) ---------- */
  const sound = {
    ctx: null,
    enabled: (() => {
      try { return localStorage.getItem(MUTE_KEY) !== '1'; } catch { return true; }
    })(),
    ensure() {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* unsupported */ }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type = 'sine', gain = 0.06, delay = 0) {
      if (!this.enabled) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    },
    pick() { this.tone(500, 0.05, 'triangle', 0.04); },
    correct() { this.tone(620, 0.1, 'sine', 0.07); this.tone(930, 0.16, 'sine', 0.07, 0.09); },
    wrong() { this.tone(180, 0.22, 'sawtooth', 0.05); this.tone(120, 0.3, 'sawtooth', 0.045, 0.1); },
    win() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.06, i * 0.12)); },
  };

  /* ---------- Helpers ---------- */
  const highScore = () => {
    try { return Number(localStorage.getItem(HIGHSCORE_KEY)) || 0; }
    catch { return 0; }
  };

  const saveHighScore = (v) => {
    try { localStorage.setItem(HIGHSCORE_KEY, String(v)); } catch { /* ignore */ }
  };

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function extsOf(name) { return name.split('.').slice(1).map((s) => s.toLowerCase()); }
  function realExt(name) { const e = extsOf(name); return e.length ? e[e.length - 1] : ''; }
  function apparentExt(name) {
    const e = extsOf(name);
    return e.length >= 2 ? e[e.length - 2] : (e[0] || '');
  }
  function iconFor(name) { return EXT_ICONS[apparentExt(name)] || '📄'; }

  function clearPending() {
    if (state.pendingTimeoutId) {
      clearTimeout(state.pendingTimeoutId);
      state.pendingTimeoutId = null;
    }
  }

  function updateHud() {
    hud.level.textContent = `${state.level + 1} / ${LEVELS.length}`;
    hud.score.textContent = state.score;
    hud.streak.textContent = `×${state.streak}`;
    hud.progress.textContent = state.fileIdx < state.queue.length
      ? `${state.fileIdx + 1} / ${state.queue.length}`
      : '–';
    hud.lives.innerHTML = Array.from({ length: START_LIVES }, (_, i) =>
      `<span class="life${i < state.lives ? ' on' : ''}">♥</span>`
    ).join('');
  }

  /* ---------- Timer ---------- */
  function startTimer() {
    stopTimer();
    state.timeLeft = LEVELS[state.level].time;
    paintTimer();
    state.timerId = setInterval(() => {
      state.timeLeft -= TICK_MS / 1000;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        paintTimer();
        stopTimer();
        onTimeout();
        return;
      }
      paintTimer();
    }, TICK_MS);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function paintTimer() {
    const total = LEVELS[state.level].time;
    const pct = Math.max(0, Math.min(1, state.timeLeft / total));
    timerFill.style.width = `${pct * 100}%`;
    timerFill.classList.toggle('danger', pct <= 0.3);
  }

  /* ---------- Feedback ---------- */
  function showFeedback(type, html) {
    feedbackBox.dataset.type = type;
    feedbackIcon.textContent = type === 'success' ? '✔' : type === 'error' ? '✖' : '›';
    feedbackText.innerHTML = html;
  }

  function flashZone(zoneId, ok) {
    const zone = zones.find((z) => z.dataset.zone === zoneId);
    if (!zone) return;
    zone.classList.add(ok ? 'dz-correct' : 'dz-wrong');
    clearTimeout(state.zoneFlashTimeoutId);
    state.zoneFlashTimeoutId = setTimeout(() => {
      zone.classList.remove('dz-correct', 'dz-wrong');
    }, 700);
  }

  /* ---------- Particle burst (celebration / warning) ---------- */
  function burst(x, y, ok) {
    const pool = ok ? ['✨', '⭐', '🎉', '💥'] : ['🦠', '💀', '💢'];
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span');
      p.className = 'burst-particle';
      p.textContent = pool[Math.floor(Math.random() * pool.length)];
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.6;
      const dist = 46 + Math.random() * 46;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty('--bx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--by', `${Math.sin(angle) * dist - 14}px`);
      p.style.setProperty('--br', `${Math.random() * 180 - 90}deg`);
      document.body.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  /* ---------- Stage rendering ---------- */
  function clearStage() {
    stage.querySelectorAll('.game-overlay, .file-card').forEach((el) => el.remove());
  }

  function renderOverlay(html) {
    clearStage();
    const overlay = document.createElement('div');
    overlay.className = 'game-overlay';
    overlay.innerHTML = html;
    stage.appendChild(overlay);
  }

  function showFile() {
    clearStage();
    const file = state.queue[state.fileIdx];
    state.current = file;
    state.selected = false;
    state.phase = 'playing';

    const card = document.createElement('div');
    card.className = 'file-card';
    card.id = 'file-card';
    card.innerHTML = `
      <span class="file-icon">${iconFor(file.name)}</span>
      <span class="file-name mono">${file.name}</span>
      <span class="file-ext mono">.${realExt(file.name)}</span>
    `;

    card.addEventListener('pointerdown', (e) => {
      if (state.phase !== 'playing' || dragSession) return;
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      const rect = card.getBoundingClientRect();
      dragSession = {
        card,
        startX: e.clientX,
        startY: e.clientY,
        offX: e.clientX - rect.left,
        offY: e.clientY - rect.top,
        w: rect.width,
        moved: false,
        ghost: null,
        pointerId: e.pointerId,
      };
    });

    state.cardEl = card;
    stage.appendChild(card);
    updateHud();
    startTimer();
  }

  /* ---------- Explorer-style pointer drag ---------- */
  function startGhost() {
    const s = dragSession;
    const ghost = s.card.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.classList.remove('selected');
    ghost.style.width = `${s.w}px`;
    document.body.appendChild(ghost);
    s.ghost = ghost;
    s.card.classList.add('lifted');
    document.body.classList.add('game-grabbing');
    state.selected = false;
    sound.pick();
  }

  function moveGhost(e) {
    const s = dragSession;
    s.ghost.style.transform =
      `translate(${e.clientX - s.offX}px, ${e.clientY - s.offY}px) rotate(-4deg) scale(1.06)`;
  }

  function endGhost(s) {
    if (s.ghost) s.ghost.remove();
    s.card.classList.remove('lifted');
    document.body.classList.remove('game-grabbing');
    clearZoneHover();
  }

  function zoneFromPoint(x, y) {
    return zones.find((z) => {
      const r = z.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }) || null;
  }

  function updateHover(e) {
    const zone = zoneFromPoint(e.clientX, e.clientY);
    zones.forEach((z) => z.classList.toggle('zone-active', z === zone));
  }

  function clearZoneHover() {
    zones.forEach((z) => z.classList.remove('zone-active'));
  }

  window.addEventListener('pointermove', (e) => {
    if (!dragSession || e.pointerId !== dragSession.pointerId) return;
    const dx = e.clientX - dragSession.startX;
    const dy = e.clientY - dragSession.startY;
    if (!dragSession.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      dragSession.moved = true;
      startGhost();
    }
    moveGhost(e);
    updateHover(e);
  });

  window.addEventListener('pointerup', (e) => {
    if (!dragSession || e.pointerId !== dragSession.pointerId) return;
    const s = dragSession;
    dragSession = null;

    if (s.moved) {
      const zone = zoneFromPoint(e.clientX, e.clientY);
      endGhost(s);
      if (zone) judge(zone.dataset.zone, e.clientX, e.clientY);
    } else if (state.phase === 'playing') {
      // quick tap → toggle selection (tap a file, then tap a target)
      state.selected = !state.selected;
      s.card.classList.toggle('selected', state.selected);
      sound.pick();
    }
  });

  window.addEventListener('pointercancel', (e) => {
    if (!dragSession || e.pointerId !== dragSession.pointerId) return;
    endGhost(dragSession);
    dragSession = null;
  });

  /* ---------- Judging ---------- */
  function judge(zoneId, x = 0, y = 0) {
    const file = state.current;
    if (!file || state.phase !== 'playing') return;

    state.phase = 'transition';
    stopTimer();
    state.selected = false;

    const isCorrect = zoneId === (file.malware ? 'bin' : 'docs');

    const card = state.cardEl;
    if (card) {
      card.classList.remove('selected');
      card.classList.add(isCorrect ? 'correct' : 'wrong');
    }
    flashZone(zoneId, isCorrect);
    burst(x, y, isCorrect);

    if (isCorrect) {
      sound.correct();
      state.streak += 1;
      const bonus = Math.min(state.streak - 1, 5) * 2;
      const points = 10 + bonus;
      state.score += points;
      if (file.malware) {
        showFeedback('success', `<strong>Quarantined!</strong> ${file.reason} <strong class="gold">+${points}</strong>`);
      } else {
        showFeedback('success', `<strong>Safe!</strong> <span class="mono">${file.name}</span> is a legitimate file — filed into Documents. <strong class="gold">+${points}</strong>`);
      }
    } else {
      sound.wrong();
      state.streak = 0;
      state.lives = Math.max(0, state.lives - 1);
      if (file.malware) {
        showFeedback('error', `<strong>Oh no — that was malware!</strong> ${file.reason}`);
      } else {
        showFeedback('error', `<strong>Careful!</strong> <span class="mono">${file.name}</span> is a safe file, not malware — it belongs in the Documents folder.`);
      }
    }
    updateHud();

    clearPending();
    state.pendingTimeoutId = setTimeout(() => {
      state.pendingTimeoutId = null;
      if (state.lives <= 0) { gameOver(); return; }
      advance();
    }, isCorrect ? FEEDBACK_OK_MS : FEEDBACK_BAD_MS);
  }

  function onTimeout() {
    const file = state.current;
    if (!file || state.phase !== 'playing') return;

    state.phase = 'transition';
    state.selected = false;
    state.streak = 0;
    state.lives = Math.max(0, state.lives - 1);

    const card = state.cardEl;
    if (card) card.classList.add('wrong');

    const verdict = file.malware
      ? `<strong>Too slow — that was malware!</strong> ${file.reason}`
      : `<strong>Too slow!</strong> <span class="mono">${file.name}</span> was a safe file — it belongs in the Documents folder.`;
    showFeedback('error', verdict);
    sound.wrong();
    updateHud();

    clearPending();
    state.pendingTimeoutId = setTimeout(() => {
      state.pendingTimeoutId = null;
      if (state.lives <= 0) { gameOver(); return; }
      advance();
    }, FEEDBACK_BAD_MS);
  }

  function advance() {
    state.fileIdx += 1;
    if (state.fileIdx >= state.queue.length) {
      levelComplete();
    } else {
      showFile();
    }
  }

  /* ---------- Level flow ---------- */
  function startGame() {
    sound.ensure();
    clearPending();
    stopTimer();
    state.score = 0;
    state.lives = START_LIVES;
    state.streak = 0;
    loadLevel(0);
  }

  function loadLevel(idx) {
    state.level = idx;
    state.queue = shuffle(LEVELS[idx].files);
    state.fileIdx = 0;
    showFeedback('info', `Level ${idx + 1} — ${LEVELS[idx].hint}`);
    showFile();
  }

  function levelComplete() {
    state.phase = 'over';
    if (state.level === LEVELS.length - 1) { winGame(); return; }

    renderOverlay(`
      <p class="overlay-kicker mono">// level ${state.level + 1} cleared</p>
      <h3>Nice sorting!</h3>
      <p class="overlay-stats mono">score ${state.score} · streak ×${state.streak}</p>
      <button class="btn btn-gold" id="btn-next">Next level →</button>
      <p class="overlay-hint mono">get ready — the disguises get trickier</p>
    `);
    document.getElementById('btn-next').addEventListener('click', () => loadLevel(state.level + 1));
  }

  function winGame() {
    state.phase = 'over';
    sound.win();
    const best = Math.max(highScore(), state.score);
    saveHighScore(best);
    renderOverlay(`
      <p class="overlay-kicker mono">// all threats neutralized</p>
      <h3>System secured!</h3>
      <p>You cleared every level. Final score <strong class="gold">${state.score}</strong> — high score <span class="mono">${best}</span>.</p>
      <button class="btn btn-gold" id="btn-retry">Play again</button>
    `);
    document.getElementById('btn-retry').addEventListener('click', startGame);
  }

  function gameOver() {
    state.phase = 'over';
    const best = Math.max(highScore(), state.score);
    saveHighScore(best);
    showFeedback('error', `<strong>System compromised.</strong> The malware slipped past you — run it back?`);
    renderOverlay(`
      <p class="overlay-kicker mono">// system compromised</p>
      <h3>Game over</h3>
      <p>Final score <strong class="gold">${state.score}</strong> · high score <span class="mono">${best}</span>.</p>
      <button class="btn btn-gold" id="btn-retry">Try again</button>
    `);
    document.getElementById('btn-retry').addEventListener('click', startGame);
  }

  /* ---------- Start screen ---------- */
  function showStart() {
    state.phase = 'idle';
    const best = highScore();
    renderOverlay(`
      <p class="overlay-kicker mono">// challenge: quarantine</p>
      <h3>Malware Sorter</h3>
      <ul class="overlay-rules">
        <li><span>→</span><span>Drop <strong class="gold">malware</strong> into the 🗑️ <strong>Recycle Bin</strong></span></li>
        <li><span>→</span><span>Drop <strong class="gold">safe files</strong> into the 📁 <strong>Documents</strong> folder</span></li>
        <li><span>→</span><span>3 lives · a timer on every file — read the FULL filename!</span></li>
      </ul>
      <button class="btn btn-gold" id="btn-start">Start game</button>
      <p class="overlay-hint mono">${best ? `high score ${best} · beat it` : 'drag with your mouse or finger — tap-tap works too!'}</p>
    `);
    document.getElementById('btn-start').addEventListener('click', startGame);
  }

  /* ---------- Zone bindings (tap / keyboard fallback) ---------- */
  zones.forEach((zone) => {
    zone.addEventListener('click', () => {
      if (state.phase !== 'playing' || !state.selected) return;
      const r = zone.getBoundingClientRect();
      judge(zone.dataset.zone, r.left + r.width / 2, r.top + r.height / 2);
    });
    zone.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && state.phase === 'playing' && state.selected) {
        e.preventDefault();
        const r = zone.getBoundingClientRect();
        judge(zone.dataset.zone, r.left + r.width / 2, r.top + r.height / 2);
      }
    });
  });

  /* ---------- Sound toggle ---------- */
  function paintSoundButton() {
    soundButton.textContent = sound.enabled ? '🔊' : '🔇';
    soundButton.setAttribute('aria-label', sound.enabled ? 'Mute sounds' : 'Unmute sounds');
  }
  soundButton.addEventListener('click', () => {
    sound.enabled = !sound.enabled;
    try { localStorage.setItem(MUTE_KEY, sound.enabled ? '0' : '1'); } catch { /* ignore */ }
    paintSoundButton();
    if (sound.enabled) sound.pick();
  });

  /* ---------- Boot ---------- */
  paintSoundButton();
  updateHud();
  showStart();
})();
