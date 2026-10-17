/* ==========================================================================
   sound.js — Sons courts synthétisés avec la Web Audio API (aucun fichier)
   ========================================================================== */
(function (root) {
  'use strict';
  let ctx = null, enabled = true;

  function ac() {
    if (!enabled) return null;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* Une note avec enveloppe douce ; glide = fréquence d'arrivée */
  function tone(opts) {
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + (opts.delay || 0);
    const osc = a.createOscillator(), gain = a.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.glide) osc.frequency.exponentialRampToValueAtTime(opts.glide, t0 + opts.dur * 0.6);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(opts.vol || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    let node = osc;
    if (opts.lowpass) {
      const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.lowpass;
      osc.connect(f); node = f;
    }
    node.connect(gain); gain.connect(a.destination);
    osc.start(t0); osc.stop(t0 + opts.dur + 0.02);
  }

  const semis = function (n) { return Math.pow(2, n / 12); };

  const Sound = {
    setEnabled: function (v) { enabled = !!v; if (!enabled && ctx) ctx.suspend(); },
    unlock: function () { ac(); },
    /* Bonne réponse : note qui monte, un peu plus aiguë à chaque palier de combo */
    correct: function (tierIndex) {
      const base = 523.25 * semis(2 * (tierIndex || 0));
      tone({ freq: base, glide: base * 1.5, dur: 0.22, type: 'triangle', vol: 0.10 });
      tone({ freq: base * 2, glide: base * 3, dur: 0.16, type: 'sine', vol: 0.03 });
    },
    /* Erreur : son mat, grave et discret */
    wrong: function () {
      tone({ freq: 150, glide: 95, dur: 0.20, type: 'triangle', vol: 0.11, lowpass: 500 });
    },
    /* Passage de niveau : petit arpège majeur */
    levelUp: function () {
      [0, 4, 7, 12, 16].forEach(function (s, i) {
        tone({ freq: 392 * semis(s), dur: 0.32, type: 'triangle', vol: 0.09, delay: i * 0.085 });
        tone({ freq: 784 * semis(s), dur: 0.22, type: 'sine', vol: 0.025, delay: i * 0.085 });
      });
    },
    /* Objectif du jour atteint : deux notes claires */
    goal: function () {
      tone({ freq: 659.25, dur: 0.25, type: 'sine', vol: 0.09 });
      tone({ freq: 987.77, dur: 0.4, type: 'sine', vol: 0.08, delay: 0.12 });
    },
    /* Retournement de carte : clic très léger */
    flip: function () { tone({ freq: 900, glide: 600, dur: 0.05, type: 'sine', vol: 0.025 }); },
    tick: function () { tone({ freq: 1200, dur: 0.04, type: 'square', vol: 0.015, lowpass: 2500 }); }
  };
  root.Sound = Sound;
})(self);
