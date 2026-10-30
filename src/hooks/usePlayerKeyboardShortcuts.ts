import { useEffect } from 'react';

type PlayerKeyboardShortcutActions = {
  onPlayPause: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onRemoveTrack: () => void;
};

function isControlElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLButtonElement ||
    target instanceof HTMLTextAreaElement
  );
}

export function usePlayerKeyboardShortcuts({
  onPlayPause,
  onSeekBackward,
  onSeekForward,
  onRemoveTrack,
}: PlayerKeyboardShortcutActions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      /*
       * Inputs need their normal keyboard behavior. For example, arrow keys
       * should still adjust a focused volume or equalizer slider.
       */
      if (isControlElement(event.target)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();

        // Ignore a held key so play/pause only changes once per press.
        if (event.repeat === false) {
          onPlayPause();
        }
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        onSeekBackward();
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        onSeekForward();
      } else if (event.code === 'Delete') {
        event.preventDefault();
        onRemoveTrack();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    // Remove the listener before React installs a newer version of it.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPlayPause, onSeekBackward, onSeekForward, onRemoveTrack]);
}
