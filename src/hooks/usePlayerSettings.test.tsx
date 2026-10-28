import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePlayerSettings } from './usePlayerSettings';

describe('usePlayerSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads valid saved settings from localStorage', () => {
    localStorage.setItem('drainamp-volume', '42');
    localStorage.setItem('drainamp-muted', 'true');
    localStorage.setItem('drainamp-repeat', 'all');
    localStorage.setItem('drainamp-eq-bass', '6');

    const { result } = renderHook(() => usePlayerSettings());

    // result.current is the latest object returned by the custom hook.
    expect(result.current.volume).toBe(42);
    expect(result.current.isMuted).toBe(true);
    expect(result.current.repeatMode).toBe('all');
    expect(result.current.bassGain).toBe(6);
  });

  it('falls back to safe defaults for invalid saved values', () => {
    localStorage.setItem('drainamp-volume', '500');
    localStorage.setItem('drainamp-repeat', 'sometimes');
    localStorage.setItem('drainamp-eq-mid', 'not a number');

    const { result } = renderHook(() => usePlayerSettings());

    expect(result.current.volume).toBe(100);
    expect(result.current.repeatMode).toBe('off');
    expect(result.current.midGain).toBe(0);
  });

  it('saves settings after they change', async () => {
    const { result } = renderHook(() => usePlayerSettings());

    /*
     * act tells React that this block intentionally changes state, so React
     * finishes that update before the test reads the result.
     */
    act(() => {
      result.current.setVolume(35);
      result.current.setIsShuffleEnabled(true);
      result.current.setTrebleGain(-4);
    });

    await waitFor(() => {
      expect(localStorage.getItem('drainamp-volume')).toBe('35');
      expect(localStorage.getItem('drainamp-shuffle')).toBe('true');
      expect(localStorage.getItem('drainamp-eq-treble')).toBe('-4');
    });
  });
});
