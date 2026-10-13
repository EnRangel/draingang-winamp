# Drainamp

A learning-focused desktop music player inspired by classic Winamp skins and
internet-grunge artwork.

## Step 1: one Electron window

The first milestone only proves that the desktop shell and its web interface
work together. The normal Windows title bar is intentional for now; we will
replace it after we build working window controls.

### Run the project

```powershell
npm start
```

The important learning files are:

- `src/main.ts`: creates and manages the desktop window.
- `src/index.html`: contains the temporary page structure.
- `src/index.css`: styles that page.
- `src/renderer.ts`: runs inside the page and handles its behavior.
- `src/preload.ts`: reserved for safe access to desktop features.
