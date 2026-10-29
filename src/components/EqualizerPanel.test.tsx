import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import EqualizerPanel from './EqualizerPanel';

describe('EqualizerPanel', () => {
  it('shows each saved gain and reports slider changes', () => {
    const handleBassChange = vi.fn();

    render(
      <EqualizerPanel
        bassGain={4}
        midGain={0}
        trebleGain={-2}
        onBassChange={handleBassChange}
        onMidChange={vi.fn()}
        onTrebleChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('slider')).toHaveLength(10);
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('16K')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider', { name: '60 Hz bass 4' }), {
      target: { value: '7' },
    });

    expect(handleBassChange).toHaveBeenCalledOnce();
  });

  it('reports a reset-button click', async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();

    render(
      <EqualizerPanel
        bassGain={0}
        midGain={0}
        trebleGain={0}
        onBassChange={vi.fn()}
        onMidChange={vi.fn()}
        onTrebleChange={vi.fn()}
        onReset={handleReset}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'RESET' }));

    expect(handleReset).toHaveBeenCalledOnce();
  });
});
