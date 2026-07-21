export default function Loading() {
  return (
    <main className="min-h-screen bg-[#FAF9FD]">
      <div className="mx-auto w-full max-w-[1240px] animate-pulse px-4 py-8 sm:px-6">
        <div className="h-4 w-36 rounded bg-[#E5E1EA]" />
        <div className="mt-5 overflow-hidden rounded-3xl border border-[#E8E3EE] bg-white">
          <div className="h-52 bg-[#DDD5F1]" />
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="h-5 rounded bg-[#ECE9F0]" />
            <div className="h-5 rounded bg-[#ECE9F0]" />
            <div className="h-5 rounded bg-[#ECE9F0]" />
          </div>
        </div>
        <div className="mt-9 h-8 w-48 rounded bg-[#E6E2EA]" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-[#EAE6EF] bg-white">
              <div className="h-44 bg-[#F0EDF3]" />
              <div className="space-y-3 p-4">
                <div className="h-4 rounded bg-[#EAE6EE]" />
                <div className="h-4 w-2/3 rounded bg-[#EFECEF]" />
                <div className="h-9 rounded bg-[#E4DDF5]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

