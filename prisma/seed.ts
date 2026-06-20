import { db } from '../src/lib/db'

// Reliable curated Unsplash food image URLs
const IMG = {
  // restaurants covers
  r_biryani: 'https://images.unsplash.com/photo-1631292784640-2b24be784d5d?w=800&q=80',
  r_burger: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
  r_pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  r_chinese: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80',
  r_south: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=80',
  r_italian: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
  r_tandoor: 'https://images.unsplash.com/photo-1585937421612-70a008cd921d?w=800&q=80',
  r_sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
  r_healthy: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  r_bakery: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80',
  r_mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  r_rolls: 'https://images.unsplash.com/photo-1626777553635-3bd1b1f5f5fd?w=800&q=80',
  r_curry: 'https://images.unsplash.com/photo-1606755962743-d37afd4e3a84?w=800&q=80',
  r_cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9797?w=800&q=80',
  // menu items
  biryani: 'https://images.unsplash.com/photo-1631452180519-c014fe9461c6?w=600&q=80',
  biryani2: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
  kebab: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
  curry: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  naan: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe9461c6?w=600&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  burger2: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
  fries: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&q=80',
  hotdog: 'https://images.unsplash.com/photo-1612392987200-1ee1bb53a1a1?w=600&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  pizza2: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80',
  pasta2: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
  garlicbread: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600&q=80',
  noodles: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80',
  manchurian: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=600&q=80',
  friedrice: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
  springroll: 'https://images.unsplash.com/photo-1606471191009-63a9a5106530?w=600&q=80',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
  idli: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80',
  vada: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&q=80',
  sambar: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=80',
  uttapam: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
  sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80',
  ramen: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
  salad: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  salad2: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&q=80',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9797?w=600&q=80',
  cake2: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  pastry: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80',
  donut: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
  taco: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  nachos: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=600&q=80',
  quesadilla: 'https://images.unsplash.com/photo-1618040996337-11a35e36c1f0?w=600&q=80',
  roll: 'https://images.unsplash.com/photo-1626777553635-3bd1b1f5f5fd?w=600&q=80',
  wrap: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
  thali: 'https://images.unsplash.com/photo-1585937421612-70a008cd921d?w=600&q=80',
  icecream: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600&q=80',
}

const variantsPizza = JSON.stringify([
  { name: 'Size', options: [
    { name: 'Regular', price: 0 },
    { name: 'Medium', price: 120 },
    { name: 'Large', price: 220 },
  ]},
  { name: 'Crust', options: [
    { name: 'Hand Tossed', price: 0 },
    { name: 'Cheese Burst', price: 80 },
    { name: 'Thin Crust', price: 40 },
  ]},
])

const addonsCheese = JSON.stringify([
  { name: 'Extra Cheese', price: 40 },
  { name: 'Jalapeños', price: 25 },
  { name: 'Olives', price: 30 },
  { name: 'Mushrooms', price: 35 },
])

const addonsBurger = JSON.stringify([
  { name: 'Extra Patty', price: 60 },
  { name: 'Cheese Slice', price: 20 },
  { name: 'Bacon', price: 50 },
])

const variantsBiryani = JSON.stringify([
  { name: 'Portion', options: [
    { name: 'Single', price: 0 },
    { name: 'Full', price: 180 },
    { name: 'Family Pack', price: 380 },
  ]},
])

interface SeedRestaurant {
  name: string; slug: string; description: string; cuisine: string;
  cover: string; rating: number; ratingCount: number; costForTwo: number;
  deliveryTime: number; deliveryFee: number; priceLevel: number; isPureVeg: boolean;
  isPromoted: boolean; offer: string; address: string;
  categories: { name: string; items: any[] }[]
}

