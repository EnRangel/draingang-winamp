import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Track } from './audioMetadata';
import { loadSavedPlaylist, savePlaylist } from './playlistStorage';

const track: Track = {
  fileName: 'glass-wings.mp3',
  filePath: 'C:\\Music\\glass-wings.mp3',
  fileType: 'audio/mpeg',
  title: 'Glass Wings',
  artist: 'Drain Artist',
  album: 'Test Album',
  source: 'blob:temporary-audio-url',
  artworkSource: 'blob:temporary-artwork-url',
  duration: '4:21',
};

describe('playlistStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves permanent file details instead of temporary blob URLs', () => {
    savePlaylist([track]);

    expect(loadSavedPlaylist()).toEqual([
      {
        fileName: 'glass-wings.mp3',
        filePath: 'C:\\Music\\glass-wings.mp3',
        fileType: 'audio/mpeg',
      },
    ]);
  });

  it('ignores invalid saved data instead of crashing', () => {
    localStorage.setItem('drainamp-playlist', '{broken json');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(loadSavedPlaylist()).toEqual([]);
  });
});
