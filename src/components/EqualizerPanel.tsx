import type { ChangeEvent } from 'react';

import {
  EQUALIZER_BANDS,
  EQUALIZER_PRESETS,
  findEqualizerPresetName,
  type EqualizerGains,
} from '../playerTypes';

type EqualizerPanelProps = {
  isEqualizerEnabled: boolean;
  equalizerGains: EqualizerGains;
  onToggle: () => void;
  onPresetChange: (presetName: string) => void;
  onGainChange: (
    bandIndex: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onReset: () => void;
};

function EqualizerPanel({
  isEqualizerEnabled,
  equalizerGains,
  onToggle,
  onPresetChange,
  onGainChange,
  onReset,
}: EqualizerPanelProps) {
  const selectedPresetName = findEqualizerPresetName(equalizerGains);

  return (
    <section className="equalizer-panel">
      <div className="panel-heading equalizer-heading">
        <span className="equalizer-heading-chain" aria-hidden="true" />

        <div className="equalizer-actions">
          <button
            className={
              isEqualizerEnabled
                ? 'equalizer-switch equalizer-switch-active'
                : 'equalizer-switch'
            }
            type="button"
            aria-pressed={isEqualizerEnabled}
            onClick={onToggle}
          >
            {isEqualizerEnabled ? 'ON' : 'OFF'}
          </button>

          <select
            className="equalizer-preset-select"
            aria-label="Equalizer preset"
            value={selectedPresetName}
            onChange={(event) => onPresetChange(event.target.value)}
          >
            <option value="CUSTOM" disabled>
              CUSTOM
            </option>
            {EQUALIZER_PRESETS.map((preset) => (
              <option value={preset.name} key={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>

          <button className="tiny-button" type="button" onClick={onReset}>
            RESET
          </button>
        </div>
      </div>

      <div className="equalizer-body">
        <div className="decibel-scale" aria-hidden="true">
          <span>+12dB</span>
          <span>0dB</span>
          <span>-12dB</span>
        </div>

        <div className="equalizer-bands">
          {/* map() creates one matching slider for every item in the array. */}
          {EQUALIZER_BANDS.map((band, bandIndex) => (
            <label className="equalizer-fader" key={band.label}>
              <input
                aria-label={`${band.label} Hz gain ${equalizerGains[bandIndex]}`}
                type="range"
                min="-12"
                max="12"
                step="1"
                value={equalizerGains[bandIndex]}
                onChange={(event) => onGainChange(bandIndex, event)}
              />
              <span>{band.label}</span>
            </label>
          ))}
        </div>

        <div className="equalizer-art" aria-hidden="true">
          <span className="equalizer-heart-mark" />
        </div>
      </div>
    </section>
  );
}

export default EqualizerPanel;
