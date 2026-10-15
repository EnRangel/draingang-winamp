import { useState, type ChangeEvent } from 'react';

// A React component is a function that returns interface elements.
function handleCloseBtnClick() {
  window.electronAPI.closeWindow();
}

function handleMinimizeBtnClick() {
  window.electronAPI.minimizeWindow();
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No track selected');

  function handlePlayPauseBtnClick() {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }

  let playPuaseLabel = 'PLAY';

  if (isPlaying) {
    playPuaseLabel = 'PAUSE';
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
      <p className="eyebrow">DRAINAMP // STEP 02</p>

      <h1>React is ready.</h1>

      <p id="status">One strange window. More strange things coming soon.</p>
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
