(() => {
  const ageSection = document.querySelector(".age");
  const confettiBurstBtn = document.getElementById("confettiBurst");
  const candles = [...document.querySelectorAll(".candle")];
  const cakeMessage = document.getElementById("cakeMessage");
  const wishButtons = [...document.querySelectorAll(".wish")];
  const wishEcho = document.getElementById("wishEcho");
  const musicToggle = document.getElementById("musicToggle");
  const petalsCanvas = document.getElementById("petals");

  let audioCtx = null;
  let musicOn = false;
  const localMusic = document.getElementById("localMusic");
  const nowPlaying = document.getElementById("nowPlaying");
  const musicClose = document.getElementById("musicClose");

  /* ---------- Petals / floating particles ---------- */
  const ctx = petalsCanvas.getContext("2d");
  const petals = [];
  const PETAL_COUNT = 28;

  function resizeCanvas() {
    petalsCanvas.width = window.innerWidth;
    petalsCanvas.height = window.innerHeight;
  }

  function makePetal() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 4 + Math.random() * 8,
      vx: -0.3 + Math.random() * 0.6,
      vy: 0.25 + Math.random() * 0.55,
      rot: Math.random() * Math.PI * 2,
      vr: -0.02 + Math.random() * 0.04,
      color: Math.random() > 0.5 ? "rgba(232,135,122,0.55)" : "rgba(244,184,168,0.5)",
    };
  }

  function initPetals() {
    petals.length = 0;
    for (let i = 0; i < PETAL_COUNT; i++) petals.push(makePetal());
  }

  function drawPetals() {
    ctx.clearRect(0, 0, petalsCanvas.width, petalsCanvas.height);
    for (const p of petals) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      if (p.y > petalsCanvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * petalsCanvas.width;
      }
      if (p.x < -20) p.x = petalsCanvas.width + 20;
      if (p.x > petalsCanvas.width + 20) p.x = -20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(drawPetals);
  }

  resizeCanvas();
  initPetals();
  drawPetals();
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  /* ---------- Confetti ---------- */
  function burstConfetti(count = 80, originX = window.innerWidth / 2, originY = window.innerHeight * 0.35) {
    const colors = ["#e8877a", "#f4b8a8", "#d4a574", "#c9d7e8", "#b8d4c8", "#fff7f0"];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "confetti-piece";
      const angle = Math.random() * Math.PI * 2;
      const velocity = 4 + Math.random() * 14;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity - 6;
      const size = 6 + Math.random() * 8;
      const rot = Math.random() * 720;
      el.style.cssText = `
        position: fixed;
        left: ${originX}px;
        top: ${originY}px;
        width: ${size}px;
        height: ${size * (0.4 + Math.random() * 0.8)}px;
        background: ${colors[i % colors.length]};
        border-radius: ${Math.random() > 0.5 ? "2px" : "50%"};
        pointer-events: none;
        z-index: 100;
        opacity: 1;
        transform: translate(0,0) rotate(0deg);
        transition: transform 1.6s cubic-bezier(0.15, 0.75, 0.25, 1), opacity 1.6s ease;
      `;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = `translate(${dx * 28}px, ${dy * 28 + 180}px) rotate(${rot}deg)`;
        el.style.opacity = "0";
      });
      setTimeout(() => el.remove(), 1700);
    }
  }

  confettiBurstBtn.addEventListener("click", (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    burstConfetti(70, rect.left + rect.width / 2, rect.top);
    playChime();
  });

  /* ---------- Age flip ---------- */
  const ageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => ageSection.classList.add("is-flipped"), 400);
          ageObserver.disconnect();
        }
      });
    },
    { threshold: 0.45 }
  );
  ageObserver.observe(ageSection);

  /* ---------- Wishes ---------- */
  const echoes = {
    1: "Wish locked in. Soft love, always.",
    2: "Wish locked in. Dreams louder than doubts.",
    3: "Wish locked in. Soft joy on repeat.",
  };

  wishButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      wishButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      wishEcho.textContent = echoes[btn.dataset.wish] || "Wish saved.";
      wishEcho.classList.add("is-visible");
      playTone(520, 0.12);
    });
  });

  /* ---------- Cake candles ---------- */
  function updateCakeMessage() {
    const remaining = candles.filter((c) => !c.classList.contains("is-out")).length;
    if (remaining === 3) cakeMessage.textContent = "The candles are waiting…";
    else if (remaining > 0) cakeMessage.textContent = `${remaining} candle${remaining > 1 ? "s" : ""} left - keep going.`;
    else {
      cakeMessage.textContent = "Wish made. Happy 23rd, queen.";
      burstConfetti(100);
      playChime(true);
    }
  }

  candles.forEach((candle) => {
    candle.addEventListener("click", () => {
      if (candle.classList.contains("is-out")) return;
      candle.classList.add("is-out");
      playTone(280, 0.08);
      updateCakeMessage();
    });
  });

  /* ---------- Soft UI chimes (still used for confetti / cake) ---------- */
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, duration = 0.15, type = "sine", gain = 0.04) {
    try {
      const ac = ensureAudio();
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = gain;
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (_) {
      /* ignore audio errors */
    }
  }

  function playChime(big = false) {
    const notes = big ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.22, "triangle", 0.035), i * 110));
  }

  /* ---------- Long Live (local video/audio) ---------- */
  function setMusicUi(on) {
    musicOn = on;
    musicToggle.setAttribute("aria-pressed", String(on));
    const label = document.getElementById("musicLabel");
    if (label) label.textContent = on ? "pause song" : "play song";
    musicToggle.setAttribute(
      "aria-label",
      on ? "Pause Long Live - Taylor Swift" : "Play Long Live - Taylor Swift"
    );
  }

  async function startSong() {
    if (!localMusic) return;
    setMusicUi(true);
    // Keep in DOM for playback; CSS hides the UI on mobile
    if (nowPlaying) nowPlaying.hidden = false;
    try {
      localMusic.currentTime = 0;
      localMusic.muted = false;
      await localMusic.play();
    } catch (err) {
      console.warn("Playback blocked:", err);
    }
  }

  function stopSong() {
    setMusicUi(false);
    if (localMusic) {
      localMusic.pause();
      localMusic.currentTime = 0;
    }
    if (nowPlaying) nowPlaying.hidden = true;
  }

  musicToggle.addEventListener("click", () => {
    if (musicOn) stopSong();
    else startSong();
  });

  if (musicClose) {
    musicClose.addEventListener("click", stopSong);
  }

  if (localMusic) {
    localMusic.addEventListener("ended", () => {
      if (musicOn) {
        localMusic.currentTime = 0;
        localMusic.play().catch(() => {});
      }
    });
  }
})();
