import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Track } from '../audioMetadata';
import PlaylistPanel from './PlaylistPanel';

const tracks: Track[] = [
  {
    fileName: 'glass-wings.mp3',
    title: 'Glass Wings',
    artist: 'Drain Artist',
    album: 'Test Album',
    source: 'blob:glass-wings',
    artworkSource: '',
  },
  {
    fileName: 'empty-orbits.mp3',
    title: 'Empty Orbits',
    artist: 'Drain Artist',
    album: 'Test Album',
    source: 'blob:empty-orbits',
    artworkSource: '',
  },
];

function renderPlaylist(
  playlist: Track[],
  currentTrackIndex: number,
  onTrackClick = vi.fn(),
) {
  return render(
    <PlaylistPanel
      playlist={playlist}
      currentTrackIndex={currentTrackIndex}
      isDraggingFile={false}
      isAddingTracks={false}
      onFileChange={vi.fn()}
      onRemove={vi.fn()}
      onClear={vi.fn()}
      onTrackClick={onTrackClick}
      onDragEnter={vi.fn()}
      onDragOver={vi.fn()}
      onDragLeave={vi.fn()}
      onDrop={vi.fn()}
    />,
  );
}

describe('PlaylistPanel', () => {
  it('renders playlist metadata and marks the active track', () => {
    renderPlaylist(tracks, 0);

    expect(screen.getByText('PLAYLIST // 2')).toBeInTheDocument();
    expect(screen.getByText('Glass Wings')).toBeInTheDocument();
    expect(screen.getByText('Empty Orbits')).toBeInTheDocument();
    expect(screen.getByTitle('glass-wings.mp3')).toHaveClass(
      'playlist-track-active',
    );
  });

  it('reports which track the user clicks', async () => {
    const user = userEvent.setup();
    const handleTrackClick = vi.fn();
    renderPlaylist(tracks, 0, handleTrackClick);

    await user.click(screen.getByTitle('empty-orbits.mp3'));

    expect(handleTrackClick).toHaveBeenCalledWith(1);
  });

  it('disables remove and clear when the playlist is empty', () => {
    renderPlaylist([], -1);

    expect(screen.getByRole('button', { name: 'REMOVE' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'CLEAR' })).toBeDisabled();
  });
});
