import type { ChangeEvent } from 'react';

type EqualizerPanelProps = {
  bassGain: number;
  midGain: number;
  trebleGain: number;
  onBassChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMidChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTrebleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
};

function EqualizerPanel({
  bassGain,
  midGain,
  trebleGain,
  onBassChange,
  onMidChange,
  onTrebleChange,
  onReset,
}: EqualizerPanelProps) {
  return (
    <section className="equalizer-panel">
      <div className="panel-heading">
        <span>EQUALIZER // ±12 dB</span>
        <button className="tiny-button" type="button" onClick={onReset}>
          RESET
        </button>
      </div>

      <div className="equalizer-bands">
        <label className="equalizer-band">
          <span>BASS {bassGain}</span>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={bassGain}
            onChange={onBassChange}
          />
        </label>

        <label className="equalizer-band">
          <span>MID {midGain}</span>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={midGain}
            onChange={onMidChange}
          />
        </label>

        <label className="equalizer-band">
          <span>TREBLE {trebleGain}</span>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={trebleGain}
            onChange={onTrebleChange}
          />
        </label>
      </div>
    </section>
  );
}

export default EqualizerPanel;
