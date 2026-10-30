// RepeatMode only allows these three exact string values.
export type RepeatMode = 'off' | 'all' | 'one';

export type EqualizerBand = {
  label: string;
  frequency: number;
};

export type EqualizerPreset = {
  name: string;
  gains: number[];
};

/*
 * Each object describes one visible slider and its matching audio frequency.
 * Keeping this list in one file prevents the interface and audio engine from
 * accidentally using different band orders.
 */
export const EQUALIZER_BANDS: EqualizerBand[] = [
  { label: '60', frequency: 60 },
  { label: '170', frequency: 170 },
  { label: '310', frequency: 310 },
  { label: '600', frequency: 600 },
  { label: '1K', frequency: 1000 },
  { label: '3K', frequency: 3000 },
  { label: '6K', frequency: 6000 },
  { label: '12K', frequency: 12000 },
  { label: '14K', frequency: 14000 },
  { label: '16K', frequency: 16000 },
];

// The number at each array position belongs to the band at the same position.
export type EqualizerGains = number[];

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: 'FLAT', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'BASS', gains: [6, 5, 3, 1, 0, -1, -1, 0, 1, 2] },
  { name: 'VOCAL', gains: [-2, -1, 0, 3, 5, 5, 3, 1, 0, -1] },
  { name: 'TREBLE', gains: [-2, -2, -1, 0, 1, 2, 4, 6, 5, 4] },
  { name: 'DRAIN', gains: [5, 4, 2, -1, -2, 1, 4, 3, 1, 0] },
];

export function findEqualizerPresetName(gains: EqualizerGains): string {
  for (const preset of EQUALIZER_PRESETS) {
    let matchesPreset = true;

    for (let bandIndex = 0; bandIndex < preset.gains.length; bandIndex += 1) {
      if (preset.gains[bandIndex] !== gains[bandIndex]) {
        matchesPreset = false;
        break;
      }
    }

    if (matchesPreset) {
      return preset.name;
    }
  }

  return 'CUSTOM';
}
