import { parseBlob } from 'music-metadata';

// This is the complete information Drainamp keeps for one playlist item.
export type Track = {
  fileName: string;
  title: string;
  artist: string;
  album: string;
  source: string;
  artworkSource: string;
};

function removeFileExtension(fileName: string): string {
  const lastDotPosition = fileName.lastIndexOf('.');

  if (lastDotPosition === -1) {
    return fileName;
  }

  return fileName.slice(0, lastDotPosition);
}

export async function createTrackFromFile(file: File): Promise<Track> {
  // These fallback values still work when a song has no embedded ID3 tags.
  let title = removeFileExtension(file.name);
  let artist = 'Unknown Artist';
  let album = 'Unknown Album';
  let artworkSource = '';

  try {
    // parseBlob reads metadata directly from the browser File object.
    const metadata = await parseBlob(file);

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
    title,
    artist,
    album,
    source: URL.createObjectURL(file),
    artworkSource,
  };
}
