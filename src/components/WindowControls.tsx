// MouseEvent tells TypeScript that this event came from an HTML button.
import type { MouseEvent } from 'react';

function WindowControls() {
  function handleMinimizeClick(event: MouseEvent<HTMLButtonElement>) {
    // Electron keeps button focus while its window is hidden. Removing focus
    // before minimizing prevents that highlight from appearing after restore.
    event.currentTarget.blur();

    // void starts the asynchronous request without making React wait for it.
    void window.electronAPI.minimizeWindow();
  }

  function handleCloseClick() {
    void window.electronAPI.closeWindow();
  }

  return (
    // Grouping the buttons creates one reliable no-drag area in Electron.
    <div className="window-controls" aria-label="Window controls">
      <button
        className="window-minimize-btn"
        type="button"
        aria-label="Minimize Drainamp"
        onClick={handleMinimizeClick}
      >
        −
      </button>

      <button
        className="window-close-btn"
        type="button"
        aria-label="Close Drainamp"
        onClick={handleCloseClick}
      >
        ×
      </button>
    </div>
  );
}

export default WindowControls;
