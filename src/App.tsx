import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

import {
  applyEqualizerGains,
  closeAudioEngine,
  ensureAudioEngine,
  type AudioEngine,
} from './audioEngine';
import { createTrackFromFile, type Track } from './audioMetadata';
import EqualizerPanel from './components/EqualizerPanel';
import NowPlayingPanel from './components/NowPlayingPanel';
import PlaylistPanel from './components/PlaylistPanel';
import WindowControls from './components/WindowControls';
import { useAudioReactivity } from './hooks/useAudioReactivity';
import { usePlayerSettings } from './hooks/usePlayerSettings';
import { findNextTrackIndex, isSupportedAudioFile } from './playerUtils';

function App() {
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const audioEngine = useRef<AudioEngine | null>(null);
  const playerSkin = useRef<HTMLElement | null>(null);

  /*
   * This ref remembers every temporary blob URL we create. Unlike state,
   * changing a ref does not cause React to rebuild the interface.
   */
  const createdTrackSources = useRef<string[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No track selected');
  const [trackArtist, setTrackArtist] = useState('Unknown Artist');
  const [trackAlbum, setTrackAlbum] = useState('Unknown Album');
  const [artworkSource, setArtworkSource] = useState('');
  const [audioSource, setAudioSource] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  // -1 means that the playlist does not have a selected track yet.
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [playWhenReady, setPlayWhenReady] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isAddingTracks, setIsAddingTracks] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const {
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isShuffleEnabled,
    setIsShuffleEnabled,
    repeatMode,
    setRepeatMode,
    bassGain,
    setBassGain,
    midGain,
    setMidGain,
    trebleGain,
    setTrebleGain,
  } = usePlayerSettings();

  useAudioReactivity(analyserNode, playerSkin);

  /*
   * An effect runs after React updates the page. This one keeps the real audio
   * element and Web Audio filters synchronized with our settings state.
   */
  useEffect(() => {
    const audioElement = audioPlayer.current;

    if (audioElement !== null) {
      audioElement.volume = volume / 100;
      audioElement.muted = isMuted;
    }

    const engine = audioEngine.current;

    if (engine !== null) {
      applyEqualizerGains(engine, {
        bass: bassGain,
        mid: midGain,
        treble: trebleGain,
      });
    }
  }, [volume, isMuted, bassGain, midGain, trebleGain]);

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

      closeAudioEngine(audioEngine.current).catch((error: unknown) => {
        console.error('Could not close the audio engine.', error);
      });
    };
  }, []);

  function releaseTrackSource(track: Track) {
    URL.revokeObjectURL(track.source);

    if (track.artworkSource !== '') {
      URL.revokeObjectURL(track.artworkSource);
    }

    const remainingSources: string[] = [];

    for (const source of createdTrackSources.current) {
      if (source !== track.source && source !== track.artworkSource) {
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
    setTrackArtist('Unknown Artist');
    setTrackAlbum('Unknown Album');
    setArtworkSource('');
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
    setTrackName(track.title);
    setTrackArtist(track.artist);
    setTrackAlbum(track.album);
    setArtworkSource(track.artworkSource);
    setAudioSource(track.source);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlayWhenReady(shouldPlayAfterLoading);
  }

  async function ensureAudioGraph() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    const engine = await ensureAudioEngine(audioElement, audioEngine.current, {
      bass: bassGain,
      mid: midGain,
      treble: trebleGain,
    });

    audioEngine.current = engine;
    setAnalyserNode(engine.analyser);
  }

  async function replayCurrentTrack() {
    const audioElement = audioPlayer.current;

    if (audioElement === null) {
      return;
    }

    audioElement.currentTime = 0;
    setCurrentTime(0);

    try {
      await ensureAudioGraph();
      await audioElement.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('The song could not repeat.', error);
    }
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
        await ensureAudioGraph();
        await audioElement.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('The selected song could not play.', error);
      }
    }
  }

  async function handleAudioEnded() {
    const nextTrackIndex = findNextTrackIndex(
      playlist.length,
      currentTrackIndex,
      true,
      repeatMode,
      isShuffleEnabled,
    );

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
      await ensureAudioGraph();
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

  function handleBassGainChange(event: ChangeEvent<HTMLInputElement>) {
    setBassGain(Number(event.target.value));
  }

  function handleMidGainChange(event: ChangeEvent<HTMLInputElement>) {
    setMidGain(Number(event.target.value));
  }

  function handleTrebleGainChange(event: ChangeEvent<HTMLInputElement>) {
    setTrebleGain(Number(event.target.value));
  }

  function handleResetEqualizerBtnClick() {
    setBassGain(0);
    setMidGain(0);
    setTrebleGain(0);
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
    const nextTrackIndex = findNextTrackIndex(
      playlist.length,
      currentTrackIndex,
      false,
      repeatMode,
      isShuffleEnabled,
    );
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

  async function addFilesToPlaylist(selectedFiles: FileList) {
    const addedTracks: Track[] = [];
    setIsAddingTracks(true);

    try {
      for (
        let fileIndex = 0;
        fileIndex < selectedFiles.length;
        fileIndex += 1
      ) {
        const selectedFile = selectedFiles.item(fileIndex);

        if (
          selectedFile === null ||
          isSupportedAudioFile(selectedFile) === false
        ) {
          continue;
        }

        // Await keeps metadata parsing sequential so a large drop stays smooth.
        const newTrack = await createTrackFromFile(selectedFile);
        createdTrackSources.current.push(newTrack.source);

        if (newTrack.artworkSource !== '') {
          createdTrackSources.current.push(newTrack.artworkSource);
        }

        addedTracks.push(newTrack);
      }
    } finally {
      setIsAddingTracks(false);
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

  async function handleTrackFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;

    if (selectedFiles !== null) {
      await addFilesToPlaylist(selectedFiles);
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

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    await addFilesToPlaylist(event.dataTransfer.files);
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

  let playerStatus = String(playlist.length) + ' TRACKS';
  if (isAddingTracks) {
    playerStatus = 'READING SIGNALS...';
  }

  return (
    <main className="desktop-stage">
      <section ref={playerSkin} className="milestone">
        <div className="skin-glow skin-glow-blue" />
        <div className="skin-glow skin-glow-red" />
        {/*
         * This layer is only visual. aria-hidden keeps screen readers focused
         * on the real player controls instead of announcing decorative stars.
         */}
        <div className="edge-decorations" aria-hidden="true">
          <span className="edge-star edge-star-one" />
          <span className="edge-star edge-star-two" />
          <span className="edge-star edge-star-three" />
          <span className="edge-star edge-star-four" />
          <span className="edge-star edge-star-five" />
          <span className="edge-star edge-star-six" />
          <span className="edge-star edge-star-seven" />
          <span className="edge-star edge-star-eight" />
        </div>

        <WindowControls />

        <header className="skin-header">
          <div>
            <p className="eyebrow">DG AUDIO SYSTEM // 03</p>
            {/*
             * The word is drawn by a background image. aria-label keeps the
             * title understandable to screen readers even without typed text.
             */}
            <h1 className="drain-wordmark" aria-label="DRAIN" />
          </div>
          <p className="player-status">{playerStatus}</p>
        </header>

        <NowPlayingPanel
          artworkSource={artworkSource}
          analyser={analyserNode}
          trackName={trackName}
          trackArtist={trackArtist}
          trackAlbum={trackAlbum}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={isMuted}
          isShuffleEnabled={isShuffleEnabled}
          repeatMode={repeatMode}
          volume={volume}
          hasPreviousTrack={hasPreviousTrack}
          hasNextTrack={hasNextTrack}
          onSeekChange={handleSeekChange}
          onPrevious={handlePreviousBtnClick}
          onPlayPause={handlePlayPauseBtnClick}
          onStop={handleStopBtnClick}
          onNext={handleNextBtnClick}
          onMute={handleMuteBtnClick}
          onShuffle={handleShuffleBtnClick}
          onRepeat={handleRepeatBtnClick}
          onVolumeChange={handleVolumeChange}
        />

        <EqualizerPanel
          bassGain={bassGain}
          midGain={midGain}
          trebleGain={trebleGain}
          onBassChange={handleBassGainChange}
          onMidChange={handleMidGainChange}
          onTrebleChange={handleTrebleGainChange}
          onReset={handleResetEqualizerBtnClick}
        />

        <PlaylistPanel
          playlist={playlist}
          currentTrackIndex={currentTrackIndex}
          isDraggingFile={isDraggingFile}
          isAddingTracks={isAddingTracks}
          onFileChange={handleTrackFileChange}
          onRemove={handleRemoveTrackBtnClick}
          onClear={handleClearPlaylistBtnClick}
          onTrackClick={handlePlaylistTrackClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />

        <audio
          ref={audioPlayer}
          className="audio-test-player"
          src={audioSource}
          onCanPlay={handleAudioCanPlay}
          onEnded={handleAudioEnded}
          onLoadedMetadata={handleAudioLoadedMetadata}
          onTimeUpdate={handleAudioTimeUpdate}
        />
      </section>
    </main>
  );
}

export default App;