const restaurants: SeedRestaurant[] = [
  {
    name: 'Paradise Biryani House', slug: 'paradise-biryani',
    description: 'Legendary Hyderabadi biryani cooked dum-style with aromatic basmati rice and tender meat. A household name since 1953.',
    cuisine: 'Biryani,Mughlai,North Indian', cover: IMG.r_biryani,
    rating: 4.5, ratingCount: 12480, costForTwo: 500, deliveryTime: 32, deliveryFee: 25,
    priceLevel: 2, isPureVeg: false, isPromoted: true, offer: '50% OFF up to ₹100',
    address: 'MG Road, Bangalore',
    categories: [
      { name: 'Signature Biryani', items: [
        { name: 'Hyderabadi Chicken Dum Biryani', desc: 'Aromatic basmati rice layered with marinated chicken, saffron & mint', price: 269, img: IMG.biryani, bestSeller: true, spice: 2, variants: variantsBiryani, addons: addonsCheese },
        { name: 'Mutton Biryani', desc: 'Slow-cooked tender mutton with fragrant rice and traditional spices', price: 349, img: IMG.biryani2, bestSeller: true, spice: 2, variants: variantsBiryani },
        { name: 'Veg Dum Biryani', desc: 'Mixed vegetables & paneer layered with basmati rice', price: 199, img: IMG.biryani, veg: true, spice: 1, variants: variantsBiryani },
        { name: 'Egg Biryani', desc: 'Basmati rice with boiled eggs & aromatic spices', price: 179, img: IMG.biryani2, spice: 2 },
      ]},
      { name: 'Kebabs & Starters', items: [
        { name: 'Chicken Tikka', desc: 'Char-grilled chicken marinated in yogurt & spices', price: 249, img: IMG.kebab, bestSeller: true, spice: 2, addons: addonsCheese },
        { name: 'Seekh Kebab', desc: 'Minced mutton skewers with herbs', price: 279, img: IMG.kebab, spice: 2 },
        { name: 'Paneer Tikka', desc: 'Cubes of cottage cheese marinated & grilled', price: 229, img: IMG.paneer, veg: true, spice: 1 },
      ]},
      { name: 'Curries', items: [
        { name: 'Butter Chicken', desc: 'Tandoori chicken in rich tomato-butter gravy', price: 299, img: IMG.curry, bestSeller: true, spice: 1 },
        { name: 'Chicken Curry', desc: 'Home-style chicken curry with onion-tomato masala', price: 259, img: IMG.curry, spice: 2 },
        { name: 'Paneer Butter Masala', desc: 'Cottage cheese in creamy tomato gravy', price: 239, img: IMG.paneer, veg: true, spice: 1 },
      ]},
      { name: 'Breads & Sides', items: [
        { name: 'Garlic Naan', desc: 'Tandoor-baked bread with garlic & butter', price: 59, img: IMG.naan, veg: true },
        { name: 'Butter Naan', desc: 'Soft tandoori naan brushed with butter', price: 49, img: IMG.naan, veg: true },
        { name: 'Tandoori Roti', desc: 'Whole wheat bread from the tandoor', price: 29, img: IMG.naan, veg: true },
      ]},
    ],
  },
  {
    name: 'The Burger Barn', slug: 'the-burger-barn',
    description: 'Juicy hand-pressed patties, melted cheese, and brioche buns. The burger joint the city swears by.',
    cuisine: 'American,Burgers,Fast Food', cover: IMG.r_burger,
    rating: 4.3, ratingCount: 8730, costForTwo: 450, deliveryTime: 25, deliveryFee: 20,
    priceLevel: 2, isPureVeg: false, isPromoted: true, offer: 'Flat ₹125 OFF above ₹499',
    address: 'Indiranagar, Bangalore',
    categories: [
      { name: 'Signature Burgers', items: [
        { name: 'Classic Cheeseburger', desc: 'Beef-style patty, cheddar, lettuce, pickles, house sauce', price: 199, img: IMG.burger, bestSeller: true, addons: addonsBurger },
        { name: 'Crispy Chicken Burger', desc: 'Buttermilk fried chicken, slaw, spicy mayo', price: 219, img: IMG.burger2, bestSeller: true, spice: 1, addons: addonsBurger },
        { name: 'Veg Supreme Burger', desc: 'Potato-corn patty, cheese, veggies', price: 159, img: IMG.burger, veg: true, addons: addonsBurger },
        { name: 'Double Decker', desc: 'Two patties, double cheese, bacon jam', price: 299, img: IMG.burger2, addons: addonsBurger },
      ]},
      { name: 'Sides', items: [
        { name: 'Loaded Fries', desc: 'Crispy fries with cheese, jalapeños & herbs', price: 149, img: IMG.fries, bestSeller: true, veg: true },
        { name: 'Classic Salted Fries', desc: 'Golden fried potato sticks', price: 99, img: IMG.fries, veg: true },
        { name: 'Chicken Wings (6 pc)', desc: 'Smoky BBQ glazed wings', price: 229, img: IMG.kebab, spice: 2 },
      ]},
      { name: 'Hot Dogs & Wraps', items: [
        { name: 'Classic Hot Dog', desc: 'Grilled sausage, onions, mustard', price: 149, img: IMG.hotdog },
        { name: 'Chicken Wrap', desc: 'Grilled chicken, veggies, creamy dressing', price: 169, img: IMG.wrap, spice: 1 },
      ]},
    ],
  },
  {
    name: 'Pizza Paradiso', slug: 'pizza-paradiso',
    description: 'Wood-fired Italian pizzas with San Marzano tomatoes, fresh mozzarella & hand-stretched dough.',
    cuisine: 'Italian,Pizza,Continental', cover: IMG.r_pizza,
    rating: 4.4, ratingCount: 15200, costForTwo: 600, deliveryTime: 30, deliveryFee: 0,
    priceLevel: 2, isPureVeg: false, isPromoted: true, offer: 'Buy 1 Get 1 Free',
    address: 'Koramangala, Bangalore',
    categories: [
      { name: 'Classic Pizzas', items: [
        { name: 'Margherita', desc: 'San Marzano tomato, fresh mozzarella, basil', price: 249, img: IMG.pizza, bestSeller: true, veg: true, variants: variantsPizza, addons: addonsCheese },
        { name: 'Pepperoni', desc: 'Loaded with pepperoni & mozzarella', price: 349, img: IMG.pizza2, bestSeller: true, variants: variantsPizza, addons: addonsCheese },
        { name: 'Farmhouse', desc: 'Onion, capsicum, tomato, mushroom', price: 329, img: IMG.pizza, veg: true, variants: variantsPizza, addons: addonsCheese },
        { name: 'Paneer Tikka Pizza', desc: 'Tandoori paneer, onion, mint mayo', price: 359, img: IMG.pizza2, veg: true, spice: 1, variants: variantsPizza, addons: addonsCheese },
        { name: 'Chicken Tikka Pizza', desc: 'Tandoori chicken, onion, capsicum', price: 389, img: IMG.pizza, spice: 1, variants: variantsPizza, addons: addonsCheese },
      ]},
      { name: 'Pasta', items: [
        { name: 'Creamy Alfredo Pasta', desc: 'Penne in rich parmesan cream sauce', price: 219, img: IMG.pasta, veg: true },
        { name: 'Arrabbiata Pasta', desc: 'Penne in spicy tomato-garlic sauce', price: 209, img: IMG.pasta2, veg: true, spice: 2 },
        { name: 'Chicken Pesto Pasta', desc: 'Fusilli with chicken & basil pesto', price: 259, img: IMG.pasta },
      ]},
      { name: 'Sides', items: [
        { name: 'Garlic Bread', desc: 'Toasted bread with garlic butter & herbs', price: 99, img: IMG.garlicbread, veg: true, bestSeller: true },
        { name: 'Garlic Bread with Cheese', desc: 'Loaded with molten cheese', price: 149, img: IMG.garlicbread, veg: true },
      ]},
    ],
  },
  {
    name: 'Dragon Wok', slug: 'dragon-wok',
    description: 'Authentic Indo-Chinese wok-tossed delicacies. Bold flavors, smoky aromas, street-style favorites.',
    cuisine: 'Chinese,Asian,Indo-Chinese', cover: IMG.r_chinese,
    rating: 4.2, ratingCount: 9650, costForTwo: 400, deliveryTime: 28, deliveryFee: 20,
    priceLevel: 1, isPureVeg: false, isPromoted: false, offer: '20% OFF on first order',
    address: 'HSR Layout, Bangalore',
    categories: [
      { name: 'Wok-Tossed', items: [
        { name: ' Veg Hakka Noodles', desc: 'Stir-fried noodles with crunchy veggies', price: 159, img: IMG.noodles, bestSeller: true, veg: true, spice: 1 },
        { name: 'Chicken Hakka Noodles', desc: 'Wok-tossed noodles with shredded chicken', price: 199, img: IMG.noodles, bestSeller: true, spice: 1 },
        { name: 'Schezwan Fried Rice', desc: 'Spicy schezwan rice with veggies', price: 169, img: IMG.friedrice, veg: true, spice: 3 },
        { name: 'Chicken Chilli', desc: 'Crispy chicken in spicy schezwan sauce', price: 229, img: IMG.manchurian, spice: 3 },
      ]},
      { name: 'Manchurian', items: [
        { name: 'Veg Manchurian', desc: 'Veg balls in tangy soy-garlic sauce', price: 169, img: IMG.manchurian, veg: true, spice: 2, bestSeller: true },
        { name: 'Gobi Manchurian', desc: 'Crispy cauliflower in spicy sauce', price: 159, img: IMG.manchurian, veg: true, spice: 2 },
        { name: 'Chicken Manchurian', desc: 'Chicken balls in tangy sauce', price: 219, img: IMG.manchurian, spice: 2 },
      ]},
      { name: 'Starters', items: [
        { name: 'Spring Rolls (4 pc)', desc: 'Crispy rolls stuffed with veggies', price: 129, img: IMG.springroll, veg: true },
        { name: 'Crispy Corn', desc: 'Fried corn tossed with spices', price: 149, img: IMG.springroll, veg: true, spice: 2 },
      ]},
    ],
  },
  {
    name: 'Dosa Plaza', slug: 'dosa-plaza',
    description: 'Crispy golden dosas, fluffy idlis & filter coffee. South Indian comfort food done right.',
    cuisine: 'South Indian,Breakfast', cover: IMG.r_south,
    rating: 4.6, ratingCount: 18900, costForTwo: 300, deliveryTime: 22, deliveryFee: 15,
    priceLevel: 1, isPureVeg: true, isPromoted: true, offer: 'Free filter coffee above ₹199',
    address: 'Jayanagar, Bangalore',
    categories: [
      { name: 'Dosas', items: [
        { name: 'Masala Dosa', desc: 'Crispy dosa with potato masala & chutneys', price: 89, img: IMG.dosa, bestSeller: true, recommended: true },
        { name: 'Mysore Masala Dosa', desc: 'Spicy red chutney filled dosa', price: 99, img: IMG.dosa, bestSeller: true, spice: 2 },
        { name: 'Paneer Dosa', desc: 'Dosa stuffed with spicy paneer filling', price: 129, img: IMG.dosa },
        { name: 'Schezwan Dosa', desc: 'Fusion dosa with schezwan filling', price: 119, img: IMG.dosa, spice: 2 },
        { name: 'Plain Dosa', desc: 'Classic crispy dosa', price: 69, img: IMG.dosa },
      ]},
      { name: 'Idli & Vada', items: [
        { name: 'Idli Sambar (3 pc)', desc: 'Steamed rice cakes with sambar', price: 59, img: IMG.idli, bestSeller: true },
        { name: 'Medu Vada (2 pc)', desc: 'Crispy lentil donuts with chutney', price: 49, img: IMG.vada },
        { name: 'Sambar Vada', desc: 'Vada soaked in hot sambar', price: 59, img: IMG.vada },
      ]},
      { name: 'Uttapam', items: [
        { name: 'Tomato Onion Uttapam', desc: 'Thick pancake with toppings', price: 89, img: IMG.uttapam },
        { name: 'Mix Veg Uttapam', desc: 'Loaded with mixed vegetables', price: 99, img: IMG.uttapam },
      ]},
      { name: 'Beverages', items: [
        { name: 'Filter Coffee', desc: 'Authentic South Indian decoction coffee', price: 29, img: IMG.smoothie, bestSeller: true },
        { name: 'Masala Buttermilk', desc: 'Spiced churned yogurt drink', price: 39, img: IMG.smoothie },
      ]},
    ],
  },
  {
    name: 'Tandoori Nights', slug: 'tandoori-nights',
    description: 'Royal Mughlai feast from the tandoor. Smoky, rich, and unforgettable North Indian flavors.',
    cuisine: 'North Indian,Mughlai,Tandoor', cover: IMG.r_tandoor,
    rating: 4.5, ratingCount: 11200, costForTwo: 550, deliveryTime: 35, deliveryFee: 25,
    priceLevel: 2, isPureVeg: false, isPromoted: false, offer: '30% OFF up to ₹150',
    address: 'Whitefield, Bangalore',
    categories: [
      { name: 'Tandoori Specials', items: [
        { name: 'Tandoori Chicken (Half)', desc: 'Whole leg marinated & roasted in tandoor', price: 249, img: IMG.kebab, bestSeller: true, spice: 2 },
        { name: 'Afghani Chicken', desc: 'Creamy white marinated grilled chicken', price: 279, img: IMG.kebab, spice: 1 },
        { name: 'Tandoori Mushroom', desc: 'Mushrooms in spicy tandoori marinade', price: 199, img: IMG.paneer, veg: true, spice: 2 },
      ]},
      { name: 'Mughlai Curries', items: [
        { name: 'Chicken Tikka Masala', desc: 'Tandoori chicken in rich makhani gravy', price: 289, img: IMG.curry, bestSeller: true, spice: 1 },
        { name: 'Kadai Paneer', desc: 'Paneer in spicy kadai masala', price: 249, img: IMG.paneer, veg: true, spice: 2 },
        { name: 'Mutton Rogan Josh', desc: 'Tender mutton in Kashmiri spices', price: 329, img: IMG.curry, spice: 2 },
      ]},
      { name: 'Breads', items: [
        { name: 'Tandoori Roti', desc: 'Whole wheat tandoor bread', price: 25, img: IMG.naan, veg: true },
        { name: 'Laccha Paratha', desc: 'Flaky multi-layered paratha', price: 45, img: IMG.naan, veg: true },
        { name: 'Cheese Naan', desc: 'Naan stuffed with cheese', price: 79, img: IMG.naan, veg: true },
      ]},
      { name: 'Rice', items: [
        { name: 'Jeera Rice', desc: 'Basmati rice tempered with cumin', price: 99, img: IMG.friedrice, veg: true },
        { name: 'Veg Pulao', desc: 'Fragrant rice with mixed vegetables', price: 149, img: IMG.friedrice, veg: true },
      ]},
    ],
  },
  {
    name: 'Sushi Sensei', slug: 'sushi-sensei',
    description: 'Edomae-style sushi crafted by master chefs. Fresh wasabi, nori, and premium rice.',
    cuisine: 'Japanese,Sushi,Asian', cover: IMG.r_sushi,
    rating: 4.7, ratingCount: 5400, costForTwo: 900, deliveryTime: 40, deliveryFee: 40,
    priceLevel: 3, isPureVeg: false, isPromoted: true, offer: '15% OFF on sushi platters',
    address: 'UB City, Bangalore',
    categories: [
      { name: 'Sushi Rolls', items: [
        { name: 'California Roll (8 pc)', desc: 'Crab, avocado, cucumber, sesame', price: 349, img: IMG.sushi, bestSeller: true },
        { name: 'Spicy Tuna Roll (8 pc)', desc: 'Fresh tuna with spicy mayo', price: 449, img: IMG.sushi, bestSeller: true, spice: 2 },
        { name: 'Salmon Nigiri (6 pc)', desc: 'Fresh salmon over seasoned rice', price: 499, img: IMG.sushi },
        { name: 'Vegetable Roll (8 pc)', desc: 'Cucumber, avocado, carrot', price: 249, img: IMG.sushi, veg: true },
      ]},
      { name: 'Ramen', items: [
        { name: 'Tonkotsu Ramen', desc: 'Pork bone broth, chashu, egg, noodles', price: 399, img: IMG.ramen, bestSeller: true },
        { name: 'Veg Miso Ramen', desc: 'Miso broth with tofu & vegetables', price: 329, img: IMG.ramen, veg: true },
        { name: 'Spicy Chicken Ramen', desc: 'Fiery broth with grilled chicken', price: 379, img: IMG.ramen, spice: 3 },
      ]},
      { name: 'Sides', items: [
        { name: 'Edamame', desc: 'Steamed soybeans with sea salt', price: 149, img: IMG.springroll, veg: true },
        { name: 'Gyoza (6 pc)', desc: 'Pan-fried dumplings with dipping sauce', price: 219, img: IMG.springroll },
      ]},
    ],
  },
  {
    name: 'Green Bowl', slug: 'green-bowl',
    description: 'Fresh, healthy & calorie-conscious bowls, salads and smoothies. Eat clean, feel great.',
    cuisine: 'Healthy,Salads,Continental', cover: IMG.r_healthy,
    rating: 4.4, ratingCount: 6800, costForTwo: 350, deliveryTime: 26, deliveryFee: 20,
    priceLevel: 2, isPureVeg: true, isPromoted: false, offer: '10% OFF on all bowls',
    address: 'Koramangala, Bangalore',
    categories: [
      { name: 'Power Bowls', items: [
        { name: 'Mediterranean Bowl', desc: 'Quinoa, hummus, falafel, olives, tzatziki', price: 249, img: IMG.salad, bestSeller: true, veg: true, recommended: true },
        { name: 'Buddha Bowl', desc: 'Brown rice, roasted veggies, tofu, peanut sauce', price: 229, img: IMG.salad2, veg: true },
        { name: 'Protein Chicken Bowl', desc: 'Grilled chicken, greens, avocado, quinoa', price: 289, img: IMG.salad },
      ]},
      { name: 'Salads', items: [
        { name: 'Caesar Salad', desc: 'Romaine, croutons, parmesan, caesar dressing', price: 179, img: IMG.salad, veg: true },
        { name: 'Greek Salad', desc: 'Cucumber, tomato, feta, olives', price: 199, img: IMG.salad2, veg: true },
      ]},
      { name: 'Smoothies', items: [
        { name: 'Berry Blast Smoothie', desc: 'Mixed berries, banana, yogurt', price: 149, img: IMG.smoothie, veg: true, bestSeller: true },
        { name: 'Green Detox Smoothie', desc: 'Spinach, apple, kiwi, mint', price: 159, img: IMG.smoothie, veg: true },
      ]},
    ],
  },
  {
    name: 'Sweet Tooth Bakery', slug: 'sweet-tooth-bakery',
    description: 'Artisanal cakes, pastries & desserts baked fresh every morning. Pure indulgence.',
    cuisine: 'Bakery,Desserts', cover: IMG.r_bakery,
    rating: 4.6, ratingCount: 7900, costForTwo: 400, deliveryTime: 30, deliveryFee: 25,
    priceLevel: 2, isPureVeg: true, isPromoted: true, offer: 'Free brownie above ₹299',
    address: 'Indiranagar, Bangalore',
    categories: [
      { name: 'Cakes', items: [
        { name: 'Belgian Chocolate Cake (Slice)', desc: 'Rich dark chocolate ganache cake', price: 149, img: IMG.cake, bestSeller: true, veg: true },
        { name: 'Red Velvet Cake (Slice)', desc: 'Moist red velvet with cream cheese frosting', price: 159, img: IMG.cake2, bestSeller: true, veg: true },
        { name: 'Cheesecake (Slice)', desc: 'New York style baked cheesecake', price: 179, img: IMG.cake, veg: true },
      ]},
      { name: 'Pastries', items: [
        { name: 'Chocolate Truffle Pastry', desc: 'Decadent chocolate pastry', price: 89, img: IMG.pastry, veg: true, bestSeller: true },
        { name: 'Black Forest Pastry', desc: 'Chocolate sponge with cherries & cream', price: 79, img: IMG.pastry, veg: true },
        { name: 'Pineapple Pastry', desc: 'Light sponge with pineapple cream', price: 79, img: IMG.pastry, veg: true },
      ]},
      { name: 'Donuts', items: [
        { name: 'Glazed Donut', desc: 'Classic sugar glazed donut', price: 69, img: IMG.donut, veg: true },
        { name: 'Choco Filled Donut', desc: 'Donut filled with chocolate cream', price: 89, img: IMG.donut, veg: true },
      ]},
      { name: 'Ice Creams', items: [
        { name: 'Vanilla Bean Ice Cream', desc: 'Madagascar vanilla ice cream', price: 99, img: IMG.icecream, veg: true },
        { name: 'Chocolate Fudge Ice Cream', desc: 'Rich chocolate with fudge swirls', price: 119, img: IMG.icecream, veg: true },
      ]},
    ],
  },
  {
    name: 'Taco Fiesta', slug: 'taco-fiesta',
    description: 'Vibrant Mexican street food. Soft tortillas, zesty salsas, and bold flavors.',
    cuisine: 'Mexican,Continental', cover: IMG.r_mexican,
    rating: 4.3, ratingCount: 5200, costForTwo: 500, deliveryTime: 28, deliveryFee: 20,
    priceLevel: 2, isPureVeg: false, isPromoted: false, offer: '25% OFF above ₹399',
    address: 'HSR Layout, Bangalore',
    categories: [
      { name: 'Tacos', items: [
        { name: 'Chicken Soft Tacos (3 pc)', desc: 'Grilled chicken, salsa, sour cream', price: 219, img: IMG.taco, bestSeller: true, spice: 1 },
        { name: 'Veg Tacos (3 pc)', desc: 'Beans, corn, salsa, cheese', price: 179, img: IMG.taco, veg: true },
        { name: 'Fish Tacos (3 pc)', desc: 'Crispy fish, cabbage slaw, chipotle', price: 249, img: IMG.taco, spice: 1 },
      ]},
      { name: 'Nachos', items: [
        { name: 'Loaded Nachos', desc: 'Cheese, beans, jalapeños, salsa, guacamole', price: 199, img: IMG.nachos, bestSeller: true, veg: true, spice: 1 },
        { name: 'Chicken Nachos', desc: 'Nachos topped with grilled chicken', price: 239, img: IMG.nachos, spice: 1 },
      ]},
      { name: 'Quesadillas', items: [
        { name: 'Cheese Quesadilla', desc: 'Molten cheese & veggies in tortilla', price: 169, img: IMG.quesadilla, veg: true },
        { name: 'Chicken Quesadilla', desc: 'Grilled chicken & cheese quesadilla', price: 219, img: IMG.quesadilla },
      ]},
    ],
  },
  {
    name: 'Roll Master', slug: 'roll-master',
    description: 'Kolkata-style kathi rolls packed with juicy fillings. Street food at its finest.',
    cuisine: 'Street Food,Rolls,North Indian', cover: IMG.r_rolls,
    rating: 4.4, ratingCount: 9100, costForTwo: 300, deliveryTime: 24, deliveryFee: 15,
    priceLevel: 1, isPureVeg: false, isPromoted: true, offer: 'Flat ₹75 OFF above ₹249',
    address: 'BTM Layout, Bangalore',
    categories: [
      { name: 'Kathi Rolls', items: [
        { name: 'Chicken Tikka Roll', desc: 'Tandoori chicken, onions, mint chutney', price: 119, img: IMG.roll, bestSeller: true, spice: 1 },
        { name: 'Paneer Tikka Roll', desc: 'Grilled paneer, veggies, chutney', price: 99, img: IMG.roll, veg: true, bestSeller: true },
        { name: 'Egg Roll', desc: 'Classic Kolkata egg roll with onions', price: 79, img: IMG.roll },
        { name: 'Mutton Seekh Roll', desc: 'Minced mutton seekh with spices', price: 139, img: IMG.roll, spice: 2 },
        { name: 'Double Egg Roll', desc: 'Loaded with double egg filling', price: 89, img: IMG.roll },
      ]},
      { name: 'Wraps', items: [
        { name: 'Veg Caesar Wrap', desc: 'Veggies, cheese, caesar dressing', price: 109, img: IMG.wrap, veg: true },
        { name: 'Chicken Shawarma', desc: 'Middle Eastern style chicken wrap', price: 149, img: IMG.wrap, spice: 1 },
      ]},
      { name: 'Sides', items: [
        { name: 'Masala Fries', desc: 'Fries tossed in tangy masala', price: 79, img: IMG.fries, veg: true, spice: 1 },
        { name: 'Onion Rings', desc: 'Crispy battered onion rings', price: 89, img: IMG.fries, veg: true },
      ]},
    ],
  },
  {
    name: 'Pasta La Vista', slug: 'pasta-la-vista',
    description: 'Handmade pasta, rich sauces & Italian classics. A little slice of Italy in the city.',
    cuisine: 'Italian,Continental', cover: IMG.r_italian,
    rating: 4.3, ratingCount: 4800, costForTwo: 550, deliveryTime: 32, deliveryFee: 25,
    priceLevel: 2, isPureVeg: false, isPromoted: false, offer: 'Free dessert above ₹399',
    address: 'Frazer Town, Bangalore',
    categories: [
      { name: 'Pasta', items: [
        { name: 'Spaghetti Carbonara', desc: 'Pancetta, egg, parmesan, pepper', price: 269, img: IMG.pasta, bestSeller: true },
        { name: 'Penne Alfredo', desc: 'Creamy parmesan white sauce', price: 229, img: IMG.pasta, veg: true },
        { name: 'Spaghetti Aglio e Olio', desc: 'Garlic, olive oil, chili, parsley', price: 219, img: IMG.pasta2, veg: true, spice: 1 },
        { name: 'Lasagna', desc: 'Layered pasta with meat & cheese', price: 299, img: IMG.pasta2 },
      ]},
      { name: 'Pizza', items: [
        { name: 'Margherita', desc: 'Tomato, mozzarella, basil', price: 229, img: IMG.pizza, veg: true },
        { name: 'Quattro Formaggi', desc: 'Four cheese pizza', price: 329, img: IMG.pizza2, veg: true },
      ]},
      { name: 'Sides', items: [
        { name: 'Bruschetta', desc: 'Toasted bread with tomato & basil', price: 129, img: IMG.garlicbread, veg: true },
        { name: 'Garlic Bread', desc: 'With herbs & butter', price: 99, img: IMG.garlicbread, veg: true },
      ]},
    ],
  },
]

