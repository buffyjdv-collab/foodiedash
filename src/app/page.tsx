'use client'

import { useEffect } from 'react'
import { useFoodStore } from '@/lib/store'
import { Header } from '@/components/food/header'
import { Footer } from '@/components/food/footer'
import { CartDrawer } from '@/components/food/cart-drawer'
import { HomeView } from '@/components/food/home-view'
import { RestaurantDetail } from '@/components/food/restaurant-detail'
import { CheckoutView } from '@/components/food/checkout-view'
import { OrderTracking } from '@/components/food/order-tracking'
import { OrdersList } from '@/components/food/orders-list'
import { Profile } from '@/components/food/profile'
import { AIAssistant } from '@/components/food/ai-assistant'

export default function Home() {
  const view = useFoodStore((s) => s.view)
  const selectedRestaurantSlug = useFoodStore((s) => s.selectedRestaurantSlug)
  const activeOrderId = useFoodStore((s) => s.activeOrderId)

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view, selectedRestaurantSlug, activeOrderId])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {view === 'home' && <HomeView />}
        {view === 'restaurant' && selectedRestaurantSlug && (
          <RestaurantDetail slug={selectedRestaurantSlug} />
        )}
        {view === 'checkout' && <CheckoutView />}
        {view === 'tracking' && activeOrderId && (
          <OrderTracking orderId={activeOrderId} />
        )}
        {view === 'orders' && <OrdersList />}
        {view === 'profile' && <Profile />}
      </main>

      <Footer />

      {/* Global overlays */}
      <CartDrawer />
      <AIAssistant />
    </div>
  )
}
