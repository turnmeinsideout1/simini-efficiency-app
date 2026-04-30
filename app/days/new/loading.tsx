export default function NewDayLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-4 w-12 bg-slate-200 rounded" />
        <div className="h-6 w-40 bg-slate-200 rounded" />
      </div>
      <div className="card p-5 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-24 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-100 rounded-lg" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <div className="h-10 flex-1 bg-slate-200 rounded-lg" />
          <div className="h-10 flex-1 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
