export function ComingSoon({ message }: { message: string }) {
  return (
    <div className="stripes flex flex-col items-center gap-2 border border-dashed border-border-strong px-6 py-16 text-center">
      <span className="display text-3xl uppercase text-muted">Coming soon</span>
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
