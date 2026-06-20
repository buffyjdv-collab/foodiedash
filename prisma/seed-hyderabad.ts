// Additive seed: adds Hyderabad city + restaurants with real HY coordinates.
// Does NOT touch existing Bangalore data, users, orders, or RBAC tables.
import { db } from '../src/lib/db'

const IMG = {
  r_biryani: 'https://images.unsplash.com/photo-1631292784640-2b24be784d5d?w=800&q=80',
  r_pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  r_burger: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
  r_curry: 'https://images.unsplash.com/photo-1606755962743-d37afd4a3a84?w=800&q=80',
  r_south: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=80',
  r_healthy: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  r_chinese: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80',
  biryani: 'https://images.unsplash.com/photo-1631452180519-c014fe9461c6?w=600&q=80',
  biryani2: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
  kebab: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
  curry: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  naan: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe9461c6?w=600&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  pizza2: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  burger2: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
  fries: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&q=80',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
  idli: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80',
  salad: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  noodles: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80',
  manchurian: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=600&q=80',
  friedrice: 'https://images.unsplash.com/photo-1603133882878-684f208fb84b?w=600&q=80',
  thali: 'https://images.unsplash.com/photo-1585937421612-70a008cd921d?w=600&q=80',
  icecream: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600&q=80',
}

const variantsBiryani = JSON.stringify([
  { name: 'Portion', options: [
    { name: 'Single', price: 0 },
    { name: 'Full', price: 180 },
    { name: 'Family Pack', price: 380 },
  ]},
])
const addonsCheese = JSON.stringify([
  { name: 'Extra Cheese', price: 40 },
  { name: 'Jalapeños', price: 25 },
])

