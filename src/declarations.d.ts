// Allow TypeScript files to import CSS files.
declare module '*.css';

// Webpack replaces a PNG import with the path to its copied image file.
declare module '*.png' {
  const imagePath: string;
  export default imagePath;
}

/*
 * Add our preload API to the browser's existing Window type.
 * This file only describes types; it does not run any application code.
 */
interface Window {
  electronAPI: {
    getFilePath: (file: File) => string;
    readAudioFile: (filePath: string) => Promise<ArrayBuffer>;
    minimizeWindow: () => Promise<void>;
    // Promise<void> means the request finishes later without returning data.
    closeWindow: () => Promise<void>;
  };
}
