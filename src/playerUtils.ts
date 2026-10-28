export function formatTime(timeInSeconds: number): string {
  if (Number.isFinite(timeInSeconds) === false) {
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
