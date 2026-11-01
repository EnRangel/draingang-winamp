import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MissingTracksWarning from './MissingTracksWarning';

describe('MissingTracksWarning', () => {
  it('uses singular wording for one missing track', () => {
    render(<MissingTracksWarning missingTrackCount={1} onDismiss={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      '1 MISSING TRACK SKIPPED',
    );
  });

  it('uses plural wording and lets the user dismiss the warning', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();

    render(
      <MissingTracksWarning missingTrackCount={2} onDismiss={handleDismiss} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      '2 MISSING TRACKS SKIPPED',
    );

    await user.click(
      screen.getByRole('button', { name: 'Dismiss missing track warning' }),
    );

    expect(handleDismiss).toHaveBeenCalledOnce();
  });
});
