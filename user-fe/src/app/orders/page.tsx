import OrdersContent from "@/src/components/order/OrdersContent";

export default function OrdersPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFA]">
      <div className="container-custom py-8 sm:py-12">
        <OrdersContent />
      </div>
    </main>
  );
}