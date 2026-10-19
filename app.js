"use strict";

const experience = document.querySelector("#experience");
const orb = document.querySelector("#person-orb");
const orbAction = document.querySelector("#orb-action");
const sceneTitle = document.querySelector("#scene-title");
const sceneKicker = document.querySelector("#scene-kicker");
const sceneDescription = document.querySelector("#scene-description");
const sceneHint = document.querySelector("#scene-hint");
const fireScene = document.querySelector(".scene-fire");
const footerIndex = document.querySelector("#footer-index");
const announcement = document.querySelector("#announcement");
const soundToggle = document.querySelector("#sound-toggle");
const soundLabel = soundToggle.querySelector(".sound-label");
const canvas = document.querySelector("#sky-canvas");
const context = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let visits = 0;
let stars = [];
let embers = [];
let audioContext;
let ambientGain;
let audioIsOn = false;
let frame = 0;

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * pixelRatio);
  canvas.height = Math.round(window.innerHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  stars = Array.from({ length: Math.min(190, Math.floor(window.innerWidth / 6)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.15 + 0.15,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.018 + 0.004,
  }));
}

function drawSky() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const finale = experience.classList.contains("is-finale");
  context.clearRect(0, 0, width, height);
  frame += 1;

  stars.forEach((star) => {
    const shimmer = reduceMotion.matches ? 0.7 : 0.42 + (Math.sin(frame * star.speed + star.phase) + 1) * 0.28;
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fillStyle = finale
      ? `rgba(255, ${Math.round(168 + shimmer * 55)}, ${Math.round(136 + shimmer * 45)}, ${shimmer * 0.55})`
      : `rgba(221, 210, 240, ${shimmer * 0.72})`;
    context.fill();
  });

  if (finale) drawEmbers(width, height);
  if (!reduceMotion.matches) window.requestAnimationFrame(drawSky);
}

function drawEmbers(width, height) {
  if (embers.length < 45 && Math.random() > 0.68) {
    embers.push({
      x: Math.random() * width,
      y: height + 4,
      rise: Math.random() * 1.1 + 0.35,
      drift: (Math.random() - 0.5) * 0.55,
      radius: Math.random() * 1.8 + 0.45,
      opacity: Math.random() * 0.55 + 0.2,
    });
  }

  embers = embers.filter((ember) => ember.y > height * 0.2 && ember.opacity > 0.04);
  embers.forEach((ember) => {
    ember.y -= ember.rise;
    ember.x += ember.drift;
    ember.opacity *= 0.997;
    context.beginPath();
    context.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(255, ${Math.floor(115 + ember.opacity * 130)}, ${Math.floor(50 + ember.opacity * 75)}, ${ember.opacity})`;
    context.shadowBlur = 10;
    context.shadowColor = "rgba(255, 100, 44, 0.7)";
    context.fill();
  });
  context.shadowBlur = 0;
}

function updateToBusy() {
  orb.classList.add("is-busy");
  orb.setAttribute("aria-label", "Manoj bhai is busy. Click to continue.");
  orbAction.innerHTML = 'KNOCK AGAIN <span aria-hidden="true">↗</span>';
  sceneTitle.innerHTML = "He’s a little<br><span>occupied.</span>";
  sceneKicker.textContent = "Transmission received";
  sceneDescription.textContent = "Manoj bhai is busy right now. Try one more time.";
  sceneHint.textContent = "SIGNAL RECEIVED: HE'S BUSY";
  announcement.textContent = "Manoj bhai is busy. Click Manoj bhai again to continue.";
}

function endTheJourney() {
  experience.classList.add("is-finale");
  orb.disabled = true;
  fireScene.setAttribute("aria-hidden", "false");
  document.querySelector(".scene-galaxy").setAttribute("aria-hidden", "true");
  footerIndex.innerHTML = '02 <span>/</span> 02';
  announcement.textContent = "The final stop. jeeven is sleeping.";
  drawSky();
}

orb.addEventListener("click", () => {
  visits += 1;
  if (visits === 1) {
    updateToBusy();
    return;
  }
  endTheJourney();
});

function startAmbientSound() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      soundToggle.disabled = true;
      soundToggle.title = "Ambient sound is not supported in this browser.";
      return;
    }

    audioContext = new AudioContextClass();
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 240;
    filter.Q.value = 0.7;
    ambientGain = audioContext.createGain();
    ambientGain.gain.value = 0;
    filter.connect(ambientGain);
    ambientGain.connect(audioContext.destination);

    [
      { frequency: 55, type: "sine", volume: 0.55 },
      { frequency: 82.41, type: "triangle", volume: 0.16 },
      { frequency: 110.2, type: "sine", volume: 0.08 },
    ].forEach((tone) => {
      const oscillator = audioContext.createOscillator();
      const toneGain = audioContext.createGain();
      oscillator.type = tone.type;
      oscillator.frequency.value = tone.frequency;
      toneGain.gain.value = tone.volume;
      oscillator.connect(toneGain);
      toneGain.connect(filter);
      oscillator.start();
    });
  }

  audioContext.resume();
  audioIsOn = !audioIsOn;
  ambientGain.gain.cancelScheduledValues(audioContext.currentTime);
  ambientGain.gain.setTargetAtTime(audioIsOn ? 0.035 : 0, audioContext.currentTime, 0.8);
  soundToggle.setAttribute("aria-pressed", String(audioIsOn));
  soundToggle.setAttribute("aria-label", audioIsOn ? "Turn ambient sound off" : "Turn ambient sound on");
  soundLabel.textContent = audioIsOn ? "SOUND ON" : "SOUND OFF";
}

soundToggle.addEventListener("click", startAmbientSound);
window.addEventListener("resize", resizeCanvas, { passive: true });

resizeCanvas();
drawSky();
