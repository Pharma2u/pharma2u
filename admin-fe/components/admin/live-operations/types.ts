export type LiveOperationsData = {
  generatedAt: string;
  metrics: {
    ordersLive: number;
    ordersWaiting: number;
    ridersOnline: number;
    ridersBusy: number;
    ridersAvailable: number;
    vendorsOpen: number;
    delayedOrders: number;
    criticalAlerts: number;
  };
  riders: {
    id: string;
    name: string;
    status: "busy" | "available" | "offline";
    location: {
      lat: number;
      lng: number;
      isOnline: boolean;
      updatedAt: string;
    } | null;
    currentOrder: { id: string; orderCode: string; status: string } | null;
  }[];
  pharmacies: { id: string; name: string; address: string; isOpen: boolean }[];
  orders: LiveOrder[];
  delayedOrders: LiveOrder[];
  activities: {
    id: string;
    at: string;
    type: string;
    message: string;
    orderCode: string;
  }[];
  criticalAlerts: {
    id: string;
    type: string;
    label: string;
    count: number;
    orderId?: string;
  }[];
};
export type LiveOrder = {
  id: string;
  orderCode: string;
  customer: string;
  vendor: string;
  rider: string | null;
  status: string;
  eta: string | null;
  updatedAt: string;
  drop: { lat: number; lng: number } | null;
  total: number;
};
