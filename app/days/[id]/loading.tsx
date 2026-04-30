export default function DayDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-16 bg-slate-200 rounded" />
        <div className="h-6 w-56 bg-slate-200 rounded" />
        <div className="h-4 w-32 bg-slate-200 rounded" />
      </div>
      <div className="card p-4 space-y-3">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="card h-32" />
        <div className="card h-32" />
      </div>
    </div>
  );
}
