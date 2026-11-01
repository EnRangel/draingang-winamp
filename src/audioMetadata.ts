import { parseBlob } from 'music-metadata';

// This is the complete information Drainamp keeps for one playlist item.
export type Track = {
  fileName: string;
  filePath: string;
  fileType: string;
  title: string;
  artist: string;
  album: string;
  source: string;
  artworkSource: string;
  duration: string;
};

function formatDuration(durationInSeconds: number | undefined): string {
  if (
    durationInSeconds === undefined ||
    Number.isFinite(durationInSeconds) === false
  ) {
    return '--:--';
  }

  const totalSeconds = Math.floor(durationInSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // padStart adds a leading zero, changing 7 seconds into "07".
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function removeFileExtension(fileName: string): string {
  const lastDotPosition = fileName.lastIndexOf('.');

  if (lastDotPosition === -1) {
    return fileName;
  }

  return fileName.slice(0, lastDotPosition);
}

export async function createTrackFromFile(
  file: File,
  filePath: string,
): Promise<Track> {
  // These fallback values still work when a song has no embedded ID3 tags.
  let title = removeFileExtension(file.name);
  let artist = 'Unknown Artist';
  let album = 'Unknown Album';
  let artworkSource = '';
  let duration = '--:--';

  try {
    // parseBlob reads metadata directly from the browser File object.
    const metadata = await parseBlob(file);
    duration = formatDuration(metadata.format.duration);

    if (metadata.common.title !== undefined && metadata.common.title !== '') {
      title = metadata.common.title;
    }

    if (metadata.common.artist !== undefined && metadata.common.artist !== '') {
      artist = metadata.common.artist;
    }

    if (metadata.common.album !== undefined && metadata.common.album !== '') {
      album = metadata.common.album;
    }

    const pictures = metadata.common.picture;

    if (pictures !== undefined && pictures.length > 0) {
      const picture = pictures[0];

      if (picture !== undefined) {
        // Copy the bytes into a browser Blob, then give the image a local URL.
        const artworkBytes = Uint8Array.from(picture.data);
        const artworkBlob = new Blob([artworkBytes], {
          type: picture.format,
        });

        artworkSource = URL.createObjectURL(artworkBlob);
      }
    }
  } catch (error) {
    // A song can still play even when its optional metadata cannot be read.
    console.warn('Could not read metadata for ' + file.name, error);
  }

  return {
    fileName: file.name,
    filePath,
    fileType: file.type,
    title,
    artist,
    album,
    source: URL.createObjectURL(file),
    artworkSource,
    duration,
  };
}
