'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, ViewName, Order, Restaurant } from './types'

interface FoodState {
  // navigation
  view: ViewName
  selectedRestaurantSlug: string | null
  activeOrderId: string | null
  address: string
  setView: (v: ViewName) => void
  openRestaurant: (slug: string) => void
  goToTracking: (orderId: string) => void
  setAddress: (a: string) => void

  // cart
  cart: CartItem[]
  cartRestaurantId: string | null
  cartRestaurantName: string | null
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (item: CartItem) => void
  updateQuantity: (uid: string, delta: number) => void
  removeFromCart: (uid: string) => void
  clearCart: () => void
  // coupon / tip
  appliedCoupon: { code: string; discount: number } | null
  tip: number
  setAppliedCoupon: (c: { code: string; discount: number } | null) => void
  setTip: (t: number) => void

  // orders
  orders: Order[]
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: string, rider?: { name: string; phone: string }) => void

  // last viewed restaurants
  lastOrder: Order | null
  setLastOrder: (o: Order | null) => void
}

function computeUnitPrice(item: CartItem): number {
  const variantExtra = item.selectedVariants.reduce((s, v) => s + v.price, 0)
  const addonExtra = item.selectedAddons.reduce((s, a) => s + a.price, 0)
  return item.price + variantExtra + addonExtra
}

export const useFoodStore = create<FoodState>()(
  persist(
    (set, get) => ({
      view: 'home',
      selectedRestaurantSlug: null,
      activeOrderId: null,
      address: 'MG Road, Bangalore',
      setView: (v) => set({ view: v }),
      openRestaurant: (slug) => set({ selectedRestaurantSlug: slug, view: 'restaurant' }),
      goToTracking: (orderId) => set({ activeOrderId: orderId, view: 'tracking' }),
      setAddress: (a) => set({ address: a }),

      cart: [],
      cartRestaurantId: null,
      cartRestaurantName: null,
      cartOpen: false,
      setCartOpen: (open) => set({ cartOpen: open }),
      addToCart: (item) => {
        const existing = get().cart.find(
          (c) =>
            c.menuItemId === item.menuItemId &&
            JSON.stringify(c.selectedVariants) === JSON.stringify(item.selectedVariants) &&
            JSON.stringify(c.selectedAddons) === JSON.stringify(item.selectedAddons)
        )
        if (existing) {
          set({
            cart: get().cart.map((c) =>
              c.uid === existing.uid
                ? { ...c, quantity: c.quantity + item.quantity, total: (c.quantity + item.quantity) * c.unitPrice }
                : c
            ),
          })
        } else {
          const unitPrice = computeUnitPrice(item)
          const total = unitPrice * item.quantity
          set({
            cart: [...get().cart, { ...item, unitPrice, total }],
            cartRestaurantId: item.restaurantId,
            cartRestaurantName: item.restaurantName,
          })
        }
      },
      updateQuantity: (uid, delta) => {
        set({
          cart: get()
            .cart.map((c) => {
              if (c.uid !== uid) return c
              const q = c.quantity + delta
              return { ...c, quantity: q, total: q * c.unitPrice }
            })
            .filter((c) => c.quantity > 0),
        })
        if (get().cart.length === 0) {
          set({ cartRestaurantId: null, cartRestaurantName: null, appliedCoupon: null })
        }
      },
      removeFromCart: (uid) => {
        set({ cart: get().cart.filter((c) => c.uid !== uid) })
        if (get().cart.length === 0) {
          set({ cartRestaurantId: null, cartRestaurantName: null, appliedCoupon: null })
        }
      },
      clearCart: () =>
        set({
          cart: [],
          cartRestaurantId: null,
          cartRestaurantName: null,
          appliedCoupon: null,
          tip: 0,
        }),

      appliedCoupon: null,
      tip: 0,
      setAppliedCoupon: (c) => set({ appliedCoupon: c }),
      setTip: (t) => set({ tip: t }),

      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set({ orders: [order, ...get().orders] }),
      updateOrderStatus: (orderId, status, rider) =>
        set({
          orders: get().orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  riderName: rider?.name ?? o.riderName,
                  riderPhone: rider?.phone ?? o.riderPhone,
                }
              : o
          ),
        }),

      lastOrder: null,
      setLastOrder: (o) => set({ lastOrder: o }),
    }),
    {
      name: 'swiggy-clone-storage',
      // only persist cart, address, orders
      partialize: (state) => ({
        cart: state.cart,
        cartRestaurantId: state.cartRestaurantId,
        cartRestaurantName: state.cartRestaurantName,
        address: state.address,
        orders: state.orders,
        tip: state.tip,
      }),
    }
  )
)

// Derived selectors
export function cartCount(state: FoodState): number {
  return state.cart.reduce((s, c) => s + c.quantity, 0)
}

export function cartItemsTotal(state: FoodState): number {
  return state.cart.reduce((s, c) => s + c.total, 0)
}
