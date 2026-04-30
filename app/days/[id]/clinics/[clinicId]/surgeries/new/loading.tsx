export default function NewSurgeryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-4 w-12 bg-slate-200 rounded" />
        <div className="space-y-1">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="h-3.5 w-32 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="card p-5 space-y-5">
        <div className="h-4 w-16 bg-slate-200 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-24 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-100 rounded-lg" />
          </div>
        ))}
        <div className="h-4 w-16 bg-slate-200 rounded mt-2" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-20 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-10 flex-1 bg-slate-200 rounded-lg" />
          <div className="h-10 flex-1 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