// Real Hyderabad neighbourhood coordinates
const HY = {
  banjaraHills: { lat: 17.4126, lng: 78.4396 },
  jubileeHills: { lat: 17.4239, lng: 78.4083 },
  gachibowli: { lat: 17.4401, lng: 78.3489 },
  hitechCity: { lat: 17.4435, lng: 78.3772 },
  madhapur: { lat: 17.4483, lng: 78.3915 },
  kondapur: { lat: 17.4615, lng: 78.3661 },
  begumpet: { lat: 17.4434, lng: 78.4602 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
  abids: { lat: 17.3888, lng: 78.4812 },
  charminar: { lat: 17.3616, lng: 78.4747 },
}

interface HydRestaurant {
  name: string; slug: string; description: string; cuisine: string
  cover: string; rating: number; ratingCount: number; costForTwo: number
  deliveryTime: number; deliveryFee: number; priceLevel: number; isPureVeg: boolean
  isPromoted: boolean; offer: string; address: string; lat: number; lng: number
  categories: { name: string; items: any[] }[]
}

const restaurants: HydRestaurant[] = [
  {
    name: 'Paradise Food Court', slug: 'paradise-hyderabad',
    description: 'The iconic Hyderabad biryani institution since 1953. Legendary dum biryani cooked in sealed handis.',
    cuisine: 'Biryani,Mughlai,Hyderabadi', cover: IMG.r_biryani,
    rating: 4.6, ratingCount: 24500, costForTwo: 600, deliveryTime: 35, deliveryFee: 25,
    priceLevel: 2, isPureVeg: false, isPromoted: true, offer: '50% OFF up to ₹120',
    address: 'Paradise Circle, Secunderabad', lat: HY.secunderabad.lat, lng: HY.secunderabad.lng,
    categories: [
      { name: 'Signature Biryani', items: [
        { name: 'Hyderabadi Chicken Dum Biryani', desc: 'Aromatic basmati, marinated chicken, saffron, mint — sealed & dum-cooked', price: 299, img: IMG.biryani, bestSeller: true, spice: 2, variants: variantsBiryani },
        { name: 'Mutton Biryani', desc: 'Tender mutton, fragrant rice, traditional Hyderabadi spices', price: 379, img: IMG.biryani2, bestSeller: true, spice: 2, variants: variantsBiryani },
        { name: 'Veg Dum Biryani', desc: 'Mixed veg & paneer layered with basmati rice', price: 219, img: IMG.biryani, veg: true, spice: 1 },
        { name: 'Chicken 65 Biryani', desc: 'Spicy chicken 65 tossed with biryani rice', price: 329, img: IMG.biryani2, spice: 3 },
      ]},
      { name: 'Kebabs', items: [
        { name: 'Chicken Tikka Kebab', desc: 'Char-grilled marinated chicken chunks', price: 269, img: IMG.kebab, bestSeller: true, spice: 2 },
        { name: 'Mutton Seekh Kebab', desc: 'Minced mutton skewers with herbs', price: 299, img: IMG.kebab, spice: 2 },
        { name: 'Paneer Tikka', desc: 'Grilled cottage cheese with spices', price: 239, img: IMG.paneer, veg: true, spice: 1 },
      ]},
      { name: 'Curries & Breads', items: [
        { name: 'Chicken Curry (Hyderabadi)', desc: 'Spicy home-style chicken curry', price: 279, img: IMG.curry, spice: 2 },
        { name: 'Paneer Butter Masala', desc: 'Cottage cheese in creamy tomato gravy', price: 249, img: IMG.paneer, veg: true, spice: 1 },
        { name: 'Butter Naan', desc: 'Tandoor-baked naan with butter', price: 49, img: IMG.naan, veg: true },
      ]},
    ],
  },
  {
    name: 'Ohri\'s Jiva', slug: 'ohris-jiva',
    description: 'Royal multi-cuisine dining from the Ohri\'s group. North Indian, Chinese & Continental feasts.',
    cuisine: 'North Indian,Chinese,Continental', cover: IMG.r_curry,
    rating: 4.4, ratingCount: 8900, costForTwo: 700, deliveryTime: 38, deliveryFee: 30,
    priceLevel: 2, isPureVeg: false, isPromoted: true, offer: 'Flat ₹150 OFF above ₹599',
    address: 'Banjara Hills Road No. 1', lat: HY.banjaraHills.lat, lng: HY.banjaraHills.lng,
    categories: [
      { name: 'Mughlai Specials', items: [
        { name: 'Butter Chicken', desc: 'Tandoori chicken in rich tomato-butter makhani gravy', price: 329, img: IMG.curry, bestSeller: true, spice: 1 },
        { name: 'Mutton Rogan Josh', desc: 'Slow-cooked mutton in Kashmiri spices', price: 389, img: IMG.curry, spice: 2 },
        { name: 'Dal Makhani', desc: 'Black lentils slow-cooked overnight with cream', price: 199, img: IMG.curry, veg: true },
      ]},
      { name: 'Tandoor', items: [
        { name: 'Tandoori Chicken (Half)', desc: 'Whole leg marinated & roasted', price: 279, img: IMG.kebab, bestSeller: true, spice: 2 },
        { name: 'Malai Tikka', desc: 'Creamy chicken tikka with cardamom', price: 289, img: IMG.kebab, spice: 1 },
        { name: 'Tandoori Roti', desc: 'Whole wheat tandoor bread', price: 29, img: IMG.naan, veg: true },
      ]},
      { name: 'Biryani', items: [
        { name: 'Chicken Dum Biryani', desc: 'Hyderabadi-style dum biryani', price: 289, img: IMG.biryani, spice: 2 },
        { name: 'Veg Biryani', desc: 'Mixed vegetable biryani', price: 219, img: IMG.biryani, veg: true, spice: 1 },
      ]},
    ],
  },
  {
    name: 'Pizza Den Hitech City', slug: 'pizza-den-hitech',
    description: 'Wood-fired pizzas & pasta in the heart of Hitech City. Fresh mozzarella, San Marzano tomatoes.',
    cuisine: 'Italian,Pizza,Continental', cover: IMG.r_pizza,
    rating: 4.3, ratingCount: 6200, costForTwo: 550, deliveryTime: 30, deliveryFee: 20,
    priceLevel: 2, isPureVeg: false, isPromoted: false, offer: 'Buy 1 Get 1 Free',
    address: 'Hitech City Main Road', lat: HY.hitechCity.lat, lng: HY.hitechCity.lng,
    categories: [
      { name: 'Pizzas', items: [
        { name: 'Margherita', desc: 'San Marzano tomato, mozzarella, basil', price: 249, img: IMG.pizza, bestSeller: true, veg: true },
        { name: 'Pepperoni', desc: 'Loaded with pepperoni & mozzarella', price: 349, img: IMG.pizza2, bestSeller: true },
        { name: 'Paneer Tikka Pizza', desc: 'Tandoori paneer, onion, mint mayo', price: 359, img: IMG.pizza, veg: true, spice: 1 },
        { name: 'Chicken Tikka Pizza', desc: 'Tandoori chicken, capsicum', price: 389, img: IMG.pizza2, spice: 1 },
      ]},
      { name: 'Pasta', items: [
        { name: 'Creamy Alfredo', desc: 'Penne in parmesan cream sauce', price: 219, img: IMG.r_curry, veg: true },
        { name: 'Arrabbiata', desc: 'Spicy tomato-garlic penne', price: 209, img: IMG.r_curry, veg: true, spice: 2 },
      ]},
      { name: 'Sides', items: [
        { name: 'Garlic Bread', desc: 'Toasted with garlic butter & herbs', price: 99, img: IMG.naan, veg: true },
        { name: 'Loaded Fries', desc: 'Cheese, jalapeños, herbs', price: 149, img: IMG.fries, veg: true },
      ]},
    ],
  },
  {
    name: 'Burger King Madhapur', slug: 'burger-king-madhapur',
    description: 'Flame-grilled burgers, crispy chicken & thick shakes. The king of fast food in Madhapur.',
    cuisine: 'American,Burgers,Fast Food', cover: IMG.r_burger,
    rating: 4.2, ratingCount: 11200, costForTwo: 450, deliveryTime: 25, deliveryFee: 20,
    priceLevel: 2, isPureVeg: false, isPromoted: true, offer: 'Flat ₹125 OFF above ₹499',
    address: 'Madhapur Main Road', lat: HY.madhapur.lat, lng: HY.madhapur.lng,
    categories: [
      { name: 'Whoppers', items: [
        { name: 'Classic Whopper', desc: 'Flame-grilled patty, cheese, lettuce, tomato', price: 219, img: IMG.burger, bestSeller: true },
        { name: 'Crispy Chicken Burger', desc: 'Buttermilk fried chicken, slaw, spicy mayo', price: 229, img: IMG.burger2, bestSeller: true, spice: 1 },
        { name: 'Veg Whopper', desc: 'Potato-corn patty, cheese, veggies', price: 169, img: IMG.burger, veg: true },
      ]},
      { name: 'Sides', items: [
        { name: 'Loaded Fries', desc: 'Cheese, jalapeños, herbs', price: 149, img: IMG.fries, bestSeller: true, veg: true },
        { name: 'Chicken Wings (6 pc)', desc: 'Smoky BBQ glazed wings', price: 229, img: IMG.kebab, spice: 2 },
      ]},
    ],
  },
  {
    name: 'Chutneys Gachibowli', slug: 'chutneys-gachibowli',
    description: 'Authentic South Indian thalis, dosas & filter coffee. A beloved Hyderabad breakfast institution.',
    cuisine: 'South Indian,Breakfast', cover: IMG.r_south,
    rating: 4.5, ratingCount: 13400, costForTwo: 350, deliveryTime: 24, deliveryFee: 15,
    priceLevel: 1, isPureVeg: true, isPromoted: true, offer: 'Free filter coffee above ₹199',
    address: 'Gachibowli DLF', lat: HY.gachibowli.lat, lng: HY.gachibowli.lng,
    categories: [
      { name: 'Dosas', items: [
        { name: 'Masala Dosa', desc: 'Crispy dosa with potato masala & chutneys', price: 99, img: IMG.dosa, bestSeller: true, recommended: true },
        { name: 'Mysore Masala Dosa', desc: 'Spicy red chutney filled dosa', price: 109, img: IMG.dosa, spice: 2 },
        { name: 'Paneer Dosa', desc: 'Dosa stuffed with spicy paneer', price: 139, img: IMG.dosa },
        { name: 'Idli Sambar (3 pc)', desc: 'Steamed rice cakes with sambar', price: 69, img: IMG.idli, bestSeller: true },
      ]},
      { name: 'Meals & Thalis', items: [
        { name: 'Mini Meals', desc: 'Rice, sambar, rasam, 2 curries, curd, papad', price: 149, img: IMG.thali, veg: true, bestSeller: true },
        { name: 'Special Thali', desc: 'Complete South Indian feast on a banana leaf', price: 199, img: IMG.thali, veg: true },
      ]},
      { name: 'Beverages', items: [
        { name: 'Filter Coffee', desc: 'Authentic South Indian decoction', price: 35, img: IMG.icecream, bestSeller: true },
        { name: 'Masala Buttermilk', desc: 'Spiced churned yogurt', price: 45, img: IMG.icecream },
      ]},
    ],
  },
  {
    name: 'Mainland China Jubilee Hills', slug: 'mainland-china-jubilee',
    description: 'Fine-dining Oriental cuisine. Wok-tossed noodles, dim sum & bold Indo-Chinese flavors.',
    cuisine: 'Chinese,Asian,Indo-Chinese', cover: IMG.r_chinese,
    rating: 4.4, ratingCount: 7800, costForTwo: 800, deliveryTime: 35, deliveryFee: 30,
    priceLevel: 3, isPureVeg: false, isPromoted: false, offer: '20% OFF on first order',
    address: 'Jubilee Hills Road No. 36', lat: HY.jubileeHills.lat, lng: HY.jubileeHills.lng,
    categories: [
      { name: 'Wok-Tossed', items: [
        { name: 'Chicken Hakka Noodles', desc: 'Wok-tossed noodles with shredded chicken', price: 229, img: IMG.noodles, bestSeller: true, spice: 1 },
        { name: 'Veg Hakka Noodles', desc: 'Stir-fried noodles with crunchy veggies', price: 189, img: IMG.noodles, veg: true, spice: 1 },
        { name: 'Schezwan Fried Rice', desc: 'Spicy schezwan rice', price: 199, img: IMG.friedrice, veg: true, spice: 3 },
        { name: 'Chicken Chilli', desc: 'Crispy chicken in spicy schezwan sauce', price: 259, img: IMG.manchurian, spice: 3 },
      ]},
      { name: 'Dim Sum & Starters', items: [
        { name: 'Chicken Dim Sum (6 pc)', desc: 'Steamed chicken dumplings', price: 199, img: IMG.manchurian, bestSeller: true },
        { name: 'Veg Manchurian', desc: 'Veg balls in tangy soy-garlic sauce', price: 189, img: IMG.manchurian, veg: true, spice: 2 },
        { name: 'Spring Rolls (4 pc)', desc: 'Crispy rolls stuffed with veggies', price: 149, img: IMG.friedrice, veg: true },
      ]},
    ],
  },
  {
    name: 'Healthy Bites Kondapur', slug: 'healthy-bites-kondapur',
    description: 'Calorie-conscious bowls, salads & smoothies. Clean eating for the IT crowd in Kondapur.',
    cuisine: 'Healthy,Salads,Continental', cover: IMG.r_healthy,
    rating: 4.3, ratingCount: 4200, costForTwo: 400, deliveryTime: 28, deliveryFee: 20,
    priceLevel: 2, isPureVeg: true, isPromoted: false, offer: '10% OFF on all bowls',
    address: 'Kondapur Botanical Garden Road', lat: HY.kondapur.lat, lng: HY.kondapur.lng,
    categories: [
      { name: 'Power Bowls', items: [
        { name: 'Mediterranean Bowl', desc: 'Quinoa, hummus, falafel, olives, tzatziki', price: 269, img: IMG.salad, bestSeller: true, veg: true, recommended: true },
        { name: 'Buddha Bowl', desc: 'Brown rice, roasted veg, tofu, peanut sauce', price: 249, img: IMG.salad, veg: true },
        { name: 'Protein Chicken Bowl', desc: 'Grilled chicken, greens, avocado, quinoa', price: 299, img: IMG.salad },
      ]},
      { name: 'Smoothies', items: [
        { name: 'Berry Blast Smoothie', desc: 'Mixed berries, banana, yogurt', price: 159, img: IMG.icecream, veg: true, bestSeller: true },
        { name: 'Green Detox Smoothie', desc: 'Spinach, apple, kiwi, mint', price: 169, img: IMG.icecream, veg: true },
      ]},
    ],
  },
  {
    name: 'Shah Ghouse Cafe', slug: 'shah-ghouse-charminar',
    description: 'Historic Irani cafe near Charminar. Famous for mutton biryani, haleem & Irani chai since 1952.',
    cuisine: 'Biryani,Mughlai,Hyderabadi', cover: IMG.r_biryani,
    rating: 4.5, ratingCount: 16700, costForTwo: 500, deliveryTime: 40, deliveryFee: 30,
    priceLevel: 1, isPureVeg: false, isPromoted: true, offer: '30% OFF up to ₹150',
    address: 'Shah Ali Banda, Near Charminar', lat: HY.charminar.lat, lng: HY.charminar.lng,
    categories: [
      { name: 'Biryani & Haleem', items: [
        { name: 'Mutton Dum Biryani', desc: 'The legendary Shah Ghouse mutton biryani', price: 329, img: IMG.biryani, bestSeller: true, spice: 2, variants: variantsBiryani },
        { name: 'Chicken Dum Biryani', desc: 'Aromatic chicken biryani, Hyderabadi style', price: 249, img: IMG.biryani2, bestSeller: true, spice: 2 },
        { name: 'Haleem (Seasonal)', desc: 'Slow-cooked wheat & mutton porridge', price: 179, img: IMG.curry, spice: 1 },
      ]},
      { name: 'Kebabs', items: [
        { name: 'Shami Kebab', desc: 'Minced mutton patties with lentils', price: 189, img: IMG.kebab, bestSeller: true, spice: 1 },
        { name: 'Chicken 65', desc: 'Spicy deep-fried chicken bites', price: 219, img: IMG.kebab, spice: 3 },
        { name: 'Pathar Ka Gosht', desc: 'Stone-grilled mutton, Hyderabadi specialty', price: 299, img: IMG.kebab, spice: 2 },
      ]},
      { name: 'Beverages', items: [
        { name: 'Irani Chai', desc: 'Authentic Hyderabadi Irani tea', price: 25, img: IMG.icecream, bestSeller: true },
        { name: 'Osmania Biscuit (4 pc)', desc: 'Buttery cookies paired with chai', price: 40, img: IMG.icecream, veg: true },
      ]},
    ],
  },
]

async function main() {
  console.log('🌱 Seeding Hyderabad (additive)...')

  // Find or create Hyderabad city
  let hyderabad = await db.city.findFirst({ where: { name: 'Hyderabad' } })
  if (!hyderabad) {
    hyderabad = await db.city.create({ data: { name: 'Hyderabad', state: 'Telangana', isActive: true } })
    console.log('  ✓ Created Hyderabad city')
  }

  // Add Hyderabad zones
  const zones = ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Hitech City', 'Madhapur', 'Kondapur', 'Secunderabad', 'Charminar']
  for (const z of zones) {
    const exists = await db.zone.findFirst({ where: { name: z, cityId: hyderabad.id } })
    if (!exists) await db.zone.create({ data: { name: z, cityId: hyderabad.id } })
  }
  console.log(`  ✓ ${zones.length} Hyderabad zones`)

  // Add restaurants (skip if slug already exists)
  let added = 0
  let skipped = 0
  for (const r of restaurants) {
    const exists = await db.restaurant.findUnique({ where: { slug: r.slug } })
    if (exists) { skipped++; continue }
    const restaurant = await db.restaurant.create({ data: {
      name: r.name, slug: r.slug, description: r.description, cuisine: r.cuisine,
      imageUrl: r.cover, coverUrl: r.cover, rating: r.rating, ratingCount: r.ratingCount,
      costForTwo: r.costForTwo, deliveryTime: r.deliveryTime, deliveryFee: r.deliveryFee,
      priceLevel: r.priceLevel, isPureVeg: r.isPureVeg, isPromoted: r.isPromoted,
      offer: r.offer, cityId: hyderabad.id, address: r.address,
      latitude: r.lat, longitude: r.lng,
    }})

    for (let ci = 0; ci < r.categories.length; ci++) {
      const cat = r.categories[ci]
      const mc = await db.menuCategory.create({ data: { name: cat.name, restaurantId: restaurant.id, displayOrder: ci }})
      for (const it of cat.items) {
        await db.menuItem.create({ data: {
          name: it.name, description: it.desc, price: it.price, imageUrl: it.img,
          isVeg: it.veg ?? r.isPureVeg, isBestSeller: it.bestSeller ?? false,
          isRecommended: it.recommended ?? false, spiceLevel: it.spice ?? 0,
          rating: 4.0 + Math.random() * 0.9, ratingCount: Math.floor(Math.random() * 800) + 50,
          variants: it.variants ?? null, addons: it.addons ?? null,
          menuCategoryId: mc.id, restaurantId: restaurant.id,
        }})
      }
    }
    added++
  }
  console.log(`  ✓ ${added} Hyderabad restaurants added (${skipped} already existed)`)

  // Also backfill lat/lng for any existing Bangalore restaurants that have null coords
  const blrRestaurants = await db.restaurant.findMany({ where: { city: { name: 'Bangalore' } } })
  for (const r of blrRestaurants) {
    if (r.latitude === null || r.longitude === null) {
      await db.restaurant.update({
        where: { id: r.id },
        data: {
          latitude: 12.9716 + (Math.random() - 0.5) * 0.08,
          longitude: 77.5946 + (Math.random() - 0.5) * 0.08,
        },
      })
    }
  }

  const total = await db.restaurant.count()
  const hydTotal = await db.restaurant.count({ where: { city: { name: 'Hyderabad' } } })
  const blrTotal = await db.restaurant.count({ where: { city: { name: 'Bangalore' } } })
  console.log(`✅ Done. Total restaurants: ${total} (Bangalore: ${blrTotal}, Hyderabad: ${hydTotal})`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
