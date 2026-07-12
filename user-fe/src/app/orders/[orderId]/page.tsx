import OrderDetailsContent from "@/src/components/order/OrderDetailsContent";

interface OrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { orderId } = await params;

  return (
    <main className="min-h-screen bg-[#F8FAFA]">
      <div className="container-custom py-8 sm:py-12">
        <OrderDetailsContent orderId={orderId} />
      </div>
    </main>
  );
}