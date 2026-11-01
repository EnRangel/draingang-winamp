import { useEffect } from 'react';

type PlayerKeyboardShortcutActions = {
  onPlayPause: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onRemoveTrack: () => void;
};

function isTextOrSliderControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
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
      const isSpaceKey = event.code === 'Space' || event.key === ' ';

      /*
       * Inputs need their normal keyboard behavior. For example, arrow keys
       * should still adjust a focused volume or equalizer slider.
       */
      if (isTextOrSliderControl(event.target)) {
        return;
      }

      /*
       * Space activates a focused button already. Arrow and Delete shortcuts
       * are still allowed so they work after a playlist song is clicked.
       */
      if (event.target instanceof HTMLButtonElement && isSpaceKey) {
        return;
      }

      const isLeftKey =
        event.code === 'ArrowLeft' ||
        event.key === 'ArrowLeft' ||
        event.key === 'Left';
      const isRightKey =
        event.code === 'ArrowRight' ||
        event.key === 'ArrowRight' ||
        event.key === 'Right';
      const isDeleteKey = event.code === 'Delete' || event.key === 'Delete';

      if (isSpaceKey) {
        event.preventDefault();

        // Ignore a held key so play/pause only changes once per press.
        if (event.repeat === false) {
          onPlayPause();
        }
      } else if (isLeftKey) {
        event.preventDefault();
        onSeekBackward();
      } else if (isRightKey) {
        event.preventDefault();
        onSeekForward();
      } else if (isDeleteKey) {
        event.preventDefault();
        onRemoveTrack();
      }
    }

    // Capture mode sees the key before a focused child control handles it.
    window.addEventListener('keydown', handleKeyDown, true);

    // Remove the listener before React installs a newer version of it.
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onPlayPause, onSeekBackward, onSeekForward, onRemoveTrack]);
}
