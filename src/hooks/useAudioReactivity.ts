import { useEffect, type RefObject } from 'react';

/*
 * A CSS custom property is a named value such as --audio-energy. Updating it
 * changes the visuals without asking React to rebuild the whole application.
 */
export function useAudioReactivity(
  analyser: AnalyserNode | null,
  skinRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const skin = skinRef.current;

    if (analyser === null || skin === null) {
      return;
    }

    // These aliases preserve the null checks inside the repeating function.
    const activeAnalyser = analyser;
    const activeSkin = skin;
    const frequencyData = new Uint8Array(activeAnalyser.frequencyBinCount);
    let animationFrame = 0;
    let smoothedEnergy = 0;
    let bassFlash = 0;

    function updateSkinFromAudio() {
      activeAnalyser.getByteFrequencyData(frequencyData);

      let totalEnergy = 0;
      for (const frequencyValue of frequencyData) {
        totalEnergy += frequencyValue;
      }

      const currentEnergy = totalEnergy / frequencyData.length / 255;

      // The first frequency bins contain the kick and bass information.
      const bassBinCount = Math.min(8, frequencyData.length);
      let bassEnergy = 0;

      for (let binIndex = 0; binIndex < bassBinCount; binIndex += 1) {
        bassEnergy += frequencyData[binIndex];
      }

      bassEnergy = bassEnergy / bassBinCount / 255;

      // Smoothing prevents the background from shaking on every tiny change.
      smoothedEnergy += (currentEnergy - smoothedEnergy) * 0.14;

      const newBassHit = Math.max(0, (bassEnergy - 0.38) * 2.4);
      bassFlash = Math.max(newBassHit, bassFlash * 0.82);

      activeSkin.style.setProperty('--audio-energy', smoothedEnergy.toFixed(3));
      activeSkin.style.setProperty('--bass-flash', bassFlash.toFixed(3));
      activeSkin.style.setProperty(
        '--equalizer-breath-opacity',
        (0.32 + smoothedEnergy * 0.72).toFixed(3),
      );
      activeSkin.style.setProperty(
        '--equalizer-breath-scale',
        (1 + smoothedEnergy * 0.06).toFixed(4),
      );
      activeSkin.style.setProperty(
        '--active-track-glow',
        (2 + smoothedEnergy * 12).toFixed(1) + 'px',
      );
      activeSkin.style.setProperty(
        '--playlist-red-opacity',
        (0.36 + bassFlash * 0.35).toFixed(3),
      );

      // requestAnimationFrame runs once before each screen repaint.
      animationFrame = requestAnimationFrame(updateSkinFromAudio);
    }

    updateSkinFromAudio();

    return () => {
      cancelAnimationFrame(animationFrame);
      activeSkin.style.removeProperty('--audio-energy');
      activeSkin.style.removeProperty('--bass-flash');
      activeSkin.style.removeProperty('--equalizer-breath-opacity');
      activeSkin.style.removeProperty('--equalizer-breath-scale');
      activeSkin.style.removeProperty('--active-track-glow');
      activeSkin.style.removeProperty('--playlist-red-opacity');
    };
  }, [analyser, skinRef]);
}
