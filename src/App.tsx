import { useRef, useState, type ChangeEvent } from 'react';

// A Track describes the information we need for one song in the playlist.
type Track = {
  name: string;
  source: string;
};

// A React component is a function that returns interface elements.
function handleCloseBtnClick() {
  window.electronAPI.closeWindow();
}

function handleMinimizeBtnClick() {
  window.electronAPI.minimizeWindow();
}

// Convert a number of seconds into the clock format used by music players.
function formatTime(timeInSeconds: number): string {
  // Protect the interface from invalid values while a song is loading.
  if (Number.isFinite(timeInSeconds) === false) {
    return '0:00';
  }

  const wholeSeconds = Math.floor(timeInSeconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;

  // padStart turns 7 into "07", while leaving 12 as "12".
  const paddedSeconds = seconds.toString().padStart(2, '0');

  return minutes + ':' + paddedSeconds;
}

function App() {
  /*
   * A ref lets us access the real <audio> element so we can call its
   * play() and pause() functions later.
   */
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No track selected');
  const [audioSource, setAudioSource] = useState('');
  // Store the song's current playback position in seconds.
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // HTML audio volume uses 0 to 1, but 0 to 100 is easier to display.
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  // -1 means that the playlist does not have a selected track yet.
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [playWhenReady, setPlayWhenReady] = useState(false);

  function loadTrack(
    track: Track,
    trackIndex: number,
    shouldPlayAfterLoading: boolean,
  ) {
    const audioElement = audioPlayer.current;

    if (audioElement !== null) {
      audioElement.pause();
    }

    setCurrentTrackIndex(trackIndex);
    setTrackName(track.name);
    setAudioSource(track.source);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlayWhenReady(shouldPlayAfterLoading);
  }

  async function handlePlayPauseBtnClick() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    if (audioSource === '') {
      return;
    }

    // A direct button click cancels any automatic play request still loading.
    setPlayWhenReady(false);

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      try {
        /*
         * play() finishes asynchronously, so await waits for the browser
         * to confirm that playback actually started.
         */
        await audioElement.play();
        setIsPlaying(true);
      } catch (error) {
        // This helps us diagnose a file that cannot be played.
        console.error('The selected song could not play.', error);
      }
    }
  }

  function handleAudioEnded() {
    const nextTrackIndex = currentTrackIndex + 1;
    const nextTrack = playlist[nextTrackIndex];

    if (nextTrack === undefined) {
      // There is no next song, so leave the player stopped at the end.
      setIsPlaying(false);
      return;
    }

    // Automatically load and play the next song in the playlist.
    loadTrack(nextTrack, nextTrackIndex, true);
  }

  function handleAudioTimeUpdate() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    // Copy the audio element's current time into React state.
    setCurrentTime(audioElement.currentTime);
  }

  function handleAudioLoadedMetadata() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    // Metadata includes information such as the song's total duration.
    if (Number.isFinite(audioElement.duration)) {
      setDuration(audioElement.duration);
    } else {
      setDuration(0);
    }
  }

  async function handleAudioCanPlay() {
    if (playWhenReady === false) {
      return;
    }

    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    try {
      // This is used when NEXT, PREV, or automatic advance changes the song.
      await audioElement.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('The next song could not play.', error);
    }

    setPlayWhenReady(false);
  }

  function handleSeekChange(event: ChangeEvent<HTMLInputElement>) {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    // Input values are strings, so Number converts the value into seconds.
    const newTime = Number(event.target.value);
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    const newVolume = Number(event.target.value);

    // Divide by 100 because the audio element expects a value from 0 to 1.
    audioElement.volume = newVolume / 100;
    setVolume(newVolume);

    // Moving the volume above zero should also turn mute off.
    if (newVolume > 0) {
      if (isMuted) {
        audioElement.muted = false;
        setIsMuted(false);
      }
    }
  }

  function handleMuteBtnClick() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    if (isMuted) {
      audioElement.muted = false;
      setIsMuted(false);
    } else {
      audioElement.muted = true;
      setIsMuted(true);
    }
  }

  function handlePlaylistTrackClick(trackIndex: number) {
    const selectedTrack = playlist[trackIndex];

    if (selectedTrack === undefined) {
      return;
    }

    // Clicking a playlist item selects it without immediately playing it.
    loadTrack(selectedTrack, trackIndex, false);
  }

  function handlePreviousBtnClick() {
    const previousTrackIndex = currentTrackIndex - 1;
    const previousTrack = playlist[previousTrackIndex];

    if (previousTrack === undefined) {
      return;
    }

    // Continue playing after the change only if music was already playing.
    loadTrack(previousTrack, previousTrackIndex, isPlaying);
  }

  function handleNextBtnClick() {
    const nextTrackIndex = currentTrackIndex + 1;
    const nextTrack = playlist[nextTrackIndex];

    if (nextTrack === undefined) {
      return;
    }

    loadTrack(nextTrack, nextTrackIndex, isPlaying);
  }

  const hasPreviousTrack = currentTrackIndex > 0;
  let hasNextTrack = false;

  if (currentTrackIndex >= 0) {
    if (currentTrackIndex < playlist.length - 1) {
      hasNextTrack = true;
    }
  }

  let playPauseLabel = 'PLAY';

  if (isPlaying) {
    playPauseLabel = 'PAUSE';
  }

  let muteButtonLabel = 'MUTE';

  if (isMuted) {
    muteButtonLabel = 'UNMUTE';
  }

  function handleStopBtnClick() {
    // Get the real audio element from our ref.
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    // Stop playback.
    audioElement.pause();
    setPlayWhenReady(false);

    // Audio time is measured in seconds. Zero means the beginning.
    audioElement.currentTime = 0;
    setCurrentTime(0);

    // Update the React interface so the other button says PLAY.
    setIsPlaying(false);
  }

  function handleTrackFileChange(event: ChangeEvent<HTMLInputElement>) {
    // A file input stores its selected files in event.target.files.
    const selectedFiles = event.target.files;
    // The value can be null if the user closes the picker without choosing.
    if (selectedFiles === null) {
      return;
    }
    // Stop if the list exists but contains no files.
    if (selectedFiles.length === 0) {
      return;
    }

    const newPlaylist: Track[] = [];

    for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex += 1) {
      const selectedFile = selectedFiles.item(fileIndex);

      if (selectedFile === null) {
        continue;
      }

      /*
       * createObjectURL gives each selected file a temporary address that the
       * <audio> element can use during this application session.
       */
      const newTrack: Track = {
        name: selectedFile.name,
        source: URL.createObjectURL(selectedFile),
      };

      newPlaylist.push(newTrack);
    }

    const firstTrack = newPlaylist[0];

    if (firstTrack === undefined) {
      return;
    }

    setPlaylist(newPlaylist);
    loadTrack(firstTrack, 0, false);
  }

  return (
    <main className="milestone">
      <button
        className="window-minimize-btn"
        type="button"
        aria-label="Minimize Drainamp"
        onClick={handleMinimizeBtnClick}
      >
        -
      </button>
      {/* Without parentheses, we give React the function to run later. With parentheses, the function would run immediately while the component is being created. */}
      <button
        className="window-close-btn"
        type="button"
        aria-label="Close Drainamp"
        onClick={handleCloseBtnClick}
      >
        x
      </button>

      <p className="eyebrow">DRAINAMP // STEP 02</p>

      <input
        className="track-file-input"
        type="file"
        accept="audio/*"
        multiple
        onChange={handleTrackFileChange}
      />

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
                // The arrow function passes this track's index when clicked.
                onClick={() => handlePlaylistTrackClick(trackIndex)}
              >
                {trackIndex + 1}. {track.name}
              </button>
            </li>
          );
        })}
      </ol>

      <p className="track-name">{trackName}</p>

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
        onChange={handleSeekChange}
      />

      <div className="playback-controls">
        <button
          className="play-pause-btn"
          type="button"
          disabled={hasPreviousTrack === false}
          onClick={handlePreviousBtnClick}
        >
          PREV
        </button>

        <button
          className="play-pause-btn"
          type="button"
          onClick={handlePlayPauseBtnClick}
        >
          {playPauseLabel}
        </button>

        <button
          className="play-pause-btn"
          type="button"
          onClick={handleStopBtnClick}
        >
          STOP
        </button>

        <button
          className="play-pause-btn"
          type="button"
          disabled={hasNextTrack === false}
          onClick={handleNextBtnClick}
        >
          NEXT
        </button>

        <button
          className="play-pause-btn"
          type="button"
          aria-pressed={isMuted}
          onClick={handleMuteBtnClick}
        >
          {muteButtonLabel}
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
          onChange={handleVolumeChange}
        />
      </label>

      <audio
        ref={audioPlayer}
        className="audio-test-player"
        src={audioSource}
        onCanPlay={handleAudioCanPlay}
        onEnded={handleAudioEnded}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onTimeUpdate={handleAudioTimeUpdate}
      />

      <p id="status"> window </p>
    </main>
  );
}

// `export default` allows another file to import and display this component.
export default App;
