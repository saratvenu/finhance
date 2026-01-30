export interface PurchaseItem {
  id: string;
  label: string;
  defaultPrice: number;
  image: string;
  category: "car" | "bike" | "realestate" | "gadget";
  subCategory?: "phone" | "laptop" | "gold";
  tier: "base" | "mid" | "top";
}

export const PURCHASE_ITEMS: PurchaseItem[] = [
  // Cars
  {
    id: "alto-k10",
    label: "Maruti Suzuki Alto K10",
    defaultPrice: 500000,
    image: "/purchase-items/alto-k10.png",
    category: "car",
    tier: "base",
  },
  {
    id: "mahindra-be6",
    label: "Mahindra BE 6e",
    defaultPrice: 2000000,
    image: "/purchase-items/mahindra-be6.png",
    category: "car",
    tier: "mid",
  },
  {
    id: "defender",
    label: "Land Rover Defender",
    defaultPrice: 13000000,
    image: "/purchase-items/defender.png",
    category: "car",
    tier: "top",
  },

  // Bikes
  {
    id: "splendor",
    label: "Hero Splendor Plus",
    defaultPrice: 80000,
    image: "/purchase-items/hero-splendor.png",
    category: "bike",
    tier: "base",
  },
  {
    id: "classic-350",
    label: "Royal Enfield Classic 350",
    defaultPrice: 200000,
    image: "/purchase-items/classic-350.png",
    category: "bike",
    tier: "mid",
  },
  {
    id: "ninja-h2",
    label: "Kawasaki Ninja H2",
    defaultPrice: 8000000,
    image: "/purchase-items/ninja-h2.png",
    category: "bike",
    tier: "top",
  },

  // Real Estate
  {
    id: "1bhk",
    label: "1 BHK Apartment",
    defaultPrice: 3500000,
    image: "/purchase-items/1bhk.png",
    category: "realestate",
    tier: "base",
  },
  {
    id: "2bhk",
    label: "2 BHK Metro Apartment",
    defaultPrice: 7500000,
    image: "/purchase-items/2bhk.png",
    category: "realestate",
    tier: "mid",
  },
  {
    id: "villa",
    label: "Luxury Villa",
    defaultPrice: 30000000,
    image: "/purchase-items/villa.png",
    category: "realestate",
    tier: "top",
  },

  // Phone
  {
    id: "flagship-phone",
    label: "Flagship Smartphone",
    defaultPrice: 135000,
    image: "/purchase-items/flagship-phone.png",
    category: "gadget",
    subCategory: "phone",
    tier: "mid",
  },

  // Laptop
  {
    id: "macbook-pro",
    label: "MacBook Pro",
    defaultPrice: 250000,
    image: "/purchase-items/macbook-pro.png",
    category: "gadget",
    subCategory: "laptop",
    tier: "top",
  },

  // Gold
  {
    id: "gold",
    label: "Gold (24K, 10g)",
    defaultPrice: 150000,
    image: "/purchase-items/gold.png",
    category: "gadget",
    subCategory: "gold",
    tier: "top",
  },
];
