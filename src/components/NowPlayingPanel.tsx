import type { ChangeEvent } from 'react';

import AudioVisualizer from '../AudioVisualizer';
import type { RepeatMode } from '../playerTypes';
import { formatTime } from '../playerUtils';

type NowPlayingPanelProps = {
  artworkSource: string;
  analyser: AnalyserNode | null;
  trackName: string;
  trackArtist: string;
  trackAlbum: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  isShuffleEnabled: boolean;
  repeatMode: RepeatMode;
  volume: number;
  hasPreviousTrack: boolean;
  hasNextTrack: boolean;
  onSeekChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPrevious: () => void;
  onPlayPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onMute: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function NowPlayingPanel({
  artworkSource,
  analyser,
  trackName,
  trackArtist,
  trackAlbum,
  currentTime,
  duration,
  isPlaying,
  isMuted,
  isShuffleEnabled,
  repeatMode,
  volume,
  hasPreviousTrack,
  hasNextTrack,
  onSeekChange,
  onPrevious,
  onPlayPause,
  onStop,
  onNext,
  onMute,
  onShuffle,
  onRepeat,
  onVolumeChange,
}: NowPlayingPanelProps) {
  let playPauseLabel = 'PLAY';
  let playPauseIcon = '▶';

  if (isPlaying) {
    playPauseLabel = 'PAUSE';
    playPauseIcon = 'Ⅱ';
  }

  let muteButtonLabel = 'MUTE';
  let muteIcon = '◇';

  if (isMuted) {
    muteButtonLabel = 'UNMUTE';
    muteIcon = '◆';
  }

  let shuffleButtonLabel = 'SHUF OFF';
  if (isShuffleEnabled) {
    shuffleButtonLabel = 'SHUF ON';
  }

  let repeatButtonLabel = 'REP OFF';
  if (repeatMode === 'all') {
    repeatButtonLabel = 'REP ALL';
  } else if (repeatMode === 'one') {
    repeatButtonLabel = 'REP ONE';
  }

  let artworkContent = (
    <div className="fallback-artwork" aria-label="Drainamp fallback artwork">
      <span className="sigil-wing sigil-wing-left">D</span>
      <span className="sigil-core">✦</span>
      <span className="sigil-wing sigil-wing-right">G</span>
    </div>
  );

  if (artworkSource !== '') {
    artworkContent = (
      <img className="album-artwork" src={artworkSource} alt="Album artwork" />
    );
  }

  return (
    <section className="now-playing-panel">
      <div className="visual-column">
        <div className="artwork-frame">
          {artworkContent}
          <span className="artwork-scan-line" />
          <span className="artwork-corner artwork-corner-top" />
          <span className="artwork-corner artwork-corner-bottom" />
        </div>

        <AudioVisualizer analyser={analyser} />
      </div>

      <div className="control-column">
        <div className="track-details">
          <p className="track-name">{trackName}</p>
          <p className="track-artist">{trackArtist}</p>
          <p className="track-album">{trackAlbum}</p>
        </div>

        <p className="track-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </p>

        <input
          className="seek-bar"
          type="range"
          min="0"
          max={duration}
          step="1"
          value={currentTime}
          aria-label="Song position"
          onChange={onSeekChange}
        />

        <div className="playback-controls">
          <button
            className="transport-button"
            type="button"
            aria-label="Previous track"
            title="Previous track"
            disabled={hasPreviousTrack === false}
            onClick={onPrevious}
          >
            |◀
          </button>

          <button
            className="transport-button transport-button-primary"
            type="button"
            aria-label={playPauseLabel}
            title={playPauseLabel}
            onClick={onPlayPause}
          >
            {playPauseIcon}
          </button>

          <button
            className="transport-button"
            type="button"
            aria-label="Stop"
            title="Stop"
            onClick={onStop}
          >
            ■
          </button>

          <button
            className="transport-button"
            type="button"
            aria-label="Next track"
            title="Next track"
            disabled={hasNextTrack === false}
            onClick={onNext}
          >
            ▶|
          </button>

          <button
            className="transport-button"
            type="button"
            aria-label={muteButtonLabel}
            title={muteButtonLabel}
            aria-pressed={isMuted}
            onClick={onMute}
          >
            {muteIcon}
          </button>
        </div>

        <div className="mode-controls">
          <button
            className="mode-button"
            type="button"
            aria-pressed={isShuffleEnabled}
            onClick={onShuffle}
          >
            {shuffleButtonLabel}
          </button>

          <button className="mode-button" type="button" onClick={onRepeat}>
            {repeatButtonLabel}
          </button>
        </div>

        <label className="volume-control">
          <span>VOL {volume}</span>
          <input
            className="volume-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={onVolumeChange}
          />
        </label>
      </div>
    </section>
  );
}

export default NowPlayingPanel;
