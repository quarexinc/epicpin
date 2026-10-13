export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton mt-2 h-4 w-72" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton mt-4 h-72 rounded-2xl" />
    </div>
  );
}
