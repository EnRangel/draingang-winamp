import { useEffect, useState } from 'react';

import type { RepeatMode } from '../playerTypes';

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
  const [bassGain, setBassGain] = useState(() =>
    loadSavedNumber('drainamp-eq-bass', 0, -12, 12),
  );
  const [midGain, setMidGain] = useState(() =>
    loadSavedNumber('drainamp-eq-mid', 0, -12, 12),
  );
  const [trebleGain, setTrebleGain] = useState(() =>
    loadSavedNumber('drainamp-eq-treble', 0, -12, 12),
  );

  useEffect(() => {
    localStorage.setItem('drainamp-volume', String(volume));
    localStorage.setItem('drainamp-muted', String(isMuted));
    localStorage.setItem('drainamp-shuffle', String(isShuffleEnabled));
    localStorage.setItem('drainamp-repeat', repeatMode);
    localStorage.setItem('drainamp-eq-bass', String(bassGain));
    localStorage.setItem('drainamp-eq-mid', String(midGain));
    localStorage.setItem('drainamp-eq-treble', String(trebleGain));
  }, [
    volume,
    isMuted,
    isShuffleEnabled,
    repeatMode,
    bassGain,
    midGain,
    trebleGain,
  ]);

  return {
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isShuffleEnabled,
    setIsShuffleEnabled,
    repeatMode,
    setRepeatMode,
    bassGain,
    setBassGain,
    midGain,
    setMidGain,
    trebleGain,
    setTrebleGain,
  };
}
