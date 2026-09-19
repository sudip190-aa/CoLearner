// Deterministic synthetic microphone fixture. No recording or personal audio.
// Chromium: --use-file-for-fake-audio-capture=<absolute .dist/voice-test.wav>
import { mkdirSync, writeFileSync } from "node:fs";
const rate = 48000,
  seconds = 12,
  samples = rate * seconds;
const wav = Buffer.alloc(44 + samples * 2);
wav.write("RIFF");
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(samples * 2, 40);
let phase = 0;
for (let i = 0; i < samples; i++) {
  const t = i / rate;
  // Vary pitch and amplitude to avoid a steady calibration tone being removed
  // by microphone noise suppression. A small floor keeps every window audible.
  const frequency = 170 + 80 * Math.sin(t * 4.1) + 30 * Math.sin(t * 13.7);
  phase += (2 * Math.PI * frequency) / rate;
  const envelope = 0.18 + 0.12 * Math.sin(t * 8.2) ** 2;
  const signal =
    envelope *
    (Math.sin(phase) + 0.35 * Math.sin(phase * 2) + 0.2 * Math.sin(phase * 3));
  wav.writeInt16LE(Math.round(signal * 22000), 44 + i * 2);
}
mkdirSync(".dist", { recursive: true });
writeFileSync(".dist/voice-test.wav", wav);
console.log("Created ignored .dist/voice-test.wav");
