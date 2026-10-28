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
      <div className="panel-heading">
        <span>PLAYLIST // {playlist.length}</span>

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
            disabled={currentTrackIndex === -1}
            onClick={onRemove}
          >
            REMOVE
          </button>

          <button
            className="playlist-action"
            type="button"
            disabled={playlist.length === 0}
            onClick={onClear}
          >
            CLEAR
          </button>
        </div>
      </div>

      <div
        className={dropZoneClassName}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {dropZoneText}
      </div>

      <ol className="playlist">
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
                <span>{track.artist}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default PlaylistPanel;
