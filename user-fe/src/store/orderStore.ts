import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  Order,
  OrderStatus,
} from "@/src/types/order";

interface OrderStore {
  orders: Order[];

  addOrder: (order: Order) => void;

  getOrderById: (
    orderId: string
  ) => Order | undefined;

  updateOrderStatus: (
    orderId: string,
    status: OrderStatus
  ) => void;

  clearOrders: () => void;
}

export const useOrderStore =
  create<OrderStore>()(
    persist(
      (set, get) => ({
        orders: [],

        addOrder: (order) => {
          set((state) => ({
            orders: [
              order,
              ...state.orders,
            ],
          }));
        },

        getOrderById: (orderId) => {
          return get().orders.find(
            (order) =>
              order.id === orderId
          );
        },

        updateOrderStatus: (
          orderId,
          status
        ) => {
          set((state) => ({
            orders: state.orders.map(
              (order) =>
                order.id === orderId
                  ? {
                      ...order,
                      status,
                    }
                  : order
            ),
          }));
        },

        clearOrders: () => {
          set({
            orders: [],
          });
        },
      }),
      {
        name: "gocure-orders",
      }
    )
  );