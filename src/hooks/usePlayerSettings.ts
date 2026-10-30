import { useEffect, useState } from 'react';

import {
  EQUALIZER_BANDS,
  type EqualizerGains,
  type RepeatMode,
} from '../playerTypes';

function loadSavedNumber(
  settingName: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const savedValue = localStorage.getItem(settingName);

  if (savedValue === null) {
    return fallback;
  }

  const parsedValue = Number(savedValue);

  if (Number.isFinite(parsedValue) === false) {
    return fallback;
  }

  if (parsedValue < minimum || parsedValue > maximum) {
    return fallback;
  }

  return parsedValue;
}

function loadSavedBoolean(settingName: string): boolean {
  return localStorage.getItem(settingName) === 'true';
}

function loadSavedRepeatMode(): RepeatMode {
  const savedMode = localStorage.getItem('drainamp-repeat');

  if (savedMode === 'all' || savedMode === 'one') {
    return savedMode;
  }

  return 'off';
}

function loadSavedEqualizerGains(): EqualizerGains {
  const savedGains: number[] = [];

  for (const band of EQUALIZER_BANDS) {
    const settingName = 'drainamp-eq-' + String(band.frequency);
    savedGains.push(loadSavedNumber(settingName, 0, -12, 12));
  }

  return savedGains;
}

/*
 * A custom hook is a reusable function whose name begins with "use". It can
 * contain React state and effects while keeping App.tsx focused on coordination.
 */
export function usePlayerSettings() {
  const [volume, setVolume] = useState(() =>
    loadSavedNumber('drainamp-volume', 100, 0, 100),
  );
  const [isMuted, setIsMuted] = useState(() =>
    loadSavedBoolean('drainamp-muted'),
  );
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(() =>
    loadSavedBoolean('drainamp-shuffle'),
  );
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(loadSavedRepeatMode);
  const [equalizerGains, setEqualizerGains] = useState<EqualizerGains>(
    loadSavedEqualizerGains,
  );

  useEffect(() => {
    localStorage.setItem('drainamp-volume', String(volume));
    localStorage.setItem('drainamp-muted', String(isMuted));
    localStorage.setItem('drainamp-shuffle', String(isShuffleEnabled));
    localStorage.setItem('drainamp-repeat', repeatMode);
    for (
      let bandIndex = 0;
      bandIndex < EQUALIZER_BANDS.length;
      bandIndex += 1
    ) {
      const frequency = EQUALIZER_BANDS[bandIndex].frequency;
      const settingName = 'drainamp-eq-' + String(frequency);
      localStorage.setItem(settingName, String(equalizerGains[bandIndex]));
    }
  }, [volume, isMuted, isShuffleEnabled, repeatMode, equalizerGains]);

  return {
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isShuffleEnabled,
    setIsShuffleEnabled,
    repeatMode,
    setRepeatMode,
    equalizerGains,
    setEqualizerGains,
  };
}
