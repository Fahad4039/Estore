export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "Electronics" | "Fashion" | "Audio" | "Gaming" | "Sports" | "Beauty" | "Kitchen" | "Home" | "Digital";
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  description: string;
  /** Short 1-2 line summary shown on cards and product header */
  shortDescription?: string;
  specifications: Record<string, string>;
  /** Alias for specifications (used by backend) */
  specs?: Record<string, string>;
  images: string[];
  /** Available color/variant options */
  colors?: string[];
  /** Available sizes (e.g. XS, S, M, L, XL or 6 7 8 9 10) */
  sizes?: string[];
  /** Emoji or short icon string displayed on product image thumbnail */
  icon?: string;
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  tags: string[];
  /** Estimated delivery days */
  deliveryDays?: number;
  /** Seller/vendor identifier */
  sellerId?: string;
  /** Seller/vendor display name */
  sellerName?: string;
}

// ─── Seeded deterministic PRNG (Mulberry32) ───────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ─── Curated fallback images per category (Unsplash — reliable on mobile) ─────
const FALLBACK_IMAGES: Record<string, string[]> = {
  Electronics: [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
  ],
  Audio: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1510771463146-e89e6e86560e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1524678714210-9917a6c619c2?w=800&h=800&fit=crop',
  ],
  Fashion: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&h=800&fit=crop',
  ],
  Gaming: [
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=800&fit=crop',
  ],
  Sports: [
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&h=800&fit=crop',
  ],
  Beauty: [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1583069-a0a8fe3d02db?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1621784563330-caee0b138a00?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=800&h=800&fit=crop',
  ],
  Kitchen: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1565538810643-b5bdb514cc97?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&h=800&fit=crop',
  ],
  Home: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1493552152660-f915ab47ae9d?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=800&fit=crop',
  ],
  Digital: [
    'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=800&fit=crop',
  ],
};

