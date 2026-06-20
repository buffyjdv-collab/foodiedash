'use client'

import { UtensilsCrossed, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react'
import { useFoodStore } from '@/lib/store'

export function Footer() {
  const setView = useFoodStore((s) => s.setView)

  return (
    <footer className="mt-auto border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold">
                Foodie<span className="text-primary">Dash</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-background/70">
              Food delivery, reimagined. Order from your favourite restaurants with AI-powered discovery and live tracking.
            </p>
            <div className="mt-4 flex gap-3">
              {[Instagram, Twitter, Facebook, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background/80 transition hover:bg-primary hover:text-primary-foreground"
                  aria-label="social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-background/60">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" onClick={(e) => e.preventDefault()} className="text-background/80 hover:text-primary">About Us</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="text-background/80 hover:text-primary">Careers</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="text-background/80 hover:text-primary">Blog</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="text-background/80 hover:text-primary">Press</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-background/60">For Partners</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" onClick={(e) => e.preventDefault()} className="text-background/80 hover:text-primary">Restaurant Partner</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="text-background/80 hover:text-primary">Delivery Partner</a></li>
              <li><button onClick={() => setView('orders')} className="text-background/80 hover:text-primary">Track Order</button></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="text-background/80 hover:text-primary">Help & Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-background/60">Available in</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-background/80">Bangalore</li>
              <li className="text-background/80">Mumbai <span className="text-background/40">(soon)</span></li>
              <li className="text-background/80">Delhi <span className="text-background/40">(soon)</span></li>
              <li className="text-background/80">Hyderabad <span className="text-background/40">(soon)</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-background/10 pt-6 text-xs text-background/60 sm:flex-row">
          <p>© {new Date().getFullYear()} FoodieDash. All rights reserved. Built for demo purposes.</p>
          <div className="flex gap-4">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary">Privacy</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary">Terms</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
