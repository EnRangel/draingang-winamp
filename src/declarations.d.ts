// Allow TypeScript files to import CSS files.
declare module '*.css';

/*
 * Add our preload API to the browser's existing Window type.
 * This file only describes types; it does not run any application code.
 */
interface Window {
  electronAPI: {
    minimizeWindow: () => void;
    // This function takes no arguments and returns no value.
    closeWindow: () => void;
  };
}