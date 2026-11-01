import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Track } from '../audioMetadata';
import PlaylistPanel from './PlaylistPanel';

const tracks: Track[] = [
  {
    fileName: 'glass-wings.mp3',
    filePath: 'C:\\Music\\glass-wings.mp3',
    fileType: 'audio/mpeg',
    title: 'Glass Wings',
    artist: 'Drain Artist',
    album: 'Test Album',
    source: 'blob:glass-wings',
    artworkSource: '',
    duration: '4:21',
  },
  {
    fileName: 'empty-orbits.mp3',
    filePath: 'C:\\Music\\empty-orbits.mp3',
    fileType: 'audio/mpeg',
    title: 'Empty Orbits',
    artist: 'Drain Artist',
    album: 'Test Album',
    source: 'blob:empty-orbits',
    artworkSource: '',
    duration: '3:08',
  },
];

function renderPlaylist(
  playlist: Track[],
  currentTrackIndex: number,
  onTrackClick = vi.fn(),
  onMoveTrack = vi.fn(),
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
      onMoveTrack={onMoveTrack}
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

    expect(screen.getByText('Glass Wings')).toBeInTheDocument();
    expect(screen.getByText('Empty Orbits')).toBeInTheDocument();
    expect(screen.getByText('4:21')).toBeInTheDocument();
    expect(screen.getByText('2 TRACKS · 7:29')).toBeInTheDocument();
    expect(screen.getByText('ADD')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'REMOVE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CLEAR' })).toBeInTheDocument();
    expect(screen.queryByText('LOAD ▼')).not.toBeInTheDocument();
    expect(screen.queryByText('SEL')).not.toBeInTheDocument();
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

  it('reports the source and destination when a track is dragged', () => {
    const handleMoveTrack = vi.fn();
    let draggedIndex = '';
    const dataTransfer = {
      effectAllowed: 'none',
      dropEffect: 'none',
      types: ['application/x-drainamp-track-index'],
      setData: vi.fn((_type: string, value: string) => {
        draggedIndex = value;
      }),
      getData: vi.fn(() => draggedIndex),
    };

    renderPlaylist(tracks, 0, vi.fn(), handleMoveTrack);

    const firstTrackItem = screen.getByTitle('glass-wings.mp3').closest('li');
    const secondTrackItem = screen.getByTitle('empty-orbits.mp3').closest('li');

    if (firstTrackItem === null || secondTrackItem === null) {
      throw new Error('Expected both playlist items to exist.');
    }

    fireEvent.dragStart(firstTrackItem, { dataTransfer });
    fireEvent.drop(secondTrackItem, { dataTransfer });

    expect(handleMoveTrack).toHaveBeenCalledWith(0, 1);
  });
});
