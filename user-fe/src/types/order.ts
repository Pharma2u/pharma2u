import type { Product } from "@/src/data/products";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderPaymentMethod =
  | "upi"
  | "card"
  | "cod";

export interface OrderPharmacy {
  id: string;
  name: string;
  address: string;
  deliveryTime: number;
  distance: number;
}




export interface OrderAddress {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  state?: string;
  pincode?: string;
}

export interface OrderItem {
  product: Product;

  quantity: number;

  pharmacy: OrderPharmacy;

  unitPrice: number;

  availableStock: number | null;
}

export interface Order {
  id: string;

  items: OrderItem[];

  address: OrderAddress;

  paymentMethod: OrderPaymentMethod;

  deliveryInstructions: string;

  subtotal: number;

  totalMRP: number;

  savings: number;

  deliveryFee: number;

  totalAmount: number;

  estimatedDeliveryTime: number;

  status: OrderStatus;

  createdAt: string;
}