import Hero from "@/src/components/home/Hero"
import Categories from "../components/home/Categories";
import NearbyPharmacies from "../components/home/NearbyPharmacies";
import PopularProducts from "../components/home/PopularProducts";
import WhyPharma2u from "../components/home/WhyPharma2u";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Categories />
      <NearbyPharmacies />
      <PopularProducts />
      <WhyPharma2u />
    </main>
  );
}
