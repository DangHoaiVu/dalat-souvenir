export interface Category {
  category_id?: string;
  id?: number;
  name: string;
  slug?: string;
  image?: string;
  productCount?: number;
}

export interface Product {
  product_id: string;
  category_id: string;
  id?: number;
  name: string;
  slug?: string;
  description: string;
  story?: string;
  price: number;
  comparePrice: number;
  images?: string[];
  image?: string;
  unit?: string;
  weightGram?: number;
  stock: number;
  category?: Partial<Category>;
  categories?: Partial<Category>;
  avgRating?: number;
  reviewCount?: number;
  tags?: string[];
  is_for_sale?: boolean;
  /** ISO timestamp from DB for client-side sort */
  createdAt?: string;
  promoted_gift?: Partial<Product>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: number | string;
  name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  address: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Order {
  id: number | string;
  code: string;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  deliveryStartedAt?: string;
  estimatedArrivalAt?: string;
  paymentMethod: "cod" | "vnpay";
  paymentStatus: "unpaid" | "paid";
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  shippingAddress: Address;
  createdAt: string;
}

export interface OrderItem {
  id: number | string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Review {
  id: number;
  user: { name: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  points: number;
  role: "customer" | "seller" | "admin";
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonLink: string;
}
export interface Promotion {
  promotion_id: string;
  name: string;
  start_date: string;
  end_date: string;
  image?: string;
  is_active: boolean;
  fixed_price?: number;
  description?: string;
  items?: any[];
}

export interface PromotionItem {
  promotion_id: string;
  product_id: string;
  discount_percentage?: number;
  gift_product_id?: string;
}
