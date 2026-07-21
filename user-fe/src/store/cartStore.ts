import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Product } from "@/src/data/products";

export interface CartPharmacy {
  id: string;
  name: string;
  address: string;
  deliveryTime: number | null;
  distance: number | null;
}

export interface CartItem {
  product: Product;
  quantity: number;

  pharmacy: CartPharmacy | null;

  unitPrice: number;

  availableStock: number | null;
}

interface AddToCartOptions {
  pharmacy?: CartPharmacy | null;
  unitPrice?: number;
  availableStock?: number | null;
}

interface CartStore {
  items: CartItem[];

  addItem: (
    product: Product,
    options?: AddToCartOptions
  ) => void;

  removeItem: (
    productId: Product["id"]
  ) => void;

  increaseQuantity: (
    productId: Product["id"]
  ) => void;

  decreaseQuantity: (
    productId: Product["id"]
  ) => void;

  clearCart: () => void;

  getTotalItems: () => number;

  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, options = {}) => {
        const {
          pharmacy = null,
          unitPrice = product.price,
          availableStock = null,
        } = options;

        set((state) => {
          const existingItem = state.items.find(
            (item) =>
              item.product.id === product.id &&
              item.pharmacy?.id === pharmacy?.id
          );

          if (existingItem) {
            return {
              items: state.items.map((item) => {
                const isSameItem =
                  item.product.id === product.id &&
                  item.pharmacy?.id === pharmacy?.id;

                if (!isSameItem) {
                  return item;
                }

                if (
                  item.availableStock !== null &&
                  item.quantity >= item.availableStock
                ) {
                  return item;
                }

                return {
                  ...item,
                  quantity: item.quantity + 1,
                };
              }),
            };
          }

          if (
            availableStock !== null &&
            availableStock <= 0
          ) {
            return state;
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity: 1,
                pharmacy,
                unitPrice,
                availableStock,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.product.id !== productId
          ),
        }));
      },

      increaseQuantity: (productId) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.product.id !== productId) {
              return item;
            }

            if (
              item.availableStock !== null &&
              item.quantity >= item.availableStock
            ) {
              return item;
            }

            return {
              ...item,
              quantity: item.quantity + 1,
            };
          }),
        }));
      },

      decreaseQuantity: (productId) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id === productId
                ? {
                    ...item,
                    quantity: item.quantity - 1,
                  }
                : item
            )
            .filter((item) => item.quantity > 0),
        }));
      },

      clearCart: () => {
        set({
          items: [],
        });
      },

      getTotalItems: () => {
        return get().items.reduce(
          (total, item) => total + item.quantity,
          0
        );
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) =>
            total + item.unitPrice * item.quantity,
          0
        );
      },
    }),
    {
      name: "gocure-cart",
    }
  )
);
