import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  findNextTrackIndex,
  formatTime,
  isSupportedAudioFile,
} from './playerUtils';

describe('formatTime', () => {
  it('formats seconds as minutes and two-digit seconds', () => {
    expect(formatTime(65.9)).toBe('1:05');
  });

  it('uses zero for invalid or negative time values', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatTime(-1)).toBe('0:00');
  });
});

describe('isSupportedAudioFile', () => {
  it('accepts a file whose browser type says it is audio', () => {
    const file = new File(['audio data'], 'song.custom', {
      type: 'audio/mpeg',
    });

    expect(isSupportedAudioFile(file)).toBe(true);
  });

  it('accepts supported extensions even when Windows supplies no type', () => {
    const mp3File = new File(['audio data'], 'SONG.MP3');
    const flacFile = new File(['audio data'], 'song.flac');

    expect(isSupportedAudioFile(mp3File)).toBe(true);
    expect(isSupportedAudioFile(flacFile)).toBe(true);
  });

  it('rejects a non-audio file', () => {
    const textFile = new File(['notes'], 'notes.txt', {
      type: 'text/plain',
    });

    expect(isSupportedAudioFile(textFile)).toBe(false);
  });
});

describe('findNextTrackIndex', () => {
  afterEach(() => {
    // Restore Math.random after a test replaces it with a predictable value.
    vi.restoreAllMocks();
  });

  it('returns -1 when the playlist is empty', () => {
    expect(findNextTrackIndex(0, -1, false, 'off', false)).toBe(-1);
  });

  it('moves to the following track', () => {
    expect(findNextTrackIndex(3, 0, false, 'off', false)).toBe(1);
  });

  it('stops after the last track when repeat is off', () => {
    expect(findNextTrackIndex(3, 2, true, 'off', false)).toBe(-1);
  });

  it('wraps to the first track when repeat all is on', () => {
    expect(findNextTrackIndex(3, 2, true, 'all', false)).toBe(0);
  });

  it('replays the current track after it ends when repeat one is on', () => {
    expect(findNextTrackIndex(3, 1, true, 'one', false)).toBe(1);
  });

  it('does not replay repeat one when the user clicks next', () => {
    expect(findNextTrackIndex(3, 1, false, 'one', false)).toBe(2);
  });

  it('chooses a different track when shuffle is on', () => {
    // The mock makes this random test predictable on every run.
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(findNextTrackIndex(4, 1, false, 'off', true)).toBe(2);
  });
});
