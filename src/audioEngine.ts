import type { EqualizerGains } from './playerTypes';

export type AudioEngine = {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  bassFilter: BiquadFilterNode;
  midFilter: BiquadFilterNode;
  trebleFilter: BiquadFilterNode;
  analyser: AnalyserNode;
};

function createAudioEngine(
  audioElement: HTMLAudioElement,
  gains: EqualizerGains,
): AudioEngine {
  const context = new AudioContext();
  const source = context.createMediaElementSource(audioElement);
  const bassFilter = context.createBiquadFilter();
  const midFilter = context.createBiquadFilter();
  const trebleFilter = context.createBiquadFilter();
  const analyser = context.createAnalyser();

  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 220;
  bassFilter.gain.value = gains.bass;

  midFilter.type = 'peaking';
  midFilter.frequency.value = 1000;
  midFilter.Q.value = 1;
  midFilter.gain.value = gains.mid;

  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 4500;
  trebleFilter.gain.value = gains.treble;

  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.82;

  // Audio travels through each filter and analyser before the speakers.
  source.connect(bassFilter);
  bassFilter.connect(midFilter);
  midFilter.connect(trebleFilter);
  trebleFilter.connect(analyser);
  analyser.connect(context.destination);

  return {
    context,
    source,
    bassFilter,
    midFilter,
    trebleFilter,
    analyser,
  };
}

export function applyEqualizerGains(
  engine: AudioEngine,
  gains: EqualizerGains,
) {
  engine.bassFilter.gain.value = gains.bass;
  engine.midFilter.gain.value = gains.mid;
  engine.trebleFilter.gain.value = gains.treble;
}

export async function ensureAudioEngine(
  audioElement: HTMLAudioElement,
  existingEngine: AudioEngine | null,
  gains: EqualizerGains,
): Promise<AudioEngine> {
  let engine = existingEngine;

  if (engine === null) {
    engine = createAudioEngine(audioElement, gains);
  }

  applyEqualizerGains(engine, gains);

  // Browsers begin audio contexts suspended until the user presses play.
  if (engine.context.state === 'suspended') {
    await engine.context.resume();
  }

  return engine;
}

export async function closeAudioEngine(engine: AudioEngine | null) {
  if (engine === null || engine.context.state === 'closed') {
    return;
  }

  await engine.context.close();
}
