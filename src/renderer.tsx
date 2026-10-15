import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

// Find the empty <div id="root"> that we added to index.html.
const rootElement = document.getElementById('root');
// The element could theoretically be missing, so we check before using it.
if (!rootElement) {
  throw new Error('Could not find the React root element.');
}
// createRoot gives React control of the HTML element.
const root = createRoot(rootElement);
// Render our App component inside <div id="root">.
root.render(<App />);
