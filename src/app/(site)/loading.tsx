export default function Loading() {
  return (
    <div className="container-ep py-8" aria-busy="true" aria-label="Yükleniyor">
      <div className="skeleton h-10 w-64" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line bg-ash">
            <div className="skeleton h-40 rounded-none" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-6 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
