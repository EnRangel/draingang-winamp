import type { ChangeEvent, DragEvent } from 'react';

import type { Track } from '../audioMetadata';
import MissingTracksWarning from './MissingTracksWarning';

const PLAYLIST_DRAG_TYPE = 'application/x-drainamp-track-index';

type PlaylistPanelProps = {
  playlist: Track[];
  currentTrackIndex: number;
  isDraggingFile: boolean;
  isAddingTracks: boolean;
  missingTrackCount: number;
  onDismissMissingTracksWarning: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onClear: () => void;
  onTrackClick: (trackIndex: number) => void;
  onTrackDoubleClick: (trackIndex: number) => void;
  onMoveTrack: (fromIndex: number, toIndex: number) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

function durationTextToSeconds(duration: string): number {
  const durationParts = duration.split(':');

  if (durationParts.length !== 2) {
    return 0;
  }

  const minutes = Number(durationParts[0]);
  const seconds = Number(durationParts[1]);

  if (
    Number.isFinite(minutes) === false ||
    Number.isFinite(seconds) === false
  ) {
    return 0;
  }

  return minutes * 60 + seconds;
}

function createPlaylistSummary(playlist: Track[]): string {
  let totalSeconds = 0;

  for (const track of playlist) {
    totalSeconds += durationTextToSeconds(track.duration);
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const trackWord = playlist.length === 1 ? 'TRACK' : 'TRACKS';

  // padStart changes 7 seconds into "07" so the result looks like a timer.
  const formattedDuration =
    String(totalMinutes) + ':' + String(remainingSeconds).padStart(2, '0');

  return String(playlist.length) + ' ' + trackWord + ' · ' + formattedDuration;
}

function PlaylistPanel({
  playlist,
  currentTrackIndex,
  isDraggingFile,
  isAddingTracks,
  missingTrackCount,
  onDismissMissingTracksWarning,
  onFileChange,
  onRemove,
  onClear,
  onTrackClick,
  onTrackDoubleClick,
  onMoveTrack,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: PlaylistPanelProps) {
  function handleTrackDragStart(
    event: DragEvent<HTMLLIElement>,
    trackIndex: number,
  ) {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(PLAYLIST_DRAG_TYPE, String(trackIndex));
  }

  function handleTrackDragOver(event: DragEvent<HTMLLIElement>) {
    if (event.dataTransfer.types.includes(PLAYLIST_DRAG_TYPE) === false) {
      return;
    }

    // A drop is blocked by default, so preventDefault enables reordering here.
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleTrackDrop(event: DragEvent<HTMLLIElement>, toIndex: number) {
    if (event.dataTransfer.types.includes(PLAYLIST_DRAG_TYPE) === false) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const fromIndex = Number(event.dataTransfer.getData(PLAYLIST_DRAG_TYPE));

    if (Number.isInteger(fromIndex)) {
      onMoveTrack(fromIndex, toIndex);
    }
  }

  let dropZoneClassName = 'drop-zone';
  if (isDraggingFile) {
    dropZoneClassName += ' drop-zone-active';
  }

  if (missingTrackCount > 0) {
    dropZoneClassName += ' playlist-body-has-warning';
  }

  let dropZoneText = 'DROP AUDIO SIGNALS HERE';
  if (isAddingTracks) {
    dropZoneText = 'READING METADATA...';
  }

  let playlistSummary = createPlaylistSummary(playlist);

  if (isAddingTracks) {
    playlistSummary = 'READING SIGNALS...';
  }

  return (
    <section className="playlist-panel">
      <div className="panel-heading playlist-heading" />

      <div
        className={`playlist-body ${dropZoneClassName}`}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <MissingTracksWarning
          missingTrackCount={missingTrackCount}
          onDismiss={onDismissMissingTracksWarning}
        />

        <span
          className="playlist-side-chain playlist-side-chain-left"
          aria-hidden="true"
        />

        <ol className="playlist">
          {playlist.length === 0 && (
            <li className="playlist-empty">{dropZoneText}</li>
          )}

          {playlist.map((track, trackIndex) => {
            let trackButtonClassName = 'playlist-track';

            if (trackIndex === currentTrackIndex) {
              trackButtonClassName += ' playlist-track-active';
            }

            return (
              <li
                className="playlist-item"
                key={track.source}
                draggable
                onDragStart={(event) => handleTrackDragStart(event, trackIndex)}
                onDragOver={handleTrackDragOver}
                onDrop={(event) => handleTrackDrop(event, trackIndex)}
              >
                <button
                  className={trackButtonClassName}
                  type="button"
                  title={track.fileName}
                  onClick={() => onTrackClick(trackIndex)}
                  onDoubleClick={() => onTrackDoubleClick(trackIndex)}
                >
                  <span>{trackIndex + 1}.</span>
                  <span>{track.title}</span>
                  <span>{track.duration}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="playlist-side-art" aria-hidden="true">
          <span className="playlist-side-chain playlist-side-chain-right" />
        </div>
      </div>

      <div className="playlist-footer">
        <div className="playlist-actions">
          <label className="playlist-action">
            ADD
            <input
              className="track-file-input"
              type="file"
              accept="audio/*"
              multiple
              disabled={isAddingTracks}
              onChange={onFileChange}
            />
          </label>

          <button
            className="playlist-action"
            type="button"
            aria-label="REMOVE"
            disabled={currentTrackIndex === -1}
            onClick={onRemove}
          >
            REMOVE
          </button>

          <button
            className="playlist-action"
            type="button"
            aria-label="CLEAR"
            title="Clear playlist"
            disabled={playlist.length === 0}
            onClick={onClear}
          >
            CLEAR
          </button>
        </div>

        <div className="playlist-footer-summary" aria-live="polite">
          {playlistSummary}
        </div>
      </div>
    </section>
  );
}

export default PlaylistPanel;
