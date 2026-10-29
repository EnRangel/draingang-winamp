import type { ChangeEvent, DragEvent } from 'react';

import type { Track } from '../audioMetadata';

type PlaylistPanelProps = {
  playlist: Track[];
  currentTrackIndex: number;
  isDraggingFile: boolean;
  isAddingTracks: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onClear: () => void;
  onTrackClick: (trackIndex: number) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

function PlaylistPanel({
  playlist,
  currentTrackIndex,
  isDraggingFile,
  isAddingTracks,
  onFileChange,
  onRemove,
  onClear,
  onTrackClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: PlaylistPanelProps) {
  let dropZoneClassName = 'drop-zone';
  if (isDraggingFile) {
    dropZoneClassName += ' drop-zone-active';
  }

  let dropZoneText = 'DROP AUDIO SIGNALS HERE';
  if (isAddingTracks) {
    dropZoneText = 'READING METADATA...';
  }

  return (
    <section className="playlist-panel">
      <div className="panel-heading playlist-heading">
        <span className="playlist-title">PLAYLIST</span>
        <span className="playlist-window-marks" aria-hidden="true">
          □ ▣ ×
        </span>
      </div>

      <div
        className={`playlist-body ${dropZoneClassName}`}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
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
              <li key={track.source}>
                <button
                  className={trackButtonClassName}
                  type="button"
                  title={track.fileName}
                  onClick={() => onTrackClick(trackIndex)}
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
          <span className="playlist-scratch">✧</span>
          <div className="playlist-mascot" />
          <span className="playlist-heart">♥</span>
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
            REM
          </button>

          {/* These two visual controls reserve space for later playlist tools. */}
          <button className="playlist-action" type="button" disabled>
            SEL
          </button>
          <button
            className="playlist-action"
            type="button"
            aria-label="CLEAR"
            title="Clear playlist"
            disabled={playlist.length === 0}
            onClick={onClear}
          >
            MISC
          </button>
        </div>

        <div className="playlist-footer-scratch" aria-hidden="true" />

        <label className="playlist-action playlist-load-action">
          LOAD ▼
          <input
            className="track-file-input"
            type="file"
            accept="audio/*"
            multiple
            disabled={isAddingTracks}
            onChange={onFileChange}
          />
        </label>
      </div>
    </section>
  );
}

export default PlaylistPanel;
