import NearbyPharmaciesSection from "@/src/components/home/NearbyPharmaciesSection";

export default function PharmaciesPage() {
  return (
    <main className="min-h-screen bg-[#FAF9FD]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">
        <NearbyPharmaciesSection fullPage />
      </div>
    </main>
  );
}

