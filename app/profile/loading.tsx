export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-slate-200 rounded" />

      <div className="card p-5 space-y-3">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-100 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-4 w-40 bg-slate-100 rounded" />
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-100 rounded-lg" />
        <div className="h-10 w-24 bg-slate-200 rounded-lg" />
      </div>

      <div className="card p-5 space-y-3">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-100 rounded-lg" />
        <div className="h-10 bg-slate-100 rounded-lg" />
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>

      <div className="card p-5">
        <div className="h-10 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}
