type MissingTracksWarningProps = {
  missingTrackCount: number;
  onDismiss: () => void;
};

function MissingTracksWarning({
  missingTrackCount,
  onDismiss,
}: MissingTracksWarningProps) {
  if (missingTrackCount <= 0) {
    return null;
  }

  let trackWord = 'TRACKS';

  if (missingTrackCount === 1) {
    trackWord = 'TRACK';
  }

  return (
    // role="alert" makes screen readers announce the warning when it appears.
    <div className="missing-tracks-warning" role="alert">
      <span>
        {missingTrackCount} MISSING {trackWord} SKIPPED
      </span>

      <button
        className="missing-tracks-dismiss"
        type="button"
        aria-label="Dismiss missing track warning"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}

export default MissingTracksWarning;
