import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WindowControls from './WindowControls';

describe('WindowControls', () => {
  beforeEach(() => {
    // Electron normally supplies this object through preload.ts.
    window.electronAPI = {
      getFilePath: vi.fn(),
      readAudioFile: vi.fn(),
      minimizeWindow: vi.fn().mockResolvedValue(undefined),
      closeWindow: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('asks Electron to minimize the window', async () => {
    const user = userEvent.setup();
    render(<WindowControls />);

    await user.click(screen.getByRole('button', { name: 'Minimize Drainamp' }));

    expect(window.electronAPI.minimizeWindow).toHaveBeenCalledOnce();
  });

  it('asks Electron to close the window', async () => {
    const user = userEvent.setup();
    render(<WindowControls />);

    await user.click(screen.getByRole('button', { name: 'Close Drainamp' }));

    expect(window.electronAPI.closeWindow).toHaveBeenCalledOnce();
  });
});
