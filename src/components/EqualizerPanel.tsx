import type { ChangeEvent } from 'react';

import { EQUALIZER_BANDS, type EqualizerGains } from '../playerTypes';

type EqualizerPanelProps = {
  equalizerGains: EqualizerGains;
  onGainChange: (
    bandIndex: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onReset: () => void;
};

function EqualizerPanel({
  equalizerGains,
  onGainChange,
  onReset,
}: EqualizerPanelProps) {
  return (
    <section className="equalizer-panel">
      <div className="panel-heading equalizer-heading">
        <span className="equalizer-heading-chain" aria-hidden="true" />

        <div className="equalizer-actions">
          <span className="equalizer-switch equalizer-switch-active">ON</span>
          <span className="equalizer-switch">AUTO</span>
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
