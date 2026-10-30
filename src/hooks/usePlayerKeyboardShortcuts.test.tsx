import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePlayerKeyboardShortcuts } from './usePlayerKeyboardShortcuts';

describe('usePlayerKeyboardShortcuts', () => {
  it('maps player keys to their matching actions', () => {
    const onPlayPause = vi.fn();
    const onSeekBackward = vi.fn();
    const onSeekForward = vi.fn();
    const onRemoveTrack = vi.fn();

    renderHook(() =>
      usePlayerKeyboardShortcuts({
        onPlayPause,
        onSeekBackward,
        onSeekForward,
        onRemoveTrack,
      }),
    );

    fireEvent.keyDown(window, { code: 'Space' });
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    fireEvent.keyDown(window, { code: 'Delete' });

    expect(onPlayPause).toHaveBeenCalledOnce();
    expect(onSeekBackward).toHaveBeenCalledOnce();
    expect(onSeekForward).toHaveBeenCalledOnce();
    expect(onRemoveTrack).toHaveBeenCalledOnce();
  });

  it('leaves keyboard control with a focused slider', () => {
    const onSeekForward = vi.fn();
    const slider = document.createElement('input');
    slider.type = 'range';
    document.body.append(slider);

    renderHook(() =>
      usePlayerKeyboardShortcuts({
        onPlayPause: vi.fn(),
        onSeekBackward: vi.fn(),
        onSeekForward,
        onRemoveTrack: vi.fn(),
      }),
    );

    fireEvent.keyDown(slider, { code: 'ArrowRight' });

    expect(onSeekForward).not.toHaveBeenCalled();
    slider.remove();
  });
});
