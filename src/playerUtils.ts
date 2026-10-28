import type { RepeatMode } from './playerTypes';

export function formatTime(timeInSeconds: number): string {
  if (Number.isFinite(timeInSeconds) === false || timeInSeconds < 0) {
    return '0:00';
  }

  const wholeSeconds = Math.floor(timeInSeconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;
  const paddedSeconds = seconds.toString().padStart(2, '0');

  return minutes + ':' + paddedSeconds;
}

export function isSupportedAudioFile(file: File): boolean {
  if (file.type.startsWith('audio/')) {
    return true;
  }

  // Some dragged Windows files do not include a MIME type, so check names too.
  const lowercaseName = file.name.toLowerCase();

  if (lowercaseName.endsWith('.mp3')) {
    return true;
  }

  if (lowercaseName.endsWith('.wav')) {
    return true;
  }

  if (lowercaseName.endsWith('.ogg')) {
    return true;
  }

  if (lowercaseName.endsWith('.m4a')) {
    return true;
  }

  return lowercaseName.endsWith('.flac');
}

export function findNextTrackIndex(
  playlistLength: number,
  currentTrackIndex: number,
  isAutomaticAdvance: boolean,
  repeatMode: RepeatMode,
  isShuffleEnabled: boolean,
): number {
  if (playlistLength === 0) {
    return -1;
  }

  // Automatic means the current song ended by itself, rather than a click.
  if (isAutomaticAdvance && repeatMode === 'one') {
    return currentTrackIndex;
  }

  if (isShuffleEnabled && playlistLength > 1) {
    /*
     * Choose an offset instead of repeatedly choosing random tracks. Because
     * the offset starts at 1, shuffle can never choose the current track.
     */
    const numberOfOtherTracks = playlistLength - 1;
    const randomOffset = Math.floor(Math.random() * numberOfOtherTracks) + 1;

    return (currentTrackIndex + randomOffset) % playlistLength;
  }

  const nextTrackIndex = currentTrackIndex + 1;

  if (nextTrackIndex < playlistLength) {
    return nextTrackIndex;
  }

  if (repeatMode === 'all') {
    return 0;
  }

  return -1;
}
