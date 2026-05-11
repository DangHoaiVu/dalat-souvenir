import { create } from "zustand";
import { persist } from "zustand/middleware";

import { cartProductId } from "@/lib/cart-product-id";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  selectedItemIds: string[]; // Store product_id of selected items
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  toggleItemSelection: (productId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  removeSelectedItems: () => void;
}


export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedItemIds: [],
      isOpen: false,
      totalItems: 0,
      totalPrice: 0,
      addItem: (product, quantity = 1) =>
        set((state) => {
          const pid = cartProductId(product);
          const existing = state.items.find((item) => cartProductId(item.product) === pid);
          const updatedItems = existing
            ? state.items.map((item) =>
                cartProductId(item.product) === pid
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              )
            : [...state.items, { product, quantity }];

          // Auto-select new items
          const newSelectedIds = existing 
            ? state.selectedItemIds 
            : [...state.selectedItemIds, pid];

          return {
            items: updatedItems,
            selectedItemIds: newSelectedIds,
            totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
            totalPrice: updatedItems.reduce(
              (total, item) => total + item.product.price * item.quantity,
              0,
            ),
          };
        }),
      removeItem: (productId) =>
        set((state) => {
          const updatedItems = state.items.filter((item) => cartProductId(item.product) !== productId);
          return {
            items: updatedItems,
            selectedItemIds: state.selectedItemIds.filter((id) => id !== productId),
            totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
            totalPrice: updatedItems.reduce(
              (total, item) => total + item.product.price * item.quantity,
              0,
            ),
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          const updatedItems =
            quantity <= 0
              ? state.items.filter((item) => cartProductId(item.product) !== productId)
              : state.items.map((item) =>
                  cartProductId(item.product) === productId ? { ...item, quantity } : item,
                );
          return {
            items: updatedItems,
            selectedItemIds: quantity <= 0 
              ? state.selectedItemIds.filter((id) => id !== productId)
              : state.selectedItemIds,
            totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
            totalPrice: updatedItems.reduce(
              (total, item) => total + item.product.price * item.quantity,
              0,
            ),
          };
        }),
      clearCart: () => set({ items: [], selectedItemIds: [], totalItems: 0, totalPrice: 0 }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      toggleItemSelection: (productId) => 
        set((state) => ({
          selectedItemIds: state.selectedItemIds.includes(productId)
            ? state.selectedItemIds.filter((id) => id !== productId)
            : [...state.selectedItemIds, productId],
        })),
      selectAllItems: () => 
        set((state) => ({
          selectedItemIds: state.items.map((item) => cartProductId(item.product)),
        })),
      deselectAllItems: () => set({ selectedItemIds: [] }),
      removeSelectedItems: () => 
        set((state) => {
          const updatedItems = state.items.filter((item) => !state.selectedItemIds.includes(cartProductId(item.product)));
          return {
            items: updatedItems,
            selectedItemIds: [],
            totalItems: updatedItems.reduce((total, item) => total + item.quantity, 0),
            totalPrice: updatedItems.reduce(
              (total, item) => total + item.product.price * item.quantity,
              0,
            ),
          };
        }),
    }),

    { name: "shopluuniem-cart" },
  ),
);
