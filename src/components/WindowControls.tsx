function WindowControls() {
  function handleMinimizeClick() {
    window.electronAPI.minimizeWindow();
  }

  function handleCloseClick() {
    window.electronAPI.closeWindow();
  }

  return (
    <>
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
    </>
  );
}

export default WindowControls;
