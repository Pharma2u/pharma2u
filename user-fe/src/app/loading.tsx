const blocks = Array.from({ length: 6 });

export default function Loading() {
  return (
    <main className="bg-white">
      <div className="mx-auto w-full max-w-[1240px] animate-pulse px-4 sm:px-6">
        <section className="mt-4 grid min-h-[370px] overflow-hidden rounded-3xl bg-[#F2EEFC] lg:grid-cols-2">
          <div className="px-5 py-10 sm:px-10 lg:px-14">
            <div className="h-8 w-48 rounded-full bg-white/80" />
            <div className="mt-6 h-12 w-4/5 rounded-xl bg-white/80" />
            <div className="mt-3 h-12 w-3/5 rounded-xl bg-white/80" />
            <div className="mt-6 h-5 w-2/3 rounded bg-white/70" />
            <div className="mt-7 h-14 max-w-xl rounded-2xl bg-white" />
          </div>
          <div className="hidden items-center justify-center lg:flex">
            <div className="h-56 w-56 rounded-full bg-white/70" />
          </div>
        </section>

        {[0, 1, 2].map((section) => (
          <section className="mt-11" key={section}>
            <div className="h-7 w-56 rounded-lg bg-[#ECE9F1]" />
            <div className="mt-2 h-3 w-72 rounded bg-[#F2EFF5]" />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {blocks.map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-[#EEEAF3]"
                >
                  <div className="h-36 bg-[#F4F2F7]" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-20 rounded bg-[#E9E6ED]" />
                    <div className="h-4 w-full rounded bg-[#E9E6ED]" />
                    <div className="h-4 w-3/4 rounded bg-[#EFECEF]" />
                    <div className="flex items-center justify-between pt-3">
                      <div className="h-5 w-14 rounded bg-[#E7E4EA]" />
                      <div className="h-9 w-16 rounded-lg bg-[#DED7F3]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

