// A React component is a function that returns interface elements.
function handleCloseBtnClick() {
    window.electronAPI.closeWindow();
}

function handleMinimizeBtnClick() {
    window.electronAPI.minimizeWindow();
}

function App() {
  return (
    <main className="milestone">
        <button className="window-minimize-btn" type="button" aria-label="Minimize Drainamp" onClick={handleMinimizeBtnClick}>
        -
        </button>
        {/* Without parentheses, we give React the function to run later. With parentheses, the function would run immediately while the component is being created. */}
        <button className="window-close-btn" type="button" aria-label="Close Drainamp" onClick={handleCloseBtnClick}>
        x
        </button>
        <p className="eyebrow">DRAINAMP // STEP 02</p>

        <h1>React is ready.</h1>

        <p id="status">
            One strange window. More strange things coming soon.
        </p>
    </main>
  );
}

// `export default` allows another file to import and display this component.
export default App;