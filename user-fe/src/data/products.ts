export interface Product {
  id: string | number;
  name: string;
  manufacturer: string;
  packSize: string;
  mrp: number;
  price: number;
  discount: number;
  prescriptionRequired: boolean;
  deliveryTime: string;
  category: string;
  inStock: boolean;
  image: string;
  description: string;
  saltComposition?: string;
  storageInstructions: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Dolo 650 Tablet",
    manufacturer: "Micro Labs Ltd",
    packSize: "15 tablets",
    mrp: 35,
    price: 30,
    discount: 14,
    prescriptionRequired: false,
    deliveryTime: "10 mins",
    category: "Medicines",
    inStock: true,
    image: "",
    description:
      "Dolo 650 Tablet is commonly used for temporary relief from fever and mild to moderate pain. Use medicines only as directed by a qualified healthcare professional.",
    saltComposition: "Paracetamol 650 mg",
    storageInstructions:
      "Store in a cool and dry place away from direct sunlight.",
  },
  {
    id: 2,
    name: "Paracetamol 500mg",
    manufacturer: "Healthcare Pharma",
    packSize: "10 tablets",
    mrp: 25,
    price: 21,
    discount: 16,
    prescriptionRequired: false,
    deliveryTime: "10 mins",
    category: "Medicines",
    inStock: true,
    image: "",
    description:
      "A healthcare product listed for pain and fever relief. Follow the product label and professional medical advice before use.",
    saltComposition: "Paracetamol 500 mg",
    storageInstructions:
      "Store below 30°C in a dry place.",
  },
  {
    id: 3,
    name: "Vitamin C Tablets",
    manufacturer: "HealthCare Nutrition",
    packSize: "30 tablets",
    mrp: 299,
    price: 249,
    discount: 17,
    prescriptionRequired: false,
    deliveryTime: "12 mins",
    category: "Nutrition",
    inStock: true,
    image: "",
    description:
      "Vitamin C supplement intended to support general nutritional requirements.",
    storageInstructions:
      "Keep tightly closed and store in a cool and dry place.",
  },
  {
    id: 4,
    name: "Digital Thermometer",
    manufacturer: "GoHealth Devices",
    packSize: "1 unit",
    mrp: 399,
    price: 299,
    discount: 25,
    prescriptionRequired: false,
    deliveryTime: "10 mins",
    category: "Health Devices",
    inStock: true,
    image: "",
    description:
      "A digital healthcare device designed for convenient temperature measurement.",
    storageInstructions:
      "Store safely in the protective case when not in use.",
  },
  {
    id: 5,
    name: "Multivitamin Tablets",
    manufacturer: "Wellness Labs",
    packSize: "60 tablets",
    mrp: 599,
    price: 449,
    discount: 25,
    prescriptionRequired: false,
    deliveryTime: "15 mins",
    category: "Nutrition",
    inStock: true,
    image: "",
    description:
      "A nutritional supplement containing multiple vitamins for general dietary support.",
    storageInstructions:
      "Store in a cool and dry place.",
  },
  {
    id: 6,
    name: "Azithromycin 500mg",
    manufacturer: "Healthcare Pharma",
    packSize: "5 tablets",
    mrp: 140,
    price: 120,
    discount: 14,
    prescriptionRequired: true,
    deliveryTime: "12 mins",
    category: "Medicines",
    inStock: true,
    image: "",
    description:
      "A prescription medicine that should only be supplied and used based on a valid prescription and professional medical guidance.",
    saltComposition: "Azithromycin 500 mg",
    storageInstructions:
      "Store according to the product packaging instructions.",
  },
  {
    id: 7,
    name: "Pain Relief Spray",
    manufacturer: "Wellness Healthcare",
    packSize: "100 ml",
    mrp: 250,
    price: 210,
    discount: 16,
    prescriptionRequired: false,
    deliveryTime: "10 mins",
    category: "Wellness",
    inStock: true,
    image: "",
    description:
      "A topical healthcare product intended for temporary relief of minor muscular discomfort.",
    storageInstructions:
      "Keep away from excessive heat and direct sunlight.",
  },
  {
    id: 8,
    name: "First Aid Kit",
    manufacturer: "GoHealth",
    packSize: "1 kit",
    mrp: 699,
    price: 549,
    discount: 21,
    prescriptionRequired: false,
    deliveryTime: "15 mins",
    category: "First Aid",
    inStock: true,
    image: "",
    description:
      "A collection of basic first-aid supplies for common minor injuries and emergencies.",
    storageInstructions:
      "Store in an accessible, cool, and dry location.",
  },
];