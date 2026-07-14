import {
  Baby,
  Bandage,
  Dumbbell,
  HeartPulse,
  MoreHorizontal,
  Pill,
  ShieldPlus,
  Sparkles,
} from "lucide-react";

export const categories = [
  {
    id: 1,
    name: "Medicines",
    description: "Prescription & OTC",
    icon: Pill,
    href: "/category/medicines",
  },
  {
    id: 2,
    name: "Wellness",
    description: "Daily healthcare",
    icon: HeartPulse,
    href: "/category/wellness",
  },
  {
    id: 3,
    name: "Personal Care",
    description: "Care essentials",
    icon: Sparkles,
    href: "/category/personal-care",
  },
  {
    id: 4,
    name: "Baby Care",
    description: "For your little ones",
    icon: Baby,
    href: "/category/baby-care",
  },
  {
    id: 5,
    name: "Health Devices",
    description: "Medical equipment",
    icon: ShieldPlus,
    href: "/category/health-devices",
  },
  {
    id: 6,
    name: "Nutrition",
    description: "Health & fitness",
    icon: Dumbbell,
    href: "/category/nutrition",
  },
  {
    id: 7,
    name: "First Aid",
    description: "Emergency essentials",
    icon: Bandage,
    href: "/category/first-aid",
  },
  {
    id: 8,
    name: "More",
    description: "Explore all",
    icon: MoreHorizontal,
    href: "/categories",
  },
];


