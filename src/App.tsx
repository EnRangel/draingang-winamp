import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

// A Track describes the information we need for one song in the playlist.
type Track = {
  name: string;
  source: string;
};

// RepeatMode only allows these three exact string values.
type RepeatMode = 'off' | 'all' | 'one';

function handleCloseBtnClick() {
  window.electronAPI.closeWindow();
}

function handleMinimizeBtnClick() {
  window.electronAPI.minimizeWindow();
}

// Convert a number of seconds into the clock format used by music players.
function formatTime(timeInSeconds: number): string {
  if (Number.isFinite(timeInSeconds) === false) {
    return '0:00';
  }

  const wholeSeconds = Math.floor(timeInSeconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;
  const paddedSeconds = seconds.toString().padStart(2, '0');

  return minutes + ':' + paddedSeconds;
}

function loadSavedVolume(): number {
  const savedVolume = localStorage.getItem('drainamp-volume');

  if (savedVolume === null) {
    return 100;
  }

  const parsedVolume = Number(savedVolume);

  if (Number.isFinite(parsedVolume) === false) {
    return 100;
  }

  if (parsedVolume < 0 || parsedVolume > 100) {
    return 100;
  }

  return parsedVolume;
}

function loadSavedBoolean(settingName: string): boolean {
  return localStorage.getItem(settingName) === 'true';
}

function loadSavedRepeatMode(): RepeatMode {
  const savedMode = localStorage.getItem('drainamp-repeat');

  if (savedMode === 'all' || savedMode === 'one') {
    return savedMode;
  }

  return 'off';
}

function isSupportedAudioFile(file: File): boolean {
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

function App() {
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  /*
   * This ref remembers every temporary blob URL we create. Unlike state,
   * changing a ref does not cause React to rebuild the interface.
   */
  const createdTrackSources = useRef<string[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No track selected');
  const [audioSource, setAudioSource] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(loadSavedVolume);
  const [isMuted, setIsMuted] = useState(() =>
    loadSavedBoolean('drainamp-muted'),
  );
  const [playlist, setPlaylist] = useState<Track[]>([]);
  // -1 means that the playlist does not have a selected track yet.
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [playWhenReady, setPlayWhenReady] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(() =>
    loadSavedBoolean('drainamp-shuffle'),
  );
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(loadSavedRepeatMode);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  /*
   * An effect runs after React updates the page. This one keeps the real audio
   * element and localStorage synchronized with our settings state.
   */
  useEffect(() => {
    const audioElement = audioPlayer.current;

    if (audioElement !== null) {
      audioElement.volume = volume / 100;
      audioElement.muted = isMuted;
    }

    localStorage.setItem('drainamp-volume', String(volume));
    localStorage.setItem('drainamp-muted', String(isMuted));
    localStorage.setItem('drainamp-shuffle', String(isShuffleEnabled));
    localStorage.setItem('drainamp-repeat', repeatMode);
  }, [volume, isMuted, isShuffleEnabled, repeatMode]);

  /*
   * Returning a function from an effect creates cleanup work. React runs this
   * when the app closes, releasing any temporary file URLs still in memory.
   */
  useEffect(() => {
    return () => {
      for (const source of createdTrackSources.current) {
        URL.revokeObjectURL(source);
      }

      createdTrackSources.current = [];
    };
  }, []);

  function releaseTrackSource(track: Track) {
    URL.revokeObjectURL(track.source);

    const remainingSources: string[] = [];

    for (const source of createdTrackSources.current) {
      if (source !== track.source) {
        remainingSources.push(source);
      }
    }

    createdTrackSources.current = remainingSources;
  }

  function resetPlayer() {
    const audioElement = audioPlayer.current;

    if (audioElement !== null) {
      audioElement.pause();
      audioElement.removeAttribute('src');
      audioElement.load();
    }

    setCurrentTrackIndex(-1);
    setTrackName('No track selected');
    setAudioSource('');
    setIsPlaying(false);
    setPlayWhenReady(false);
    setCurrentTime(0);
    setDuration(0);
  }

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

  async function replayCurrentTrack() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    audioElement.currentTime = 0;
    setCurrentTime(0);

    try {
      await audioElement.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('The song could not repeat.', error);
    }
  }

  function findNextTrackIndex(isAutomaticAdvance: boolean): number {
    if (playlist.length === 0) {
      return -1;
    }

    if (isAutomaticAdvance && repeatMode === 'one') {
      return currentTrackIndex;
    }

    if (isShuffleEnabled && playlist.length > 1) {
      let randomIndex = currentTrackIndex;

      // Keep choosing until shuffle finds a different song.
      while (randomIndex === currentTrackIndex) {
        randomIndex = Math.floor(Math.random() * playlist.length);
      }

      return randomIndex;
    }

    const nextTrackIndex = currentTrackIndex + 1;

    if (nextTrackIndex < playlist.length) {
      return nextTrackIndex;
    }

    if (repeatMode === 'all') {
      return 0;
    }

    return -1;
  }

  async function handlePlayPauseBtnClick() {
    const audioElement = audioPlayer.current;

    if (audioElement === null || audioSource === '') {
      return;
    }

    setPlayWhenReady(false);

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioElement.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('The selected song could not play.', error);
      }
    }
  }

  async function handleAudioEnded() {
    const nextTrackIndex = findNextTrackIndex(true);

    if (nextTrackIndex === -1) {
      setIsPlaying(false);
      return;
    }

    if (nextTrackIndex === currentTrackIndex) {
      await replayCurrentTrack();
      return;
    }

    const nextTrack = playlist[nextTrackIndex];

    if (nextTrack !== undefined) {
      loadTrack(nextTrack, nextTrackIndex, true);
    }
  }

  function handleAudioTimeUpdate() {
    const audioElement = audioPlayer.current;

    if (audioElement !== null) {
      setCurrentTime(audioElement.currentTime);
    }
  }

  function handleAudioLoadedMetadata() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

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

    const newTime = Number(event.target.value);
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    const newVolume = Number(event.target.value);
    setVolume(newVolume);

    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }

  function handleMuteBtnClick() {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  }

  function handlePlaylistTrackClick(trackIndex: number) {
    const selectedTrack = playlist[trackIndex];

    if (selectedTrack !== undefined) {
      loadTrack(selectedTrack, trackIndex, false);
    }
  }

  function handlePreviousBtnClick() {
    let previousTrackIndex = currentTrackIndex - 1;

    if (previousTrackIndex < 0 && repeatMode === 'all') {
      previousTrackIndex = playlist.length - 1;
    }

    const previousTrack = playlist[previousTrackIndex];

    if (previousTrack !== undefined) {
      loadTrack(previousTrack, previousTrackIndex, isPlaying);
    }
  }

  function handleNextBtnClick() {
    const nextTrackIndex = findNextTrackIndex(false);
    const nextTrack = playlist[nextTrackIndex];

    if (nextTrack !== undefined) {
      loadTrack(nextTrack, nextTrackIndex, isPlaying);
    }
  }

  function handleStopBtnClick() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    audioElement.pause();
    audioElement.currentTime = 0;
    setPlayWhenReady(false);
    setCurrentTime(0);
    setIsPlaying(false);
  }

  function addFilesToPlaylist(selectedFiles: FileList) {
    const addedTracks: Track[] = [];

    for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex += 1) {
      const selectedFile = selectedFiles.item(fileIndex);

      if (
        selectedFile === null ||
        isSupportedAudioFile(selectedFile) === false
      ) {
        continue;
      }

      const source = URL.createObjectURL(selectedFile);
      createdTrackSources.current.push(source);

      addedTracks.push({
        name: selectedFile.name,
        source,
      });
    }

    const firstAddedTrack = addedTracks[0];

    if (firstAddedTrack === undefined) {
      return;
    }

    const firstAddedTrackIndex = playlist.length;
    const updatedPlaylist = playlist.concat(addedTracks);
    setPlaylist(updatedPlaylist);

    // Load the first song only when the old playlist was empty.
    if (currentTrackIndex === -1) {
      loadTrack(firstAddedTrack, firstAddedTrackIndex, false);
    }
  }

  function handleTrackFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;

    if (selectedFiles !== null) {
      addFilesToPlaylist(selectedFiles);
    }

    // Clearing the input allows the same file to be selected again later.
    event.target.value = '';
  }

  function handleRemoveTrackBtnClick() {
    const trackToRemove = playlist[currentTrackIndex];

    if (trackToRemove === undefined) {
      return;
    }

    const shouldContinuePlaying = isPlaying;
    const audioElement = audioPlayer.current;
    const remainingPlaylist: Track[] = [];

    // Stop using the selected blob URL before we release it from memory.
    if (audioElement !== null) {
      audioElement.pause();
    }

    for (let trackIndex = 0; trackIndex < playlist.length; trackIndex += 1) {
      if (trackIndex !== currentTrackIndex) {
        remainingPlaylist.push(playlist[trackIndex]);
      }
    }

    releaseTrackSource(trackToRemove);
    setPlaylist(remainingPlaylist);

    if (remainingPlaylist.length === 0) {
      resetPlayer();
      return;
    }

    let replacementIndex = currentTrackIndex;

    if (replacementIndex >= remainingPlaylist.length) {
      replacementIndex = remainingPlaylist.length - 1;
    }

    const replacementTrack = remainingPlaylist[replacementIndex];

    if (replacementTrack !== undefined) {
      loadTrack(replacementTrack, replacementIndex, shouldContinuePlaying);
    }
  }

  function handleClearPlaylistBtnClick() {
    for (const track of playlist) {
      releaseTrackSource(track);
    }

    setPlaylist([]);
    resetPlayer();
  }

  function handleShuffleBtnClick() {
    if (isShuffleEnabled) {
      setIsShuffleEnabled(false);
    } else {
      setIsShuffleEnabled(true);
    }
  }

  function handleRepeatBtnClick() {
    if (repeatMode === 'off') {
      setRepeatMode('all');
    } else if (repeatMode === 'all') {
      setRepeatMode('one');
    } else {
      setRepeatMode('off');
    }
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    // preventDefault tells the browser that this area accepts dropped files.
    event.preventDefault();
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    addFilesToPlaylist(event.dataTransfer.files);
  }

  const hasPreviousTrack =
    currentTrackIndex > 0 || (repeatMode === 'all' && playlist.length > 1);

  let hasNextTrack = false;

  if (currentTrackIndex >= 0) {
    if (currentTrackIndex < playlist.length - 1) {
      hasNextTrack = true;
    } else if (repeatMode === 'all' && playlist.length > 1) {
      hasNextTrack = true;
    } else if (isShuffleEnabled && playlist.length > 1) {
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

  let shuffleButtonLabel = 'SHUF OFF';
  if (isShuffleEnabled) {
    shuffleButtonLabel = 'SHUF ON';
  }

  let repeatButtonLabel = 'REP OFF';
  if (repeatMode === 'all') {
    repeatButtonLabel = 'REP ALL';
  } else if (repeatMode === 'one') {
    repeatButtonLabel = 'REP ONE';
  }

  let dropZoneClassName = 'drop-zone';
  if (isDraggingFile) {
    dropZoneClassName += ' drop-zone-active';
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

      <button
        className="window-close-btn"
        type="button"
        aria-label="Close Drainamp"
        onClick={handleCloseBtnClick}
      >
        x
      </button>

      <p className="eyebrow">DRAINAMP // STEP 03</p>

      <div
        className={dropZoneClassName}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        DROP AUDIO HERE
      </div>

      <div className="playlist-actions">
        <label className="playlist-action">
          ADD
          <input
            className="track-file-input"
            type="file"
            accept="audio/*"
            multiple
            onChange={handleTrackFileChange}
          />
        </label>

        <button
          className="playlist-action"
          type="button"
          disabled={currentTrackIndex === -1}
          onClick={handleRemoveTrackBtnClick}
        >
          REMOVE
        </button>

        <button
          className="playlist-action"
          type="button"
          disabled={playlist.length === 0}
          onClick={handleClearPlaylistBtnClick}
        >
          CLEAR
        </button>
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
          className="player-button"
          type="button"
          disabled={hasPreviousTrack === false}
          onClick={handlePreviousBtnClick}
        >
          PREV
        </button>

        <button
          className="player-button"
          type="button"
          onClick={handlePlayPauseBtnClick}
        >
          {playPauseLabel}
        </button>

        <button
          className="player-button"
          type="button"
          onClick={handleStopBtnClick}
        >
          STOP
        </button>

        <button
          className="player-button"
          type="button"
          disabled={hasNextTrack === false}
          onClick={handleNextBtnClick}
        >
          NEXT
        </button>

        <button
          className="player-button"
          type="button"
          aria-pressed={isMuted}
          onClick={handleMuteBtnClick}
        >
          {muteButtonLabel}
        </button>
      </div>

      <div className="mode-controls">
        <button
          className="mode-button"
          type="button"
          aria-pressed={isShuffleEnabled}
          onClick={handleShuffleBtnClick}
        >
          {shuffleButtonLabel}
        </button>

        <button
          className="mode-button"
          type="button"
          onClick={handleRepeatBtnClick}
        >
          {repeatButtonLabel}
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

      <p id="status">{playlist.length} TRACKS</p>
    </main>
  );
}

export default App;
