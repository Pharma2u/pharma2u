import OrderSuccessContent from "@/src/components/order/OrderSuccessContent";

interface OrderSuccessPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderSuccessPage({
  params,
}: OrderSuccessPageProps) {
  const { orderId } = await params;

  return (
    <main className="min-h-screen bg-[#F8FAFA]">
      <div className="container-custom py-8 sm:py-12">
        <OrderSuccessContent
          orderId={orderId}
        />
      </div>
    </main>
  );
}