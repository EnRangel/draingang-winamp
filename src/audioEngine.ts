import { EQUALIZER_BANDS, type EqualizerGains } from './playerTypes';

export type AudioEngine = {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  equalizerFilters: BiquadFilterNode[];
  analyser: AnalyserNode;
};

function createAudioEngine(
  audioElement: HTMLAudioElement,
  gains: EqualizerGains,
): AudioEngine {
  const context = new AudioContext();
  const source = context.createMediaElementSource(audioElement);
  const equalizerFilters: BiquadFilterNode[] = [];
  const analyser = context.createAnalyser();

  for (let bandIndex = 0; bandIndex < EQUALIZER_BANDS.length; bandIndex += 1) {
    const band = EQUALIZER_BANDS[bandIndex];
    const filter = context.createBiquadFilter();

    // A peaking filter raises or lowers sound near one center frequency.
    filter.type = 'peaking';
    filter.frequency.value = band.frequency;
    filter.Q.value = 1.4;
    filter.gain.value = gains[bandIndex];
    equalizerFilters.push(filter);
  }

  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.82;

  // Audio travels through all ten filters before reaching the analyser.
  source.connect(equalizerFilters[0]);

  for (
    let filterIndex = 0;
    filterIndex < equalizerFilters.length - 1;
    filterIndex += 1
  ) {
    const currentFilter = equalizerFilters[filterIndex];
    const nextFilter = equalizerFilters[filterIndex + 1];
    currentFilter.connect(nextFilter);
  }

  equalizerFilters[equalizerFilters.length - 1].connect(analyser);
  analyser.connect(context.destination);

  return {
    context,
    source,
    equalizerFilters,
    analyser,
  };
}

export function applyEqualizerGains(
  engine: AudioEngine,
  gains: EqualizerGains,
) {
  for (
    let filterIndex = 0;
    filterIndex < engine.equalizerFilters.length;
    filterIndex += 1
  ) {
    engine.equalizerFilters[filterIndex].gain.value = gains[filterIndex];
  }
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
