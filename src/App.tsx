import { useRef, useState, type ChangeEvent } from 'react';

// A React component is a function that returns interface elements.
function handleCloseBtnClick() {
  window.electronAPI.closeWindow();
}

function handleMinimizeBtnClick() {
  window.electronAPI.minimizeWindow();
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

  async function handlePlayPauseBtnClick() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    if (audioSource === '') {
      return;
    }

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
    setIsPlaying(false);
  }

  let playPuaseLabel = 'PLAY';

  if (isPlaying) {
    playPuaseLabel = 'PAUSE';
  }

  function handleStopBtnClick() {
    // Get the real audio element from our ref.
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    // Stop playback.
    audioElement.pause();

    // Audio time is measured in seconds. Zero means the beginning.
    audioElement.currentTime = 0;

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

    const selectedFile = selectedFiles[0];
    // Save the filename and ask React to update the interface.
    setTrackName(selectedFile.name);
    /*
     * createObjectURL gives the selected file a temporary address that an
     * <audio> element can use. It only lasts for this application session.
     */
    const newAudioSource = URL.createObjectURL(selectedFile);

    setAudioSource(newAudioSource);
    // A newly selected track should begin in the paused state.
    setIsPlaying(false);
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

      <button
        className="play-pause-btn"
        type="button"
        onClick={handlePlayPauseBtnClick}
      >
        {playPuaseLabel}
      </button>

      <button
        className="play-pause-btn"
        type="button"
        onClick={handleStopBtnClick}
      >
        STOP
      </button>
      <p className="eyebrow">DRAINAMP // STEP 02</p>

      <audio
        ref={audioPlayer}
        className="audio-test-player"
        src={audioSource}
        onEnded={handleAudioEnded}
      />

      <p id="status"> window </p>
      <input
        className="track-file-input"
        type="file"
        accept="audio/*"
        onChange={handleTrackFileChange}
      />

      <p className="track-name">{trackName}</p>
    </main>
  );
}

// `export default` allows another file to import and display this component.
export default App;
