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
import { usePlayerKeyboardShortcuts } from './hooks/usePlayerKeyboardShortcuts';
import { usePlayerSettings } from './hooks/usePlayerSettings';
import { EQUALIZER_BANDS, EQUALIZER_PRESETS } from './playerTypes';
import { findNextTrackIndex, isSupportedAudioFile } from './playerUtils';
import {
  loadSavedPlaylist,
  savePlaylist,
  type SavedTrackReference,
} from './playlistStorage';

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
  const [hasRestoredPlaylist, setHasRestoredPlaylist] = useState(false);
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
    isEqualizerEnabled,
    setIsEqualizerEnabled,
    equalizerGains,
    setEqualizerGains,
  } = usePlayerSettings();

  useAudioReactivity(analyserNode, playerSkin);
  usePlayerKeyboardShortcuts({
    onPlayPause: handleKeyboardPlayPause,
    onSeekBackward: handleKeyboardSeekBackward,
    onSeekForward: handleKeyboardSeekForward,
    onRemoveTrack: handleRemoveTrackBtnClick,
  });

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
      applyEqualizerGains(engine, equalizerGains, isEqualizerEnabled);
    }
  }, [volume, isMuted, equalizerGains, isEqualizerEnabled]);

  /*
   * This effect runs once when Drainamp opens. It rebuilds fresh blob URLs
   * from the real song paths saved during the previous session.
   */
  useEffect(() => {
    let didCancelRestore = false;

    async function restorePlaylist() {
      const savedReferences = loadSavedPlaylist();
      const restoredTracks: Track[] = [];

      if (savedReferences.length > 0) {
        setIsAddingTracks(true);
      }

      for (const reference of savedReferences) {
        try {
          const restoredTrack = await createTrackFromSavedReference(reference);
          restoredTracks.push(restoredTrack);
        } catch (error) {
          // A moved or deleted song is skipped instead of breaking the app.
          console.warn('Could not restore ' + reference.fileName, error);
        }
      }

      if (didCancelRestore) {
        releaseRestoredTracks(restoredTracks);
        return;
      }

      for (const track of restoredTracks) {
        createdTrackSources.current.push(track.source);

        if (track.artworkSource !== '') {
          createdTrackSources.current.push(track.artworkSource);
        }
      }

      setPlaylist(restoredTracks);
      setIsAddingTracks(false);
      setHasRestoredPlaylist(true);

      const firstTrack = restoredTracks[0];

      if (firstTrack !== undefined) {
        loadTrack(firstTrack, 0, false);
      }
    }

    void restorePlaylist();

    return () => {
      didCancelRestore = true;
    };
  }, []);

  // Once restoration finishes, every playlist change is saved automatically.
  useEffect(() => {
    if (hasRestoredPlaylist) {
      savePlaylist(playlist);
    }
  }, [playlist, hasRestoredPlaylist]);

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

  async function createTrackFromSavedReference(
    reference: SavedTrackReference,
  ): Promise<Track> {
    const fileBytes = await window.electronAPI.readAudioFile(
      reference.filePath,
    );
    const restoredFile = new File([fileBytes], reference.fileName, {
      type: reference.fileType,
    });

    return createTrackFromFile(restoredFile, reference.filePath);
  }

  function releaseRestoredTracks(restoredTracks: Track[]) {
    for (const track of restoredTracks) {
      URL.revokeObjectURL(track.source);

      if (track.artworkSource !== '') {
        URL.revokeObjectURL(track.artworkSource);
      }
    }
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

    const engine = await ensureAudioEngine(
      audioElement,
      audioEngine.current,
      equalizerGains,
      isEqualizerEnabled,
    );

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

  function handleEqualizerGainChange(
    bandIndex: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    /*
     * slice() copies the array. React state should be replaced with a new array
     * instead of changing the old array directly.
     */
    const updatedGains = equalizerGains.slice();
    updatedGains[bandIndex] = Number(event.target.value);
    setEqualizerGains(updatedGains);
  }

  function handleResetEqualizerBtnClick() {
    const resetGains = EQUALIZER_BANDS.map(() => 0);
    setEqualizerGains(resetGains);
  }

  function handleEqualizerToggleBtnClick() {
    setIsEqualizerEnabled(isEqualizerEnabled === false);
  }

  function handleEqualizerPresetChange(presetName: string) {
    for (const preset of EQUALIZER_PRESETS) {
      if (preset.name === presetName) {
        // slice() gives React a new array instead of sharing the preset array.
        setEqualizerGains(preset.gains.slice());
        return;
      }
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

    if (selectedTrack === undefined || trackIndex === currentTrackIndex) {
      return;
    }

    // Avoid reloading the current file, which would reset its displayed time.
    loadTrack(selectedTrack, trackIndex, false);
  }

  async function handlePlaylistTrackDoubleClick(trackIndex: number) {
    const selectedTrack = playlist[trackIndex];

    if (selectedTrack === undefined) {
      return;
    }

    /*
     * A double-click also produces normal click events. If those clicks have
     * already loaded this song, start the existing audio element directly.
     */
    if (currentTrackIndex === trackIndex) {
      const audioElement = audioPlayer.current;

      if (audioElement === null) {
        return;
      }

      try {
        await ensureAudioGraph();
        await audioElement.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('The double-clicked song could not play.', error);
      }

      return;
    }

    // onCanPlay will begin playback after the newly selected file is ready.
    loadTrack(selectedTrack, trackIndex, true);
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

  function seekBySeconds(secondsToMove: number) {
    const audioElement = audioPlayer.current;

    if (audioElement === null || audioSource === '') {
      return;
    }

    let newTime = audioElement.currentTime + secondsToMove;

    if (newTime < 0) {
      newTime = 0;
    }

    if (duration > 0 && newTime > duration) {
      newTime = duration;
    }

    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleKeyboardPlayPause() {
    // The keyboard event cannot await playback, so start it without blocking.
    void handlePlayPauseBtnClick();
  }

  function handleKeyboardSeekBackward() {
    seekBySeconds(-5);
  }

  function handleKeyboardSeekForward() {
    seekBySeconds(5);
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
        const filePath = window.electronAPI.getFilePath(selectedFile);
        const newTrack = await createTrackFromFile(selectedFile, filePath);
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

  function handleMovePlaylistTrack(fromIndex: number, toIndex: number) {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= playlist.length ||
      toIndex >= playlist.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const updatedPlaylist = playlist.slice();
    const movedTrack = updatedPlaylist[fromIndex];

    updatedPlaylist.splice(fromIndex, 1);
    updatedPlaylist.splice(toIndex, 0, movedTrack);
    setPlaylist(updatedPlaylist);

    // Keep currentTrackIndex pointing at the song that is already playing.
    if (currentTrackIndex === fromIndex) {
      setCurrentTrackIndex(toIndex);
    } else if (fromIndex < currentTrackIndex && toIndex >= currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    } else if (fromIndex > currentTrackIndex && toIndex <= currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
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

    if (event.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
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

    if (event.dataTransfer.files.length > 0) {
      await addFilesToPlaylist(event.dataTransfer.files);
    }
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

  return (
    <main className="desktop-stage">
      <section ref={playerSkin} className="milestone">
        <div className="skin-glow skin-glow-top-red" />
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
          isEqualizerEnabled={isEqualizerEnabled}
          equalizerGains={equalizerGains}
          onToggle={handleEqualizerToggleBtnClick}
          onPresetChange={handleEqualizerPresetChange}
          onGainChange={handleEqualizerGainChange}
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
          onTrackDoubleClick={handlePlaylistTrackDoubleClick}
          onMoveTrack={handleMovePlaylistTrack}
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
