import { create } from "zustand";
import { persist } from "zustand/middleware";

import { cartProductId } from "@/lib/cart-product-id";
import type { CartItem, Product } from "@/types";

type CartSnapshot = {
  items: CartItem[];
  selectedItemIds: string[];
  totalItems: number;
  totalPrice: number;
};

interface CartState extends CartSnapshot {
  ownerKey: string | null;
  cartsByOwner: Record<string, CartSnapshot>;
  isOpen: boolean;
  setOwner: (ownerKey: string | null) => void;
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

const emptyCart = (): CartSnapshot => ({
  items: [],
  selectedItemIds: [],
  totalItems: 0,
  totalPrice: 0,
});

const totalsFor = (items: CartItem[]) => ({
  totalItems: items.reduce((total, item) => total + item.quantity, 0),
  totalPrice: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
});

const snapshotFromState = (state: CartState): CartSnapshot => ({
  items: state.items,
  selectedItemIds: state.selectedItemIds,
  totalItems: state.totalItems,
  totalPrice: state.totalPrice,
});

const commitCart = (
  state: CartState,
  snapshot: CartSnapshot,
  extra: Partial<CartState> = {},
): Partial<CartState> => ({
  ...snapshot,
  cartsByOwner: state.ownerKey
    ? { ...state.cartsByOwner, [state.ownerKey]: snapshot }
    : state.cartsByOwner,
  ...extra,
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...emptyCart(),
      ownerKey: null,
      cartsByOwner: {},
      isOpen: false,

      setOwner: (ownerKey) =>
        set((state) => {
          if (state.ownerKey === ownerKey) return state;

          const cartsByOwner = state.ownerKey
            ? { ...state.cartsByOwner, [state.ownerKey]: snapshotFromState(state) }
            : state.cartsByOwner;

          const nextSnapshot = ownerKey ? cartsByOwner[ownerKey] ?? emptyCart() : emptyCart();

          return {
            ...nextSnapshot,
            ownerKey,
            cartsByOwner,
            isOpen: ownerKey ? state.isOpen : false,
          };
        }),

      addItem: (product, quantity = 1) =>
        set((state) => {
          if (!state.ownerKey) return state;

          const pid = cartProductId(product);
          const existing = state.items.find((item) => cartProductId(item.product) === pid);
          const updatedItems = existing
            ? state.items.map((item) =>
                cartProductId(item.product) === pid
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              )
            : [...state.items, { product, quantity }];

          const selectedItemIds = existing
            ? state.selectedItemIds
            : [...state.selectedItemIds, pid];

          return commitCart(state, {
            items: updatedItems,
            selectedItemIds,
            ...totalsFor(updatedItems),
          });
        }),

      removeItem: (productId) =>
        set((state) => {
          const updatedItems = state.items.filter((item) => cartProductId(item.product) !== productId);
          return commitCart(state, {
            items: updatedItems,
            selectedItemIds: state.selectedItemIds.filter((id) => id !== productId),
            ...totalsFor(updatedItems),
          });
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          const updatedItems =
            quantity <= 0
              ? state.items.filter((item) => cartProductId(item.product) !== productId)
              : state.items.map((item) =>
                  cartProductId(item.product) === productId ? { ...item, quantity } : item,
                );

          return commitCart(state, {
            items: updatedItems,
            selectedItemIds: quantity <= 0
              ? state.selectedItemIds.filter((id) => id !== productId)
              : state.selectedItemIds,
            ...totalsFor(updatedItems),
          });
        }),

      clearCart: () => set((state) => commitCart(state, emptyCart())),
      openCart: () => {
        if (!get().ownerKey) return;
        set({ isOpen: true });
      },
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => {
        if (!get().ownerKey) return;
        set((state) => ({ isOpen: !state.isOpen }));
      },
      toggleItemSelection: (productId) =>
        set((state) => {
          const selectedItemIds = state.selectedItemIds.includes(productId)
            ? state.selectedItemIds.filter((id) => id !== productId)
            : [...state.selectedItemIds, productId];

          return commitCart(state, { ...snapshotFromState(state), selectedItemIds });
        }),
      selectAllItems: () =>
        set((state) =>
          commitCart(state, {
            ...snapshotFromState(state),
            selectedItemIds: state.items.map((item) => cartProductId(item.product)),
          }),
        ),
      deselectAllItems: () =>
        set((state) => commitCart(state, { ...snapshotFromState(state), selectedItemIds: [] })),
      removeSelectedItems: () =>
        set((state) => {
          const updatedItems = state.items.filter(
            (item) => !state.selectedItemIds.includes(cartProductId(item.product)),
          );

          return commitCart(state, {
            items: updatedItems,
            selectedItemIds: [],
            ...totalsFor(updatedItems),
          });
        }),
    }),
    {
      name: "shopluuniem-cart",
      partialize: (state) => ({
        cartsByOwner: state.cartsByOwner,
      }),
    },
  ),
);