const coupons = [
  { code: 'WELCOME50', description: '50% OFF up to ₹100 on first order', type: 'PERCENTAGE', value: 50, maxDiscount: 100, minOrder: 199 },
  { code: 'SAVE125', description: 'Flat ₹125 OFF on orders above ₹499', type: 'FLAT', value: 125, maxDiscount: null, minOrder: 499 },
  { code: 'FREEDEL', description: 'Free delivery on orders above ₹299', type: 'FLAT', value: 40, maxDiscount: null, minOrder: 299 },
  { code: 'PARTY20', description: '20% OFF up to ₹150 on orders above ₹699', type: 'PERCENTAGE', value: 20, maxDiscount: 150, minOrder: 699 },
  { code: 'BIG40', description: '40% OFF up to ₹80', type: 'PERCENTAGE', value: 40, maxDiscount: 80, minOrder: 199 },
]

const sampleReviews = [
  { rating: 5, comment: 'Absolutely delicious! The food arrived hot and fresh. Will order again!', dish: 'Biryani' },
  { rating: 4, comment: 'Great taste and quick delivery. Packaging could be better.', dish: 'Pizza' },
  { rating: 5, comment: 'Best in the city! The flavors are authentic and portion size is generous.', dish: 'Dosa' },
  { rating: 4, comment: 'Tasty food, slightly delayed but worth the wait.', dish: 'Burger' },
  { rating: 5, comment: 'Perfect portion, amazing taste. Highly recommend!', dish: 'Pasta' },
  { rating: 3, comment: 'Food was okay, expected better for the price.', dish: 'Salad' },
  { rating: 5, comment: 'Loved every bite! The dessert was heavenly.', dish: 'Cake' },
  { rating: 4, comment: 'Good value for money. Will definitely reorder.', dish: 'Rolls' },
]

