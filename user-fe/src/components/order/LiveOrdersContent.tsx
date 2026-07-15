"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { listMyOrders, type CustomerOrder } from "@/src/lib/ordersApi";
import type { AuthRootState } from "@/src/store/authStore";

export default function LiveOrdersContent() {
  const session = useSelector((state: AuthRootState) => state.auth.session);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) return;
    let active = true;
    listMyOrders(session.token)
      .then((result) => {
        if (active) setOrders(result.items);
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Unable to load orders.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.token]);

  if (!session) {
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to view your orders</h1>
        <Link
          className="mt-4 inline-block font-bold text-[#2EB68F]"
          href="/login"
        >
          Sign in
        </Link>
      </div>
    );
  }
  if (loading) {
    return (
      <p className="px-5 py-16 text-center text-sm text-[#64717D]">
        Loading your orders…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[.18em] text-[#2EB68F]">
            ORDER HISTORY
          </p>
          <h1 className="mt-1 text-3xl font-bold">Your orders</h1>
        </div>
        <Link
          href="/products"
          className="rounded-xl bg-[#45C9A5] px-4 py-2 text-sm font-bold text-white"
        >
          Shop medicines
        </Link>
      </div>
      {error && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <p className="rounded-2xl border bg-white p-8 text-center text-sm text-[#64717D]">
            You have not placed an order yet.
          </p>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-[#E5EAE8] bg-white p-5 transition hover:border-[#45C9A5]"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-bold text-[#17212B]">{order.orderCode}</p>
                  <p className="mt-1 text-sm text-[#64717D]">
                    {order.pharmacy.name} ·{" "}
                    {order.items
                      .map((item) => `${item.name} × ${item.qty}`)
                      .join(", ")}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase text-[#64717D]">
                    {order.paymentMethod} · {order.paymentStatus}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#17212B]">₹{order.total}</p>
                  <p className="mt-1 text-xs font-bold capitalize text-[#2EB68F]">
                    {order.status.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
