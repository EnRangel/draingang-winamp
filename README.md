# Drainamp

A learning-focused desktop music player inspired by classic Winamp skins and
internet-grunge artwork.

Drainamp currently includes local audio playback, metadata and album artwork,
a reorderable playlist, a live visualizer, and an independent 10-band
equalizer with presets.

### Run the project

```powershell
npm start
```

The important learning files are:

- `src/main.ts`: creates and manages the desktop window.
- `src/preload.ts`: safely exposes the allowed window controls to React.
- `src/App.tsx`: coordinates playback, the playlist, and player settings.
- `src/components/`: contains the three smaller player panels.
- `src/audioEngine.ts`: builds the visualizer and 10-band audio filter chain.
- `src/index.css`: contains the Winamp-inspired skin.

### Keyboard shortcuts

- `Space`: play or pause.
- `Left Arrow`: seek backward five seconds.
- `Right Arrow`: seek forward five seconds.
- `Delete`: remove the selected playlist track.

Keyboard shortcuts pause while an input, slider, button, or preset menu has
focus so those controls keep their normal keyboard behavior.
