import type { Pharmacy } from "@/src/lib/pharmacy";

export const pharmacies: Pharmacy[] = [
  {
    id: "pharmacy-1",
    name: "GoCure Pharmacy",
    address: "Main Road, Kukatpally",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500072",

    latitude: 17.4948,
    longitude: 78.3996,

    rating: 4.8,
    reviewCount: 1240,

    isVerified: true,
    isOpen: true,

    deliveryTime: 10,
    distance: 1.2,
  },

  {
    id: "pharmacy-2",
    name: "HealthPlus Medical Store",
    address: "KPHB Colony",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500085",

    latitude: 17.4837,
    longitude: 78.3893,

    rating: 4.6,
    reviewCount: 842,

    isVerified: true,
    isOpen: true,

    deliveryTime: 12,
    distance: 2.1,
  },

  {
    id: "pharmacy-3",
    name: "CarePoint Pharmacy",
    address: "JNTU Road",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500090",

    latitude: 17.4987,
    longitude: 78.3915,

    rating: 4.5,
    reviewCount: 536,

    isVerified: true,
    isOpen: true,

    deliveryTime: 15,
    distance: 3.4,
  },

  {
    id: "pharmacy-4",
    name: "Wellness Medicals",
    address: "Miyapur Main Road",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500049",

    latitude: 17.4969,
    longitude: 78.3618,

    rating: 4.3,
    reviewCount: 312,

    isVerified: true,
    isOpen: false,

    deliveryTime: 20,
    distance: 5.7,
  },
];