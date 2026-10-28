import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import NowPlayingPanel from './NowPlayingPanel';

function renderNowPlaying(isPlaying: boolean, onPlayPause = vi.fn()) {
  return render(
    <NowPlayingPanel
      artworkSource=""
      analyser={null}
      trackName="Glass Wings"
      trackArtist="Drain Artist"
      trackAlbum="Test Album"
      currentTime={65}
      duration={245}
      isPlaying={isPlaying}
      isMuted={false}
      isShuffleEnabled={false}
      repeatMode="off"
      volume={80}
      hasPreviousTrack={false}
      hasNextTrack={true}
      onSeekChange={vi.fn()}
      onPrevious={vi.fn()}
      onPlayPause={onPlayPause}
      onStop={vi.fn()}
      onNext={vi.fn()}
      onMute={vi.fn()}
      onShuffle={vi.fn()}
      onRepeat={vi.fn()}
      onVolumeChange={vi.fn()}
    />,
  );
}

describe('NowPlayingPanel', () => {
  it('shows track information, time, and control states', () => {
    renderNowPlaying(false);

    expect(screen.getByText('Glass Wings')).toBeInTheDocument();
    expect(screen.getByText('Drain Artist')).toBeInTheDocument();
    expect(screen.getByText('Test Album')).toBeInTheDocument();
    expect(screen.getByText('1:05 / 4:05')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous track' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next track' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'PLAY' })).toBeInTheDocument();
  });

  it('reports play clicks and changes its label while playing', async () => {
    const user = userEvent.setup();
    const handlePlayPause = vi.fn();
    const { rerender } = renderNowPlaying(false, handlePlayPause);

    await user.click(screen.getByRole('button', { name: 'PLAY' }));
    expect(handlePlayPause).toHaveBeenCalledOnce();

    rerender(
      <NowPlayingPanel
        artworkSource=""
        analyser={null}
        trackName="Glass Wings"
        trackArtist="Drain Artist"
        trackAlbum="Test Album"
        currentTime={65}
        duration={245}
        isPlaying={true}
        isMuted={false}
        isShuffleEnabled={false}
        repeatMode="off"
        volume={80}
        hasPreviousTrack={false}
        hasNextTrack={true}
        onSeekChange={vi.fn()}
        onPrevious={vi.fn()}
        onPlayPause={handlePlayPause}
        onStop={vi.fn()}
        onNext={vi.fn()}
        onMute={vi.fn()}
        onShuffle={vi.fn()}
        onRepeat={vi.fn()}
        onVolumeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'PAUSE' })).toBeInTheDocument();
  });
});
