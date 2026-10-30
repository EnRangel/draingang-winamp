import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import EqualizerPanel from './EqualizerPanel';

describe('EqualizerPanel', () => {
  it('shows ten independent gains and reports which slider changed', () => {
    const handleGainChange = vi.fn();

    render(
      <EqualizerPanel
        equalizerGains={[4, 0, 0, 0, 0, 0, 0, 0, 0, -2]}
        onGainChange={handleGainChange}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('slider')).toHaveLength(10);
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('16K')).toBeInTheDocument();

    const firstSlider = screen.getByRole('slider', { name: '60 Hz gain 4' });

    fireEvent.change(firstSlider, {
      target: { value: '7' },
    });

    expect(handleGainChange).toHaveBeenCalledOnce();
    expect(handleGainChange.mock.calls[0][0]).toBe(0);
  });

  it('reports a reset-button click', async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();

    render(
      <EqualizerPanel
        equalizerGains={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
        onGainChange={vi.fn()}
        onReset={handleReset}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'RESET' }));

    expect(handleReset).toHaveBeenCalledOnce();
  });
});
