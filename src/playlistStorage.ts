import type { Track } from './audioMetadata';

const PLAYLIST_STORAGE_KEY = 'drainamp-playlist';

// Blob URLs stop working when Electron closes, so we save the original path.
export type SavedTrackReference = {
  fileName: string;
  filePath: string;
  fileType: string;
};

export function loadSavedPlaylist(): SavedTrackReference[] {
  const savedValue = localStorage.getItem(PLAYLIST_STORAGE_KEY);

  if (savedValue === null) {
    return [];
  }

  try {
    // JSON.parse returns unknown data, so each field is checked before use.
    const parsedValue: unknown = JSON.parse(savedValue);

    if (Array.isArray(parsedValue) === false) {
      return [];
    }

    const validReferences: SavedTrackReference[] = [];

    for (const item of parsedValue) {
      if (
        typeof item === 'object' &&
        item !== null &&
        'fileName' in item &&
        typeof item.fileName === 'string' &&
        'filePath' in item &&
        typeof item.filePath === 'string' &&
        'fileType' in item &&
        typeof item.fileType === 'string'
      ) {
        validReferences.push({
          fileName: item.fileName,
          filePath: item.filePath,
          fileType: item.fileType,
        });
      }
    }

    return validReferences;
  } catch (error) {
    console.warn('Could not read the saved Drainamp playlist.', error);
    return [];
  }
}

export function savePlaylist(playlist: Track[]): void {
  const references: SavedTrackReference[] = [];

  for (const track of playlist) {
    references.push({
      fileName: track.fileName,
      filePath: track.filePath,
      fileType: track.fileType,
    });
  }

  localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(references));
}