const riders = [
  { name: 'Ravi Kumar', phone: '+919876543210', vehicle: 'Bike', rating: 4.9, totalDeliveries: 1240 },
  { name: 'Suresh Patel', phone: '+919876543211', vehicle: 'Bike', rating: 4.7, totalDeliveries: 890 },
  { name: 'Mohammed Irfan', phone: '+919876543212', vehicle: 'Scooter', rating: 4.8, totalDeliveries: 1560 },
  { name: 'Lakshmi N', phone: '+919876543213', vehicle: 'Bike', rating: 4.6, totalDeliveries: 670 },
  { name: 'Arjun Reddy', phone: '+919876543214', vehicle: 'Bike', rating: 4.9, totalDeliveries: 2010 },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Clean
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.menuItem.deleteMany()
  await db.menuCategory.deleteMany()
  await db.review.deleteMany()
  await db.coupon.deleteMany()
  await db.rider.deleteMany()
  await db.address.deleteMany()
  await db.customer.deleteMany()
  await db.restaurant.deleteMany()
  await db.zone.deleteMany()
  await db.city.deleteMany()

  // City
  const city = await db.city.create({ data: { name: 'Bangalore', state: 'Karnataka' } })
  await db.zone.createMany({ data: [
    { name: 'MG Road', cityId: city.id },
    { name: 'Indiranagar', cityId: city.id },
    { name: 'Koramangala', cityId: city.id },
    { name: 'HSR Layout', cityId: city.id },
    { name: 'Whitefield', cityId: city.id },
    { name: 'Jayanagar', cityId: city.id },
  ]})

  // Customer
  const customer = await db.customer.create({ data: {
    name: 'Aditya Sharma', email: 'aditya@example.com', phone: '+919812345678',
    walletBalance: 250, loyaltyPoints: 480,
  }})
  await db.address.createMany({ data: [
    { customerId: customer.id, label: 'Home', fullAddress: '12, MG Road, Bengaluru, 560001', landmark: 'Near Metro Station' },
    { customerId: customer.id, label: 'Work', fullAddress: 'Prestige Tech Park, Marathahalli, 560037', landmark: 'Tower B' },
  ]})

  // Riders
  for (const r of riders) {
    await db.rider.create({ data: r })
  }

  // Coupons
  for (const c of coupons) {
    await db.coupon.create({ data: c })
  }

  // Restaurants + menu
  for (const r of restaurants) {
    const restaurant = await db.restaurant.create({ data: {
      name: r.name, slug: r.slug, description: r.description, cuisine: r.cuisine,
      imageUrl: r.cover, coverUrl: r.cover, rating: r.rating, ratingCount: r.ratingCount,
      costForTwo: r.costForTwo, deliveryTime: r.deliveryTime, deliveryFee: r.deliveryFee,
      priceLevel: r.priceLevel, isPureVeg: r.isPureVeg, isPromoted: r.isPromoted,
      offer: r.offer, cityId: city.id, address: r.address,
      latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
      longitude: 77.5946 + (Math.random() - 0.5) * 0.1,
    }})

    for (let ci = 0; ci < r.categories.length; ci++) {
      const cat = r.categories[ci]
      const mc = await db.menuCategory.create({ data: {
        name: cat.name, restaurantId: restaurant.id, displayOrder: ci,
      }})
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

    // Reviews
    const reviewCount = Math.floor(Math.random() * 4) + 2
    for (let ri = 0; ri < reviewCount; ri++) {
      const rev = sampleReviews[Math.floor(Math.random() * sampleReviews.length)]
      await db.review.create({ data: {
        customerId: customer.id, restaurantId: restaurant.id,
        rating: rev.rating, comment: rev.comment, dish: rev.dish,
      }})
    }
  }

  console.log(`✅ Seeded ${restaurants.length} restaurants, ${coupons.length} coupons, ${riders.length} riders`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
