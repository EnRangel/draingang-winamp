// Importing a CSS file makes webpack include those styles in the application.
import './index.css';

// The renderer is the web-page part of Electron. It controls everything the
// user sees and clicks. React will take over this job in our next step.
const statusMessage = document.querySelector('#status');

// `querySelector` can return null if no matching element exists, so we check
// the result before trying to change its text.
if (statusMessage) {
  statusMessage.textContent = 'Electron renderer loaded successfully.';
}
