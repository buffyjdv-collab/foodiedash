// Shared types for the food delivery app

export interface Restaurant {
  id: string
  name: string
  slug: string
  description: string
  cuisine: string
  imageUrl: string
  coverUrl: string | null
  rating: number
  ratingCount: number
  costForTwo: number
  deliveryTime: number
  deliveryFee: number
  priceLevel: number
  isPureVeg: boolean
  isActive: boolean
  isPromoted: boolean
  offer: string | null
  cityId: string
  address: string
  latitude: number | null
  longitude: number | null
  distance?: number | null // km from user location (computed by /api/restaurants when lat/lng provided)
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  isVeg: boolean
  isBestSeller: boolean
  isRecommended: boolean
  spiceLevel: number
  rating: number
  ratingCount: number
  variants: string | null
  addons: string | null
  isAvailable: boolean
  menuCategoryId: string
  restaurantId: string
}

export interface MenuCategory {
  id: string
  name: string
  restaurantId: string
  displayOrder: number
  items: MenuItem[]
}

export interface Review {
  id: string
  rating: number
  comment: string
  dish: string | null
  customer?: { name: string }
  createdAt: string
}

export interface RestaurantDetail extends Restaurant {
  menuCategories: MenuCategory[]
  reviews: Review[]
}

export interface Variant {
  name: string
  options: { name: string; price: number }[]
}

export interface Addon {
  name: string
  price: number
}

export interface CartItem {
  uid: string // unique key per customization combo
  menuItemId: string
  name: string
  description: string
  imageUrl: string | null
  price: number // base price
  quantity: number
  isVeg: boolean
  spiceLevel: number
  selectedVariants: { groupName: string; optionName: string; price: number }[]
  selectedAddons: { name: string; price: number }[]
  unitPrice: number // computed price per unit including variants+addons
  total: number // unitPrice * quantity
  restaurantId: string
  restaurantName: string
}

export interface Coupon {
  id: string
  code: string
  description: string
  type: string
  value: number
  maxDiscount: number | null
  minOrder: number
}

export interface OrderItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  variants: string | null
  addons: string | null
  total: number
}

export interface Order {
  id: string
  orderCode: string
  status: string
  itemsTotal: number
  deliveryFee: number
  taxes: number
  discount: number
  tip: number
  total: number
  paymentMethod: string
  paymentStatus: string
  addressLine: string
  couponCode: string | null
  deliveryTime: number
  riderName: string | null
  riderPhone: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  restaurant?: Restaurant
}

export type ViewName = 'home' | 'restaurant' | 'checkout' | 'tracking' | 'orders' | 'profile' | 'admin' | 'rider' | 'restaurant-portal'

export interface FoodCategory {
  id: string
  name: string
  emoji: string
  color: string
}
