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
    localStorage.setItem('drainamp-eq-60', '6');
    localStorage.setItem('drainamp-eq-170', '-3');

    const { result } = renderHook(() => usePlayerSettings());

    // result.current is the latest object returned by the custom hook.
    expect(result.current.volume).toBe(42);
    expect(result.current.isMuted).toBe(true);
    expect(result.current.repeatMode).toBe('all');
    expect(result.current.equalizerGains[0]).toBe(6);
    expect(result.current.equalizerGains[1]).toBe(-3);
  });

  it('falls back to safe defaults for invalid saved values', () => {
    localStorage.setItem('drainamp-volume', '500');
    localStorage.setItem('drainamp-repeat', 'sometimes');
    localStorage.setItem('drainamp-eq-1000', 'not a number');

    const { result } = renderHook(() => usePlayerSettings());

    expect(result.current.volume).toBe(100);
    expect(result.current.repeatMode).toBe('off');
    expect(result.current.equalizerGains[4]).toBe(0);
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
      const updatedGains = result.current.equalizerGains.slice();
      updatedGains[9] = -4;
      result.current.setEqualizerGains(updatedGains);
    });

    await waitFor(() => {
      expect(localStorage.getItem('drainamp-volume')).toBe('35');
      expect(localStorage.getItem('drainamp-shuffle')).toBe('true');
      expect(localStorage.getItem('drainamp-eq-16000')).toBe('-4');
    });
  });
});