// ─── Product definitions ───────────────────────────────────────────────────────
const generateProducts = (): Product[] => {
  const productList: Product[] = [];

  const categories: Record<string, Array<{ n: string; b: string; p: number; img?: string }>> = {
    Electronics: [
      { n: 'iPhone 15 Pro Max 256GB',  b: 'Apple',    p: 1199.99, img: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop' },
      { n: 'Samsung Galaxy S24 Ultra', b: 'Samsung',  p: 1099.99 },
      { n: 'MacBook Pro M3 14"',        b: 'Apple',    p: 1999.99, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop' },
      { n: 'Dell XPS 13',              b: 'Dell',     p: 999.99 },
      { n: 'iPad Pro 12.9"',           b: 'Apple',    p: 1099.99 },
      { n: 'Sony WH-1000XM5',          b: 'Sony',     p: 349.99,  img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop' },
      { n: 'LG 4K OLED 65" TV',        b: 'LG',       p: 1799.99 },
      { n: 'Apple Watch Series 9',     b: 'Apple',    p: 399.99 },
      { n: 'Canon EOS R6 Mark II',     b: 'Canon',    p: 2499.99 },
      { n: 'Dyson V15 Vacuum',         b: 'Dyson',    p: 699.99 },
      { n: 'Ring Doorbell Pro 2',      b: 'Ring',     p: 249.99 },
      { n: 'Google Nest Hub Max',      b: 'Google',   p: 229.99 },
      { n: 'Samsung 4K Monitor 27"',   b: 'Samsung',  p: 599.99 },
      { n: 'Garmin Fenix 7X',          b: 'Garmin',   p: 799.99 },
      { n: 'GoPro Hero 12 Black',      b: 'GoPro',    p: 399.99 },
    ],
    Audio: [
      { n: 'Sony WH-1000XM5',              b: 'Sony',            p: 349.99, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop' },
      { n: 'Apple AirPods Pro 2nd Gen',    b: 'Apple',           p: 249.99 },
      { n: 'Bose QuietComfort 45',         b: 'Bose',            p: 279.99 },
      { n: 'Sennheiser Momentum 4',        b: 'Sennheiser',      p: 349.99 },
      { n: 'Bang & Olufsen Beoplay H95',   b: 'B&O',             p: 799.99 },
      { n: 'JBL Charge 5 Speaker',         b: 'JBL',             p: 179.99 },
      { n: 'Sonos Era 300',                b: 'Sonos',           p: 449.99 },
      { n: 'Beats Studio Pro',             b: 'Beats',           p: 349.99 },
      { n: 'Marshall Emberton III',        b: 'Marshall',        p: 129.99 },
      { n: 'Audio-Technica ATH-M50x',      b: 'Audio-Technica',  p: 149.99 },
      { n: 'Jabra Evolve2 85',             b: 'Jabra',           p: 379.99 },
      { n: 'Shure SE215',                  b: 'Shure',           p: 99.99 },
      { n: 'Sony SRS-XB43',               b: 'Sony',            p: 179.99 },
      { n: 'Anker Soundcore Liberty 4',    b: 'Anker',           p: 99.99 },
      { n: 'Google Pixel Buds Pro',        b: 'Google',          p: 199.99 },
    ],
    Fashion: [
      { n: 'Nike Air Max 270',              b: 'Nike',          p: 150,    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop' },
      { n: 'Adidas Ultraboost 23',          b: 'Adidas',        p: 190 },
      { n: "Levi's 501 Jeans",              b: "Levi's",        p: 89.99 },
      { n: 'Ray-Ban Classic Aviator',       b: 'Ray-Ban',       p: 154 },
      { n: 'Canada Goose Expedition Parka', b: 'Canada Goose',  p: 1095 },
      { n: 'Gucci GG Belt',                 b: 'Gucci',         p: 450,    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop' },
      { n: 'Fossil Gen 6 Watch',            b: 'Fossil',        p: 239.99, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop' },
      { n: 'Tommy Hilfiger Oxford Shirt',   b: 'Tommy Hilfiger',p: 79.99 },
      { n: 'North Face Fleece',             b: 'The North Face',p: 120 },
      { n: 'Puma RS-X Sneakers',            b: 'Puma',          p: 110 },
      { n: 'Casio G-Shock',                 b: 'Casio',         p: 99.99 },
      { n: 'Fjallraven Kanken Backpack',    b: 'Fjällräven',    p: 110 },
      { n: 'Lacoste Polo Shirt',            b: 'Lacoste',       p: 95 },
      { n: 'Timberland Premium Boots',      b: 'Timberland',    p: 198 },
      { n: 'Patagonia Down Jacket',         b: 'Patagonia',     p: 329 },
    ],
    Gaming: [
      { n: 'PlayStation 5',                  b: 'Sony',         p: 499.99, img: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=800&fit=crop' },
      { n: 'Xbox Series X',                  b: 'Microsoft',    p: 499.99 },
      { n: 'Nintendo Switch OLED',           b: 'Nintendo',     p: 349.99 },
      { n: 'ASUS ROG Zephyrus',              b: 'ASUS',         p: 1499.99 },
      { n: 'Razer DeathAdder V3',            b: 'Razer',        p: 69.99 },
      { n: 'SteelSeries Apex Pro',           b: 'SteelSeries',  p: 199.99 },
      { n: 'HyperX Cloud Alpha',             b: 'HyperX',       p: 99.99 },
      { n: 'Logitech G Pro X Superlight',    b: 'Logitech',     p: 159.99 },
      { n: 'Elgato 4K Capture Card',         b: 'Elgato',       p: 199.99 },
      { n: 'Samsung 32" Curved Monitor',     b: 'Samsung',      p: 399.99 },
      { n: 'DualSense Controller',           b: 'Sony',         p: 74.99 },
      { n: 'Xbox Elite Controller Series 2', b: 'Microsoft',    p: 179.99 },
      { n: 'Thrustmaster T300',              b: 'Thrustmaster', p: 399.99 },
      { n: 'NZXT H510 PC Case',              b: 'NZXT',         p: 89.99 },
      { n: 'Corsair Vengeance RAM 32GB',     b: 'Corsair',      p: 79.99 },
    ],
    Sports: [
      { n: 'Peloton Bike+',               b: 'Peloton',       p: 2495,   img: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=800&fit=crop' },
      { n: 'Nike Dri-FIT Running Shirt',  b: 'Nike',          p: 45 },
      { n: 'Adidas Training Shorts',      b: 'Adidas',        p: 35 },
      { n: 'Hydro Flask 32oz',            b: 'Hydro Flask',   p: 44.95 },
      { n: 'Bowflex Adjustable Dumbbells',b: 'Bowflex',       p: 429 },
      { n: 'Garmin GPS Running Watch',    b: 'Garmin',        p: 399.99 },
      { n: 'Theragun Elite Massager',     b: 'Therabody',     p: 375 },
      { n: 'Wilson Pro Staff Tennis Racket',b: 'Wilson',      p: 229 },
      { n: 'Yeti Rambler Tumbler',        b: 'Yeti',          p: 38 },
      { n: 'Under Armour Training Shoes', b: 'Under Armour',  p: 120 },
      { n: 'Manduka PRO Yoga Mat',        b: 'Manduka',       p: 120 },
      { n: 'Fitbit Sense 2',              b: 'Fitbit',        p: 249 },
      { n: 'TRX Training System',         b: 'TRX',           p: 199 },
      { n: 'Resistance Bands Set',        b: 'Amazon Basics', p: 29.99 },
      { n: 'Foam Roller Set',             b: 'Trigger Point', p: 39.99 },
    ],
    Beauty: [
      { n: 'Dyson Airwrap Complete',        b: 'Dyson',         p: 599,   img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop' },
      { n: 'La Mer Moisturizing Cream',     b: 'La Mer',        p: 190 },
      { n: 'Charlotte Tilbury Lipstick',    b: 'CT',            p: 35 },
      { n: 'Tatcha The Water Cream',        b: 'Tatcha',        p: 68 },
      { n: 'SK-II Facial Treatment Essence',b: 'SK-II',         p: 179 },
      { n: 'Olaplex No.3 Hair Perfector',   b: 'Olaplex',       p: 30 },
      { n: 'MAC Studio Fix Foundation',     b: 'MAC',           p: 44 },
      { n: "Fenty Pro Filt'r Foundation",   b: 'Fenty',         p: 40 },
      { n: 'Drunk Elephant C-Firma Serum',  b: 'Drunk Elephant',p: 90 },
      { n: 'NARS Soft Matte Concealer',     b: 'NARS',          p: 35 },
      { n: 'Sunday Riley Good Genes',       b: 'Sunday Riley',  p: 122 },
      { n: 'Foreo Luna 4',                  b: 'Foreo',         p: 219 },
      { n: 'Clarisonic Mia Smart',          b: 'Clarisonic',    p: 199 },
      { n: 'Neutrogena Hydro Boost',        b: 'Neutrogena',    p: 22.99 },
      { n: 'CeraVe Moisturizing Cream',     b: 'CeraVe',        p: 16.99 },
    ],
    Kitchen: [
      { n: 'KitchenAid Stand Mixer',  b: 'KitchenAid',  p: 449.99, img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop' },
      { n: 'Vitamix 5200 Blender',    b: 'Vitamix',      p: 549.95 },
      { n: 'Instant Pot Pro 8Qt',     b: 'Instant Pot',  p: 149.99 },
      { n: 'Nespresso Vertuo Next',   b: 'Nespresso',    p: 159 },
      { n: 'All-Clad D3 Cookware Set',b: 'All-Clad',     p: 699 },
      { n: 'Le Creuset Dutch Oven',   b: 'Le Creuset',   p: 380 },
      { n: 'Breville Barista Express',b: 'Breville',     p: 699.95 },
      { n: 'Cuisinart Air Fryer',     b: 'Cuisinart',    p: 199.95 },
      { n: 'OXO Good Grips Set',      b: 'OXO',          p: 89.99 },
      { n: 'Zwilling Knife Set',      b: 'Zwilling',     p: 299.99 },
    ],
    Home: [
      { n: 'Philips Hue Starter Kit',    b: 'Philips',      p: 199.99, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop' },
      { n: 'Nest Learning Thermostat',   b: 'Google',       p: 249.99 },
      { n: 'Roomba i7+',                 b: 'iRobot',       p: 599.99 },
      { n: 'LIFX Color Smart Bulb',      b: 'LIFX',         p: 49.99 },
      { n: 'Casper Original Mattress',   b: 'Casper',       p: 1095 },
      { n: 'Purple Mattress Queen',      b: 'Purple',       p: 1299 },
      { n: 'IKEA KALLAX Shelf',          b: 'IKEA',         p: 159.99 },
      { n: 'West Elm Mid-Century Desk',  b: 'West Elm',     p: 699 },
      { n: 'Pottery Barn Linen Duvet',   b: 'Pottery Barn', p: 189 },
      { n: 'MUJI Drawer Organizer Set',  b: 'MUJI',         p: 49.99 },
    ],
    Digital: [
      { n: 'ChatGPT Mega Prompt Pack 2025',      b: 'PromptsHQ',     p: 19,  img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=800&fit=crop' },
      { n: 'Dropshipping Mastery Course',         b: 'CourseVault',   p: 49,  img: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=800&fit=crop' },
      { n: 'Instagram Growth Script',             b: 'ScriptPro',     p: 29,  img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=800&fit=crop' },
      { n: 'Faceless YouTube Method',             b: 'DigitalHub',    p: 39,  img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=800&fit=crop' },
      { n: 'E-commerce Website Template',         b: 'WebForge',      p: 79,  img: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=800&fit=crop' },
      { n: 'AI Content Generator Tool',           b: 'AIToolsPro',    p: 49,  img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=800&fit=crop' },
      { n: '500+ Canva Template Pack',            b: 'DesignKits',    p: 19,  img: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=800&fit=crop' },
      { n: 'Email Marketing Automation Script',   b: 'MailScript',    p: 59,  img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=800&fit=crop' },
      { n: 'TikTok Viral Formula Course',         b: 'ViralAcademy',  p: 29,  img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=800&fit=crop' },
      { n: 'Shopify Store Blueprint',             b: 'EcomPro',       p: 99,  img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=800&fit=crop' },
      { n: 'SEO Keywords Mega Database',          b: 'RankTools',     p: 49,  img: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=800&h=800&fit=crop' },
      { n: 'Python Automation Script Bundle',     b: 'DevScripts',    p: 39,  img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=800&fit=crop' },
      { n: 'Notion Business OS Template',         b: 'TemplateOS',    p: 29,  img: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=800&fit=crop' },
      { n: 'AI Image Prompt Masterpack',          b: 'PromptsHQ',     p: 14,  img: 'https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=800&h=800&fit=crop' },
      { n: 'LinkedIn Lead Gen Method',            b: 'LeadMaster',    p: 59,  img: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&h=800&fit=crop' },
    ],
  };

  // Deterministic discount pattern per index
  const DISCOUNT_TABLE = [0, 0, 0, 15, 0, 20, 0, 10, 0, 0, 25, 0, 0, 18, 0];
  // Deterministic rating table (3.5–5.0)
  const RATING_TABLE   = [4.9, 4.7, 4.8, 4.6, 4.9, 4.5, 4.8, 4.7, 4.6, 4.9, 4.5, 4.8, 4.7, 4.6, 4.8];
  // Deterministic review count table
  const REVIEW_TABLE   = [312, 87, 214, 56, 445, 130, 298, 72, 189, 501, 34, 167, 423, 91, 256];
  // Deterministic stock table
  const STOCK_TABLE    = [24, 8, 42, 15, 30, 3, 50, 12, 37, 5, 48, 20, 9, 35, 27];
  // Badge flags table: [isNew, isFeatured, isFlashSale, isBestSeller, isTrending]
  const BADGE_TABLE: Array<[boolean, boolean, boolean, boolean, boolean]> = [
    [false, true,  false, true,  true ],
    [true,  false, false, false, true ],
    [false, true,  false, true,  false],
    [false, false, true,  true,  false],
    [true,  true,  false, false, true ],
    [false, false, false, true,  true ],
    [false, true,  true,  false, false],
    [true,  false, false, true,  false],
    [false, false, false, false, true ],
    [false, true,  false, true,  true ],
    [true,  false, true,  false, false],
    [false, true,  false, true,  false],
    [false, false, false, false, true ],
    [true,  false, false, true,  true ],
    [false, true,  false, false, false],
  ];

  let idCounter = 1;

  Object.entries(categories).forEach(([category, items]) => {
    const fallbacks = FALLBACK_IMAGES[category] ?? FALLBACK_IMAGES.Electronics;

    items.forEach((item, index) => {
      const tableIdx = index % 15;
      const discount = DISCOUNT_TABLE[tableIdx];
      const originalPrice = discount > 0 ? parseFloat((item.p * (1 + discount / 100)).toFixed(2)) : item.p;
      const [isNew, isFeatured, isFlashSale, isBestSeller, isTrending] = BADGE_TABLE[tableIdx];
      // Pick two distinct curated fallback images for this product
      const fb1 = fallbacks[index % fallbacks.length];
      const fb2 = fallbacks[(index + 4) % fallbacks.length];
      const images = item.img ? [item.img, fb2] : [fb1, fb2];

      productList.push({
        id: `prod_${idCounter++}`,
        name: item.n,
        brand: item.b,
        category: category as Product['category'],
        price: item.p,
        originalPrice,
        discount,
        rating: RATING_TABLE[tableIdx],
        reviewCount: REVIEW_TABLE[tableIdx],
        description: `Premium ${item.n} from ${item.b}. Experience the next level of quality and design. Perfect for everyday use and crafted with intention.`,
        specifications: {
          Brand: item.b,
          Model: item.n,
          Category: category,
          Condition: 'New',
          Warranty: '1 Year Manufacturer',
        },
        images,
        stock: STOCK_TABLE[tableIdx],
        isNew,
        isFeatured,
        isFlashSale,
        isBestSeller,
        isTrending,
        tags: [category.toLowerCase(), item.b.toLowerCase(), 'premium'],
      });
    });
  });

  return productList;
};

export const products = generateProducts();
