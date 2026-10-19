export const restaurant = {
  name: "Global Herbs",
  phone: "+40 734 293 050",
  phoneHref: "tel:+40734293050",
  address: "Str. Nicolae Tonitza 13, București 030167, Romania",
  streetAddress: "Str. Nicolae Tonitza 13",
  locality: "București",
  postalCode: "030167",
  countryCode: "RO",
  building: "Blocul Agricola Fonciera",
  timezone: "Europe/Bucharest",
  source: "https://www.globalherbsrestaurantsandbar.com/",
  reservations: "https://www.globalherbsrestaurantsandbar.com/reservations",
  ordering: "https://www.globalherbsrestaurantsandbar.com/online-ordering",
  experiences: "https://www.globalherbsrestaurantsandbar.com/experiences",
  maps: "https://www.google.com/maps/search/?api=1&query=Global+Herbs+Strada+Nicolae+Tonitza+13+Bucharest",
  instagram: "https://www.instagram.com/globalherbsrestaurantbar",
  facebook: "https://www.facebook.com/global.herbs.2025",
  tiktok: "https://www.tiktok.com/@globalherbs7",
  menuChecked: "2026-10-18",
};

export const directions = {
  google: `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", destination: `${restaurant.name}, ${restaurant.address}` })}`,
  // Restaurant pin verified in Google Maps on 2026-10-19; Apple's address search matched a different street.
  apple: `https://maps.apple.com/?${new URLSearchParams({ daddr: "44.4300233,26.0975673" })}`,
};

// Week starts Sunday. A close time above 24:00 belongs to the following day.
export const hours: Record<number, { open: number; close: number } | null> = {
  0: { open: 13 * 60, close: 25 * 60 },
  1: { open: 15 * 60, close: 24 * 60 },
  2: null,
  3: { open: 15 * 60, close: 24 * 60 },
  4: { open: 15 * 60, close: 24 * 60 },
  5: { open: 15 * 60, close: 24 * 60 },
  6: { open: 13 * 60, close: 25 * 60 },
};

export const gallery = [
  { file: "gallery-01-herbs-food.jpg", alt: "A Nepali thali with rice, vegetables and curry on a brass tray" },
  { file: "gallery-02-herbs-food1.jpg", alt: "Golden fried shrimp with dipping sauce" },
  { file: "gallery-03-pork-sekuwa.png", alt: "Pork sekuwa with vegetables and dipping sauce" },
  { file: "gallery-04-herbs-food-2.jpg", alt: "Prawns and handmade dumplings at Global Herbs" },
  { file: "gallery-05-pork-vindaloo.png", alt: "Pork vindaloo served at Global Herbs" },
  { file: "gallery-06-chicken-steam-momo.png", alt: "Chicken steam mo:mo with tomato dipping sauce" },
  { file: "gallery-07-chicken-biryani.png", alt: "Chicken biryani with raita" },
  { file: "gallery-08-cream-of-chicken-soup.png", alt: "Cream of chicken soup" },
  { file: "gallery-09-chicken-curry.png", alt: "Chicken curry at Global Herbs" },
  { file: "gallery-10-chicken-fried-rice.jpg", alt: "Chicken fried rice in a blue bowl" },
  { file: "gallery-11-daal-soup.jpg", alt: "Daal soup in a blue bowl" },
].map((image, i) => ({ ...image, thumb: `gallery-${String(i + 1).padStart(2, "0")}-thumb.webp` }));

export type MenuItem = { id: string; name: string; category: string; portion: string; price: number };
