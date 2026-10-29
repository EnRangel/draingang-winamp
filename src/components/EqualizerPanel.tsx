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
  /*
   * The reference has ten narrow faders. For now, those faders share our
   * existing three audio filters in groups. This keeps the audio code simple:
   * the low faders control bass, the middle faders control mids, and the high
   * faders control treble. We can make all ten independent in a later step.
   */
  const equalizerBands = [
    { label: '60', group: 'bass', gain: bassGain, onChange: onBassChange },
    { label: '170', group: 'bass', gain: bassGain, onChange: onBassChange },
    { label: '310', group: 'bass', gain: bassGain, onChange: onBassChange },
    { label: '600', group: 'mid', gain: midGain, onChange: onMidChange },
    { label: '1K', group: 'mid', gain: midGain, onChange: onMidChange },
    { label: '3K', group: 'mid', gain: midGain, onChange: onMidChange },
    { label: '6K', group: 'mid', gain: midGain, onChange: onMidChange },
    {
      label: '12K',
      group: 'treble',
      gain: trebleGain,
      onChange: onTrebleChange,
    },
    {
      label: '14K',
      group: 'treble',
      gain: trebleGain,
      onChange: onTrebleChange,
    },
    {
      label: '16K',
      group: 'treble',
      gain: trebleGain,
      onChange: onTrebleChange,
    },
  ];

  return (
    <section className="equalizer-panel">
      <div className="panel-heading equalizer-heading">
        <span className="equalizer-title">EQUALIZER</span>
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
          {equalizerBands.map((band) => (
            <label className="equalizer-fader" key={band.label}>
              <input
                aria-label={`${band.label} Hz ${band.group} ${band.gain}`}
                type="range"
                min="-12"
                max="12"
                step="1"
                value={band.gain}
                onChange={band.onChange}
              />
              <span>{band.label}</span>
            </label>
          ))}
        </div>

        <div className="equalizer-art" aria-hidden="true">
          <span className="butterfly-mark">ƸӜƷ</span>
        </div>
      </div>
    </section>
  );
}

export default EqualizerPanel;
