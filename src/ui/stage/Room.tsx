// The chamber the player is inside. Abstract, CSS/DOM only. Each committed
// decision leaves a mark on the left boundary — history, not judgment — so the
// room is not quite as untouched at the end as it was at the start.
export function Room({ traces = 0 }: { traces?: number }) {
  const marks = Math.min(traces, 12);
  return (
    <>
      <div className="room" aria-hidden="true">
        <div className="room-floor" />
      </div>
      {marks > 0 && (
        <div className="room-traces" aria-hidden="true" data-count={marks}>
          {Array.from({ length: marks }, (_, i) => (
            <span key={i} className="room-trace" />
          ))}
        </div>
      )}
      <div className="grain" aria-hidden="true" />
    </>
  );
}
