import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock3,
  CreditCard,
  Crown,
  FerrisWheel,
  Home,
  Mail,
  Map as MapIcon,
  MapPin,
  Menu,
  Palette,
  PartyPopper,
  Phone,
  ShieldCheck,
  Sparkles,
  Ticket,
  Utensils,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import {
  confirmPhoneOtp,
  createEmailAccount,
  createPaymentReceipt,
  createPublicRequest,
  getStaffProfile,
  getStaffRequestQueue,
  sendPhoneOtp,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  subscribeAuthUser,
  subscribePublicLiveStatus,
  trackEvent,
  trackPageView,
} from './firebaseClient'
import {
  initiateEsewaPayment,
  initiateKhaltiPayment,
  submitEsewaForm,
  verifyEsewaPayment,
  verifyKhaltiPayment,
} from './paymentClient'

const currentHostname = () => window.location.hostname.toLowerCase()
const isStaffHostname = () => currentHostname().startsWith('staff.')
const isAdminHostname = () => currentHostname().startsWith('admin.')

const park = { lng: 85.3239042, lat: 27.7836311 }
const tokhaMunicipality = { lng: 85.32746, lat: 27.74526 }
const defaultLiveStatus = {
  operatingStatus: 'Open',
  hours: '10:00 AM - 9:00 PM',
  avgWait: '15-25 min',
  nextShow: '8:30 PM Parade',
  currentCapacity: 0,
  maxCapacity: 700,
}
const weatherLabels = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
}
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lng}&destination_place_id=Magic+Land+Family+Fun+Park`
const osmTileGrid = {
  z: 15,
  xs: [24149, 24150, 24151],
  ys: [13749, 13750, 13751, 13752],
}
const routeToPark = [
  [85.329556, 27.767264],
  [85.330302, 27.767803],
  [85.330233, 27.768763],
  [85.329311, 27.769528],
  [85.329252, 27.770201],
  [85.329552, 27.770913],
  [85.32975, 27.771522],
  [85.330183, 27.772184],
  [85.330419, 27.773571],
  [85.330242, 27.774027],
  [85.329655, 27.774658],
  [85.328993, 27.775225],
  [85.327934, 27.775444],
  [85.327379, 27.776172],
  [85.326851, 27.777065],
  [85.325808, 27.777753],
  [85.32572, 27.778661],
  [85.325366, 27.779322],
  [85.324175, 27.779864],
  [85.323456, 27.780173],
  [85.32322, 27.781056],
  [85.322494, 27.781896],
  [85.321838, 27.782094],
  [85.32212, 27.782916],
  [85.322599, 27.783203],
  [85.323293, 27.783429],
  [85.323901, 27.783634],
]

const img = {
  hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDitvdo9wpvDjiLye1BqgtOFcyRa8mT5uGfRwXEC3KADDNUxfJvWubZxs9blTBbdivJCn5I0z-Lbwszfk25rMelo8S4i37nUsz2Db2W6wQEEHoMcT9vRJbBvS0YjANsG_sM4R48XAynoDm8nduXp_ZJLtBCPdSC1nCFcAq5QGzcC7vkZ2YqB_LsJ5zeBmDxWWxPT_oHb8BNACQ_PoGi2yR0fU7m2t8eUVf8W_rfaDDZpGtZv0KGSru7zfoFv6E_D1aIgUEj7nJKANGV',
  mobileHero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5EHqf-rU5hIIFIJit9P1kGuqshsu7W6BgmjFTX77lD20gjCaa7durA2Lqm2mQ85CYlJSIYj11Cuhik245iUiphXo1-8TA8qPZW7pnod-DLxEtVGjlHLr_ycAbADaVHDgrSFoes5mg97IJ7IoWPT7bk8T0snsN3NvEOADIb9hY1-Zr5AeIQ2kRb_AkoVVaDGNXk0frNVwdXeZ0eFaHMYa4NjyRCqTgUXA3_D-a3NAHWIAQWTCr71Fv71kCuZ87Do0y_ijzMtg1aYYA',
  mobileMoment: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpJHUHCBI9sqDaVv2biC-ZsqSVNJp1gm8yV3wbSo2osZqir9xUuHz5jXQ3KDj2L76g0Nc1y8uitlSCLdwf29KWnP9yEyixN4-YWSO83pjxoHauQLbDg4UhS14myIb8h30UQpQod0IGno3tpUC-G4jDtlgx-wkpQO2qc16nhBYkRBAOv1CGJeLRoNyVBemqhml3qcXEIqw0y2pe0vGE2ZXYJaeZXY2VrMFzffjiM28zEdCSJYaYssKQ09TRHWGAjb9qiq_Ul5p7kPxf',
  castle: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80',
  coaster: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=900&q=80',
  carousel: 'https://images.unsplash.com/photo-1505731110654-99d7f7f8e39c?auto=format&fit=crop&w=900&q=80',
  splash: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80',
  arcade: 'https://images.unsplash.com/photo-1577741314755-048d8525d31e?auto=format&fit=crop&w=900&q=80',
  dining: 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=80',
  birthday: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1100&q=80',
  parade: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1100&q=80',
  vrBike: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=900&q=80',
  vrCar: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
  vrShooting: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80',
  pool: 'https://commons.wikimedia.org/wiki/Special:FilePath/Break-off%20shot%20(Unsplash).jpg?width=900',
  familyGames: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
  kidsPlay: 'https://images.unsplash.com/photo-1564429238817-393bd4286b2d?auto=format&fit=crop&w=900&q=80',
  creativeVillage: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=80',
  bicycle: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
  zipline: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80',
  pottery: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80',
  painting: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
  villageHeritage: '/creative-village-heritage.svg',
  sevenStonesPond: '/seven-stones-pond.svg',
}

const nav = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'attractions', label: 'Attractions', icon: FerrisWheel },
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'memberships', label: 'Membership', icon: Crown },
  { id: 'birthdays', label: 'Birthdays', icon: PartyPopper },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'more', label: 'More', icon: Menu },
]

const moreNav = [
  { id: 'dining', label: 'Dining', icon: Utensils },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'about', label: 'About Us', icon: FerrisWheel },
  { id: 'faq', label: 'FAQ', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Wallet },
  { id: 'terms', label: 'Terms', icon: CreditCard },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'account', label: 'Account', icon: UserRound },
]

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61578532986157', icon: 'facebook' },
  { label: 'Instagram', href: 'https://www.instagram.com/magiclandnepal/', icon: 'instagram' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@magiclandfunpark.com', icon: 'tiktok' },
  { label: 'YouTube', href: '', icon: 'youtube' },
]

const pagePaths = {
  home: '/home',
  attractions: '/attractions',
  tickets: '/tickets',
  memberships: '/membership',
  birthdays: '/birthdays',
  map: '/map',
  dining: '/dining',
  events: '/events',
  about: '/about',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  contact: '/contact',
  account: '/account',
  thankYou: '/thank-you',
  more: '/more',
  khaltiReturn: '/payment/khalti/return',
  esewaReturn: '/payment/esewa/return',
  esewaFailure: '/payment/esewa/failure',
}

const pathAliases = {
  '/': 'home',
  '/home': 'home',
  '/attractions': 'attractions',
  '/rides': 'attractions',
  '/tickets': 'tickets',
  '/membership': 'memberships',
  '/memberships': 'memberships',
  '/birthdays': 'birthdays',
  '/map': 'map',
  '/dining': 'dining',
  '/events': 'events',
  '/about': 'about',
  '/faq': 'faq',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/contact': 'contact',
  '/account': 'account',
  '/login': 'account',
  '/thank-you': 'thankYou',
  '/more': 'more',
  '/payment/khalti/return': 'khaltiReturn',
  '/payment/esewa/return': 'esewaReturn',
  '/payment/esewa/failure': 'esewaFailure',
}

const zoneFilters = ['All', 'VR & Simulators', 'Family Rides', 'Kids Play', 'Arcade & Skill', 'Creative Village']

const zoneCards = [
  { title: 'VR & Simulator Zone', zone: 'VR & Simulators', icon: Ticket, image: img.vrBike, copy: 'VR bikes, car simulators, immersive shooting, motion games, and high-energy replay fun.' },
  { title: 'Family Rides', zone: 'Family Rides', icon: FerrisWheel, image: img.carousel, copy: 'Classic rides for children and families, from carousel moments to bumper car laughs.' },
  { title: 'Kids Play Zone', zone: 'Kids Play', icon: PartyPopper, image: img.kidsPlay, copy: 'Soft play, jumping, bouncy castle, spray ball, trampoline bridge, zipline, and active fun.' },
  { title: 'Arcade & Skill Games', zone: 'Arcade & Skill', icon: Ticket, image: img.arcade, copy: 'Coin games, basketball machines, pool tables, prize games, and quick repeatable challenges.' },
  { title: 'Creative Village', zone: 'Creative Village', icon: Palette, image: img.pottery, copy: 'A softer village-style space for pottery, painting, colors, dhiki-jato heritage play, madani, doko, arts, crafts, and family bonding.' },
  { title: 'Seven Color Garden Pond', zone: 'Garden Feature', icon: Sparkles, image: img.sevenStonesPond, copy: 'A photo-friendly pond and fountain garden with seven colorful stone towers inspired by the Las Vegas Seven Magic Mountains idea.' },
]

const attractionList = [
  { name: 'VR Machine Pods', zone: 'VR & Simulators', category: 'VR', wait: '5 units', height: '8+ years', image: img.vrBike, bestFor: 'First-time VR explorers', copy: 'Immersive VR pods for motion games, fantasy experiences, and repeat-friendly digital adventures.' },
  { name: 'VR Bike Racing', zone: 'VR & Simulators', category: 'VR thrill', wait: '12 min', height: '8+ years', image: img.vrBike, bestFor: 'Speed lovers', copy: 'High-energy bike racing with motion seats, speed effects, and friendly competition.' },
  { name: 'VR Car Simulator', zone: 'VR & Simulators', category: 'Racing', wait: '15 min', height: '8+ years', image: img.vrCar, bestFor: 'Racing fans and groups', copy: 'Steer, drift, and race through immersive tracks made for kids, teens, and parents.' },
  { name: 'Immersive Gun Shooting', zone: 'VR & Simulators', category: 'Skill game', wait: '10 min', height: '10+ years', image: img.vrShooting, bestFor: 'Score challenges', copy: 'Safe, interactive target games with scoreboards, missions, and replay-friendly challenges.' },
  { name: 'Horse Riding Archery', zone: 'VR & Simulators', category: 'Action', wait: 'Session', height: '10+ years', image: img.familyGames, bestFor: 'Adventure play', copy: 'A themed skill experience combining movement, aim, and playful competition.' },
  { name: 'Boxing Challenge', zone: 'VR & Simulators', category: 'Challenge', wait: 'Quick play', height: '10+ years', image: img.boxing, bestFor: 'Energy release', copy: 'A punch-score challenge for teens, parents, and groups who enjoy friendly contests.' },
  { name: '16 Seats Carousel', zone: 'Family Rides', category: 'Family', wait: '5 min', height: 'All ages', image: img.carousel, bestFor: 'Young children', copy: 'A classic carousel ride for gentle family fun and photo-friendly moments.' },
  { name: 'Flying Spaceship', zone: 'Family Rides', category: 'Ride', wait: '8 min', height: 'All ages', image: img.coaster, bestFor: 'Little adventurers', copy: 'A cheerful spaceship ride that gives children a playful flying feeling.' },
  { name: 'Self-Control Plane', zone: 'Family Rides', category: 'Ride', wait: '8 min', height: 'All ages', image: img.castle, bestFor: 'Kids who like controls', copy: 'Children can guide their own plane-style ride with gentle up-and-down movement.' },
  { name: 'Bumper Cars', zone: 'Family Rides', category: 'Family', wait: '33 cars', height: '6+ years', image: img.familyGames, bestFor: 'Family laughs', copy: 'Classic bumper car fun for children, parents, and groups who enjoy light competition.' },
  { name: 'Jumping Zone', zone: 'Kids Play', category: 'Active', wait: 'Open', height: 'Kids', image: img.kidsPlay, bestFor: 'Active kids', copy: 'A safe active-play area for jumping, movement, and burn-off-energy fun.' },
  { name: 'Bouncy Castle', zone: 'Kids Play', category: 'Soft play', wait: '3 sets', height: 'Kids', image: img.kidsPlay, bestFor: 'Younger children', copy: 'Colorful inflatable play for birthdays, weekend visits, and safe energetic play.' },
  { name: 'Spray Ball Play', zone: 'Kids Play', category: 'Soft play', wait: 'Open', height: 'Kids', image: img.splash, bestFor: 'Group play', copy: 'A playful ball-spray activity for children who love movement and interactive play.' },
  { name: 'Soft Play Structures', zone: 'Kids Play', category: 'Play', wait: '7 sets', height: 'Kids', image: img.kidsPlay, bestFor: 'Small children', copy: 'Non-powered play equipment for climbing, exploring, and supervised soft adventure.' },
  { name: 'Trampoline Bridge', zone: 'Kids Play', category: 'Active', wait: 'Open', height: 'Kids', image: img.kidsPlay, bestFor: 'Balance play', copy: 'A trampoline-style bridge for active kids who enjoy bouncing and crossing challenges.' },
  { name: 'Zipline', zone: 'Kids Play', category: 'Adventure', wait: 'Session', height: 'Kids', image: img.zipline, bestFor: 'Brave kids', copy: 'A short adventure-style zipline moment that adds movement and excitement to the play zone.' },
  { name: 'Teeterboard & Rocking Horse', zone: 'Kids Play', category: 'Toddler', wait: 'Open', height: 'Kids', image: img.carousel, bestFor: 'Toddlers', copy: 'Gentle balancing and rocking play for younger children and calmer visits.' },
  { name: 'Bicycle Play', zone: 'Kids Play', category: 'Outdoor', wait: '12 bikes', height: 'Kids', image: img.bicycle, bestFor: 'Active riders', copy: 'Bicycle play for children who enjoy simple movement, coordination, and outdoor fun.' },
  { name: 'Coin Game Machines', zone: 'Arcade & Skill', category: 'Arcade', wait: '26 games', height: 'All ages', image: img.arcade, bestFor: 'Quick replays', copy: 'A large set of coin game machines for quick challenges and repeatable family fun.' },
  { name: 'Basketball Machines', zone: 'Arcade & Skill', category: 'Skill', wait: '3 machines', height: 'All ages', image: img.basketball, bestFor: 'Score battles', copy: 'Basketball shooting machines for timed rounds, friend challenges, and high-score play.' },
  { name: 'Indoor Pool Tables', zone: 'Arcade & Skill', category: 'Indoor', wait: 'Open', height: 'All ages', image: img.pool, bestFor: 'Parents and teens', copy: 'Pool tables and indoor skill games for relaxed competition between rides.' },
  { name: 'Prize & Skill Corner', zone: 'Arcade & Skill', category: 'Skill', wait: 'Open', height: 'All ages', image: img.arcade, bestFor: 'Membership value', copy: 'Prize-style moments, quick challenges, and arcade corners that make repeat visits worthwhile.' },
  { name: 'Pottery Workshop', zone: 'Creative Village', category: 'Creative', wait: 'Workshop', height: 'All ages', image: img.pottery, bestFor: 'Parent-child bonding', copy: 'A calm hands-on pottery space inside aesthetic village-style homes for creative family time.' },
  { name: 'Painting Studio', zone: 'Creative Village', category: 'Creative', wait: 'Workshop', height: 'All ages', image: img.painting, bestFor: 'Birthdays and schools', copy: 'Painting sessions where children can explore colors, brushes, and take-home memories.' },
  { name: 'Color Sand Play', zone: 'Creative Village', category: 'Creative', wait: 'Open', height: 'Kids', image: img.creativeVillage, bestFor: 'Sensory play', copy: 'Color sand activities for calm sensory play, art corners, and photo-friendly moments.' },
  { name: 'Dhiki & Jato Heritage Corner', zone: 'Creative Village', category: 'Heritage', wait: 'Guided', height: 'All ages', image: img.villageHeritage, bestFor: 'School visits', copy: 'A child-friendly cultural corner inspired by traditional Nepali dhiki and jato grain tools, presented as touch-and-learn heritage play.' },
  { name: 'Madani & Doko Craft Play', zone: 'Creative Village', category: 'Heritage craft', wait: 'Workshop', height: 'All ages', image: img.villageHeritage, bestFor: 'Creative learning', copy: 'Village-style craft storytelling with madani, doko, baskets, colors, and hands-on activity prompts for families.' },
  { name: 'Arts & Crafts Village Homes', zone: 'Creative Village', category: 'Creative', wait: 'Open', height: 'All ages', image: img.creativeVillage, bestFor: 'Slow family time', copy: 'Aesthetic village homes for arts, crafts, workshops, and quiet moments between high-energy games.' },
  { name: 'Seven Color Garden Pond', zone: 'Creative Village', category: 'Garden feature', wait: 'Photo stop', height: 'All ages', image: img.sevenStonesPond, bestFor: 'Photos and calm breaks', copy: 'A garden pond with fountain jets and seven colorful stacked stone towers inspired by the Seven Magic Mountains public art style.' },
]

const ticketOptions = [
  { name: 'One-Time Entry', price: 1500, kind: 'entry', defaultGuests: 1, detail: 'Best for families planning one Magic Land visit with rides, VR games, arcade fun, and Creative Village access.' },
  { name: 'Gift Ticket', price: 1500, kind: 'entry', defaultGuests: 1, detail: 'A simple entry gift for birthdays, friends, cousins, and family celebrations.' },
  { name: 'Group Day Visit', price: 1500, kind: 'entry', defaultGuests: 10, detail: 'For schools, teams, offices, and larger family groups. Magic Land can confirm final timing by phone.' },
]

const membershipPlans = [
  {
    name: 'Individual Fun Pass',
    price: 'Rs. 2,999',
    basePrice: 2999,
    baseMembers: 1,
    subtitle: 'Individual membership',
    entries: '5 visits',
    perVisit: 'Valid for 3 months',
    regular: 'Individual access',
    savings: 'Flexible usage within validity',
    comparison: 'Normal 5 entries cost Rs. 7,500. Membership is Rs. 2,999.',
    outingText: 'Enough for weekend visits, school holidays, and surprise play days across 3 months.',
    includes: ['5 visits', 'Valid for 3 months', 'Individual access', 'Flexible usage within validity'],
    bestFor: ['Weekend visits', 'Holiday outings', 'Kids who love repeat experiences', 'Families exploring Magic Land regularly'],
  },
  {
    name: 'Family Duo Pass',
    price: 'Rs. 5,499',
    basePrice: 5499,
    baseMembers: 2,
    subtitle: 'Family of 2 membership',
    entries: '10 shared visits',
    perVisit: 'Valid for 3 months',
    regular: 'Shared usage for 2 family members',
    savings: 'Flexible parent-child visits',
    comparison: 'Normal 10 entries cost Rs. 15,000. Membership is Rs. 5,499.',
    outingText: 'Made for parent-child days, quick weekend plans, and shared family routines.',
    includes: ['10 shared visits', 'Valid for 3 months', 'Shared usage for 2 family members'],
    bestFor: ['Parent-child visits', 'Weekend family time', 'Flexible family usage', 'Repeat outings without repeated ticket purchases'],
  },
  {
    name: 'Family Magic Pass',
    price: 'Rs. 9,499',
    basePrice: 9499,
    baseMembers: 4,
    subtitle: 'Family of 4 membership',
    entries: '20 shared visits',
    perVisit: 'Valid for 3 months',
    regular: 'Designed for families of 4',
    savings: 'The complete family experience package',
    comparison: 'Normal 20 entries cost Rs. 30,000. Membership is Rs. 9,499.',
    outingText: 'About 5 full family outings for a family of 4 when everyone visits together.',
    includes: ['20 shared visits', 'Valid for 3 months', 'Designed for families of 4'],
    bestFor: ['Family weekends', 'Holiday experiences', 'Sibling outings', 'Frequent visitors', 'Building memorable family routines'],
  },
]

const membershipAddOnPrice = 2000

function ticketPriceBreakdown(ticket, guests) {
  const subtotal = ticket.price * guests
  const discountRate = guests >= 10 ? 0.1 : guests > 5 ? 0.05 : 0
  const discount = Math.round(subtotal * discountRate)
  const isGroupPrice = guests > 5
  return {
    subtotal,
    discountRate,
    discount,
    isGroupPrice,
    total: subtotal - discount,
  }
}

function membershipPriceBreakdown(startingPlan, additionalMembers) {
  const startingMembers = Number(startingPlan.baseMembers || 1)
  const requestedAdditionalMembers = Math.max(Number(additionalMembers) || 0, 0)
  const totalMembers = startingMembers + requestedAdditionalMembers
  const individualPlan = membershipPlans[0]
  const duoPlan = membershipPlans[1]
  const familyPlan = membershipPlans[2]
  const standardPlan = totalMembers >= 4 ? familyPlan : totalMembers >= 2 ? duoPlan : individualPlan
  const standardMembers = Number(standardPlan.baseMembers || 1)
  const addOnMembers = Math.max(totalMembers - standardMembers, 0)
  const addOnTotal = addOnMembers * membershipAddOnPrice
  const basePrice = Number(standardPlan.basePrice || String(standardPlan.price).replace(/\D/g, '') || 0)
  return {
    startingMembers,
    requestedAdditionalMembers,
    totalMembers,
    standardPlan,
    basePrice,
    baseMembers: standardMembers,
    addOnMembers,
    addOnTotal,
    total: basePrice + addOnTotal,
  }
}

function ComparisonNote({ text }) {
  const sentences = text.includes('. Membership')
    ? [text.slice(0, text.indexOf('. Membership') + 1), text.slice(text.indexOf('Membership'))]
    : [text]
  return (
    <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-[var(--primary)]">
      {sentences.map((sentence) => sentence.trim()).filter(Boolean).map((sentence) => (
        <p key={sentence}>{sentence}</p>
      ))}
    </div>
  )
}


function App() {
  if (isStaffHostname()) return <InternalPortal mode="staff" />
  if (isAdminHostname()) return <InternalPortal mode="admin" />

  return <PublicApp />
}

function PublicApp() {
  const pageFromLocation = () => {
    const hashPage = window.location.hash.replace(/^#\/?/, '')
    if (hashPage) return pathAliases[`/${hashPage}`] ?? hashPage
    return pathAliases[window.location.pathname] ?? 'home'
  }
  const [page, setPageState] = useState(pageFromLocation)
  const [menuOpen, setMenuOpen] = useState(false)

  const allPages = useMemo(() => [...nav, ...moreNav], [])
  const active = allPages.find((item) => item.id === page) ?? allPages[0]
  const navigate = (nextPage, replace = false) => {
    setMenuOpen(false)
    setPageState(nextPage)
    trackEvent('navigation_click', { target_page: nextPage, source_page: page })
    const nextUrl = pagePaths[nextPage] ?? `/${nextPage}`
    if (replace) {
      window.history.replaceState(null, '', nextUrl)
    } else if (window.location.pathname !== nextUrl || window.location.hash) {
      window.history.pushState(null, '', nextUrl)
    }
  }

  useEffect(() => {
    const hashPage = window.location.hash.replace(/^#\/?/, '')
    if (hashPage) {
      const resolvedPage = pathAliases[`/${hashPage}`] ?? hashPage
      window.history.replaceState(null, '', pagePaths[resolvedPage] ?? `/${resolvedPage}`)
      return
    }
    const canonicalPath = pagePaths[pageFromLocation()]
    if (canonicalPath && window.location.pathname !== canonicalPath) {
      window.history.replaceState(null, '', canonicalPath)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    trackPageView(page)
  }, [page])

  useEffect(() => {
    const handlePop = () => {
      setMenuOpen(false)
      setPageState(pageFromLocation())
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  return (
    <div className="min-h-screen">
      <Header page={page} setPage={navigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        {page === 'home' && <HomePage setPage={navigate} />}
        {page === 'attractions' && <AttractionsPage setPage={navigate} />}
        {page === 'tickets' && <TicketsPage setPage={navigate} />}
        {page === 'memberships' && <MembershipPage setPage={navigate} />}
        {page === 'birthdays' && <BirthdaysPage />}
        {page === 'map' && <MapPage />}
        {page === 'dining' && <DiningPage />}
        {page === 'events' && <EventsPage />}
        {page === 'about' && <AboutPage />}
        {page === 'faq' && <FAQPage />}
        {page === 'privacy' && <PrivacyPage />}
        {page === 'terms' && <TermsPage />}
        {page === 'contact' && <ContactPage />}
        {page === 'account' && <AccountPage setPage={navigate} />}
        {page === 'thankYou' && <ThankYouPage setPage={navigate} />}
        {page === 'khaltiReturn' && <KhaltiReturnPage />}
        {page === 'esewaReturn' && <EsewaReturnPage />}
        {page === 'esewaFailure' && <PaymentFailurePage gateway="eSewa" />}
        {page === 'more' && <MorePage setPage={navigate} />}
      </main>
      <Footer setPage={navigate} />
      <BottomNav active={active.id} setPage={navigate} />
    </div>
  )
}

function useParkWeather() {
  const [weather, setWeather] = useState({ temp: '24', label: 'Checking weather' })

  useEffect(() => {
    let active = true
    const loadWeather = async () => {
      try {
        const params = new URLSearchParams({
          latitude: String(park.lat),
          longitude: String(park.lng),
          current: 'temperature_2m,weather_code',
          timezone: 'Asia/Kathmandu',
        })
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
        if (!response.ok) throw new Error('Weather unavailable')
        const data = await response.json()
        if (!active) return
        const current = data.current ?? {}
        const temp = Number(current.temperature_2m)
        setWeather({
          temp: Number.isFinite(temp) ? Math.round(temp).toString() : '24',
          label: weatherLabels[current.weather_code] ?? 'Park weather',
        })
      } catch {
        if (active) setWeather({ temp: '24', label: 'Park weather' })
      }
    }
    loadWeather()
    const timer = window.setInterval(loadWeather, 30 * 60 * 1000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  return weather
}

function useLiveParkStatus() {
  const [liveStatus, setLiveStatus] = useState(defaultLiveStatus)

  useEffect(() => {
    let unsubscribe = () => {}
    let active = true

    subscribePublicLiveStatus((data) => {
      if (!active) return
      setLiveStatus((current) => ({ ...current, ...data }))
    }).then((cleanup) => {
      unsubscribe = cleanup
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return liveStatus
}

function useAuthUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = () => {}
    let active = true

    subscribeAuthUser((nextUser) => {
      if (!active) return
      setUser(nextUser)
      setLoading(false)
    }).then((cleanup) => {
      unsubscribe = cleanup
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { user, loading }
}

function useStaffAccess(requiredMode) {
  const { user, loading } = useAuthUser()
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (loading) return undefined
    if (!user?.uid) {
      queueMicrotask(() => {
        if (!active) return
        setProfile(null)
        setProfileLoading(false)
      })
      return undefined
    }

    queueMicrotask(() => {
      if (!active) return
      setProfile(null)
      setProfileLoading(true)
    })
    getStaffProfile(user.uid, user.email)
      .then((nextProfile) => {
        if (!active) return
        setProfile(nextProfile)
      })
      .catch((error) => {
        if (!active) return
        setProfile({
          missing: true,
          errorCode: error?.code || '',
          errorMessage: error?.message || 'Could not read staff profile.',
          attempts: [`staff/${user.uid}`, `staff/${user.email || ''}`],
        })
      })
      .finally(() => {
        if (!active) return
        setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [loading, user?.email, user?.uid])

  const role = String(profile?.role || '').trim()
  const allowedRoles = requiredMode === 'admin' ? ['admin', 'manager'] : ['admin', 'manager', 'supervisor', 'entry_staff']
  const isActive = profile?.active === true || String(profile?.active || '').toLowerCase() === 'true'
  const allowed = Boolean(user && !profile?.missing && isActive && allowedRoles.includes(role))

  return { user, profile, loading: loading || profileLoading, allowed, isActive, role }
}

function InternalPortal({ mode }) {
  const [manualCode, setManualCode] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraMessage, setCameraMessage] = useState('')
  const [staffRequests, setStaffRequests] = useState([])
  const [requestSearch, setRequestSearch] = useState('')
  const [requestQueueMessage, setRequestQueueMessage] = useState('')
  const streamRef = useRef(null)
  const scanLoopRef = useRef(null)
  const html5ScannerRef = useRef(null)
  const fileInputRef = useRef(null)
  const { user, profile, loading, allowed, role } = useStaffAccess(mode)
  const isAdmin = mode === 'admin'
  const scannerElementId = 'magicland-staff-qr-reader'
  const fileScannerElementId = 'magicland-file-qr-reader'

  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta')
    robots.setAttribute('name', 'robots')
    robots.setAttribute('content', 'noindex, nofollow')
    document.head.appendChild(robots)
    document.title = isAdmin ? 'Magic Land Admin' : 'Magic Land Staff Check-in'
  }, [isAdmin])

  useEffect(() => () => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current)
    Promise.resolve(html5ScannerRef.current?.stop?.()).catch(() => {})
    Promise.resolve(html5ScannerRef.current?.clear?.()).catch(() => {})
    streamRef.current?.getTracks?.().forEach((track) => track.stop())
  }, [])

  useEffect(() => {
    let active = true
    if (!allowed || isAdmin) return undefined
    queueMicrotask(() => {
      if (active) setRequestQueueMessage('Loading booking requests...')
    })
    getStaffRequestQueue()
      .then((result) => {
        if (!active) return
        setStaffRequests(result.items || [])
        setRequestQueueMessage(result.error || '')
      })
      .catch((error) => {
        if (!active) return
        setStaffRequests([])
        setRequestQueueMessage(error?.message || 'Could not load booking requests.')
      })
    return () => {
      active = false
    }
  }, [allowed, isAdmin])

  const stopCameraScan = () => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current)
    scanLoopRef.current = null
    Promise.resolve(html5ScannerRef.current?.stop?.()).catch(() => {})
    Promise.resolve(html5ScannerRef.current?.clear?.()).catch(() => {})
    html5ScannerRef.current = null
    streamRef.current?.getTracks?.().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  const readQrValue = (value, source = 'QR scanned') => {
    const cleaned = String(value || '').trim()
    if (!cleaned) return
    let details
    try {
      details = JSON.parse(cleaned)
    } catch {
      details = null
    }
    const isMagicLandQr = details?.type === 'magic_land_ticket'
    const reference = details?.reference || cleaned
    setManualCode(cleaned)
    setScanResult({
      code: reference,
      status: isMagicLandQr ? source : 'Unknown QR',
      message: isMagicLandQr
        ? 'QR read successfully. Confirm guest details before check-in at the gate.'
        : 'This QR was readable, but it does not look like a Magic Land ticket QR.',
      details,
    })
    trackEvent('staff_qr_read', { portal: mode, source, valid_magicland_qr: isMagicLandQr })
  }

  const startCameraScan = async () => {
    setCameraMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera access is not available in this browser. Search the booking list below or paste the QR value manually.')
      return
    }
    try {
      setCameraActive(true)
      await new Promise((resolve) => setTimeout(resolve, 80))
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(scannerElementId, { verbose: false })
      html5ScannerRef.current = scanner
      const cameras = await Html5Qrcode.getCameras().catch(() => [])
      const backCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label || ''))
      await scanner.start(
        backCamera?.id ? { deviceId: { exact: backCamera.id } } : { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            const size = Math.max(180, Math.floor(minEdge * 0.72))
            return { width: size, height: size }
          },
        },
        (decodedText) => {
          readQrValue(decodedText, 'Camera scan')
          stopCameraScan()
        },
        () => {},
      )
      if (!window.isSecureContext) {
        setCameraMessage('Tip: mobile browsers usually require HTTPS for camera access. Use staff.magiclandfunpark.com on the phone.')
      }
      trackEvent('staff_camera_scanner_started', { portal: mode })
    } catch (error) {
      setCameraMessage(error?.message || 'Could not start the camera scanner. Search the booking list below or paste the QR value manually.')
      stopCameraScan()
    }
  }

  const scanQrImageFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCameraMessage('Reading QR from selected image...')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(fileScannerElementId, { verbose: false })
      const decodedText = await scanner.scanFile(file, false)
      await scanner.clear().catch(() => {})
      readQrValue(decodedText, 'Image scan')
      setCameraMessage('QR image read successfully.')
    } catch (error) {
      setCameraMessage(error?.message || 'Could not read a QR from that image. Try a clearer photo or search by phone/email below.')
    } finally {
      event.target.value = ''
    }
  }

  const runManualCheck = () => {
    const cleaned = manualCode.trim()
    if (!cleaned) return
    readQrValue(cleaned, 'Manual entry')
  }

  const filteredStaffRequests = useMemo(() => {
    const search = requestSearch.trim().toLowerCase()
    const searchableItems = staffRequests.filter((item) => item.type !== 'error')
    if (!search) return searchableItems
    return searchableItems.filter((item) => [
      item.id,
      item.name,
      item.email,
      item.phone,
      item.ticketName,
      item.planName,
      item.visitDate,
      item.startDate,
      item.paymentMethod,
      item.status,
    ].some((value) => String(value || '').toLowerCase().includes(search)))
  }, [requestSearch, staffRequests])

  const requestErrors = staffRequests.filter((item) => item.type === 'error')

  const staffRequestDetails = (item) => ({
    type: 'magic_land_ticket',
    reference: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email,
    item: item.ticketName || item.planName || (item.type === 'membership' ? 'Membership request' : 'Ticket request'),
    visitDate: item.visitDate || item.startDate,
    quantity: item.guests || item.visits || '',
    amount: item.total || Number(String(item.price || '').replace(/[^\d]/g, '')) || '',
    paymentMethod: item.paymentMethod || 'pay_at_park',
    status: item.status || 'new',
  })

  const openStaffRequest = (item) => {
    const details = staffRequestDetails(item)
    setManualCode(item.id)
    setScanResult({
      code: item.id,
      status: 'Booking selected',
      message: 'Request loaded from staff list. Confirm guest identity before entry.',
      details,
    })
    trackEvent('staff_request_selected', { portal: mode, request_type: item.type, payment_method: details.paymentMethod })
  }

  const handleStaffLogin = async (event) => {
    event.preventDefault()
    setScanResult({ status: 'Signing in', message: 'Checking staff credentials...' })
    try {
      await signInWithEmail(loginForm.email, loginForm.password)
      setScanResult(null)
      trackEvent('staff_email_login_success', { portal: mode })
    } catch (error) {
      setScanResult({ status: 'Login failed', message: error?.message || 'Could not sign in with these staff credentials.' })
    }
  }

  if (loading) {
    return <InternalShell mode={mode}><div className="storybook-card rounded-[2rem] p-6">Checking staff access...</div></InternalShell>
  }

  if (!user) {
    return (
      <InternalShell mode={mode}>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
          <ShieldCheck className="text-[var(--secondary)]" />
          <h1 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">{isAdmin ? 'Admin login' : 'Staff check-in login'}</h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">Only approved Magic Land staff can access this internal tool.</p>
          <form className="mt-6 grid gap-4" onSubmit={handleStaffLogin}>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">
              Staff email
              <input
                className="soft-field"
                type="email"
                autoComplete="username"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="gate1@magiclandfunpark.com"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">
              Password
              <input
                className="soft-field"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Staff password"
                required
              />
            </label>
            <button className="sunset w-full rounded-full px-5 py-3 font-extrabold">Sign in</button>
          </form>
          {scanResult?.status === 'Login failed' && <p className="mt-4 rounded-2xl bg-[var(--surface-3)] p-4 text-sm font-bold leading-6 text-[var(--secondary)]">{scanResult.message}</p>}
        </div>
      </InternalShell>
    )
  }

  if (!allowed) {
    return (
      <InternalShell mode={mode}>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
          <ShieldCheck className="text-[var(--secondary)]" />
          <h1 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">Access not enabled</h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">This login is valid, but it is not listed as an active staff account for this portal.</p>
          <div className="mt-3 rounded-2xl bg-[var(--surface-3)] p-4 text-sm leading-6 text-[var(--primary)]">
            <p><span className="font-extrabold">Email:</span> {user.email || user.phoneNumber || '-'}</p>
            <p className="break-all"><span className="font-extrabold">Firebase UID:</span> {user.uid}</p>
            <p><span className="font-extrabold">Staff profile:</span> {profile && !profile.missing ? `Found in ${profile.collectionName}` : 'Not found'}</p>
            {profile && !profile.missing && <p><span className="font-extrabold">Active:</span> {String(profile.active)} · <span className="font-extrabold">Role:</span> {role || '-'}</p>}
            {profile?.missing && (
              <div className="mt-3 rounded-xl bg-white/70 p-3">
                {profile.errorMessage && <p className="mb-2 break-words font-bold text-[var(--secondary)]">{profile.errorCode ? `${profile.errorCode}: ` : ''}{profile.errorMessage}</p>}
                <p className="font-extrabold">Lookup attempts:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {profile.attempts?.map((attempt) => <li className="break-all" key={attempt}>{attempt}</li>)}
                </ul>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Create a Firestore document with this exact UID or the staff email as the document ID inside the `staff` collection, then set `active` to true and role to `entry_staff`.</p>
          <button className="mt-5 rounded-full border border-[var(--line)] bg-white px-5 py-3 font-extrabold text-[var(--primary)]" onClick={signOutUser}>Sign out</button>
        </div>
      </InternalShell>
    )
  }

  return (
    <InternalShell mode={mode} profile={profile}>
      {isAdmin ? (
        <AdminDashboard profile={profile} />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
            <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Gate scanner</p>
            <h1 className="font-display mt-2 text-4xl font-bold text-[var(--primary)]">Scan ticket or membership QR</h1>
            <div className="mt-6 overflow-hidden rounded-[2rem] border-2 border-dashed border-[var(--line)] bg-[var(--surface-3)] text-center">
              {cameraActive ? (
                <div id={scannerElementId} className="min-h-80 w-full overflow-hidden bg-black [&_video]:h-80 [&_video]:w-full [&_video]:object-cover" />
              ) : (
                <div className="p-8">
                  <Ticket className="mx-auto text-[var(--primary)]" size={48} />
                  <p className="mt-4 font-bold text-[var(--primary)]">Use staff phone camera to scan guest QR</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Works best on the secure staff domain. Manual lookup stays available for backup.</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="sunset rounded-full px-5 py-3 font-extrabold" type="button" onClick={startCameraScan} disabled={cameraActive}>Start camera scanner</button>
              <button className="rounded-full border border-[var(--line)] bg-white px-5 py-3 font-extrabold text-[var(--primary)]" type="button" onClick={() => fileInputRef.current?.click()}>Scan from photo</button>
              {cameraActive && <button className="rounded-full border border-[var(--line)] bg-white px-5 py-3 font-extrabold text-[var(--primary)]" type="button" onClick={stopCameraScan}>Stop scanner</button>}
            </div>
            <input ref={fileInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={scanQrImageFile} />
            <div id={fileScannerElementId} className="hidden" />
            {cameraMessage && <p className="mt-3 rounded-2xl bg-[var(--surface-3)] p-4 text-sm font-bold leading-6 text-[var(--secondary)]">{cameraMessage}</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input className="soft-field" value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="Paste or type QR code value" />
              <button className="sunset rounded-full px-5 py-3 font-extrabold" onClick={runManualCheck}>Validate</button>
            </div>
            <div className="mt-8 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Booking lookup</p>
                  <h2 className="font-display mt-1 text-2xl font-bold text-[var(--primary)]">Recent ticket and membership requests</h2>
                </div>
                <button
                  className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--primary)]"
                  type="button"
                  onClick={() => {
                    setRequestQueueMessage('Refreshing booking requests...')
                    getStaffRequestQueue().then((result) => {
                      setStaffRequests(result.items || [])
                      setRequestQueueMessage(result.error || '')
                    }).catch((error) => setRequestQueueMessage(error?.message || 'Could not refresh booking requests.'))
                  }}
                >
                  Refresh
                </button>
              </div>
              <input
                className="soft-field mt-4"
                value={requestSearch}
                onChange={(event) => setRequestSearch(event.target.value)}
                placeholder="Search by name, email, phone, ticket, or reference"
              />
              {requestQueueMessage && <p className="mt-3 rounded-2xl bg-[var(--surface-3)] p-3 text-sm font-bold text-[var(--secondary)]">{requestQueueMessage}</p>}
              {requestErrors.map((item) => (
                <p className="mt-3 rounded-2xl bg-[var(--surface-3)] p-3 text-sm font-bold text-[var(--secondary)]" key={item.id}>
                  {item.collectionName}: {item.errorCode} {item.errorMessage}
                  <span className="mt-1 block text-[var(--muted)]">If this says permission-denied, confirm this login has a matching active staff document in Firestore.</span>
                </p>
              ))}
              <div className="mt-4 grid max-h-[32rem] gap-3 overflow-y-auto pr-1">
                {filteredStaffRequests.slice(0, 60).map((item) => {
                  const title = item.ticketName || item.planName || (item.type === 'membership' ? 'Membership request' : 'Ticket request')
                  const displayDate = item.visitDate || item.startDate || '-'
                  const total = item.total || Number(String(item.price || '').replace(/[^\d]/g, '')) || 0
                  return (
                    <button
                      className="rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm transition hover:border-[var(--accent)]"
                      type="button"
                      key={`${item.collectionName}-${item.id}`}
                      onClick={() => openStaffRequest(item)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold uppercase text-[var(--secondary)]">{item.type === 'membership' ? 'Membership' : 'Ticket'} · {item.paymentMethod || 'pay_at_park'}</p>
                          <p className="mt-1 font-extrabold text-[var(--primary)]">{item.name || 'Guest'} · {title}</p>
                        </div>
                        <span className="rounded-full bg-[var(--surface-3)] px-3 py-1 text-xs font-extrabold text-[var(--primary)]">{item.status || 'new'}</span>
                      </div>
                      <div className="mt-3 grid gap-1 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2">
                        <p>{item.phone || '-'}</p>
                        <p className="break-all">{item.email || '-'}</p>
                        <p>Date: {displayDate}</p>
                        <p>{item.guests ? `${item.guests} guest${Number(item.guests) === 1 ? '' : 's'}` : item.visits || ''}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-sm">
                        <span className="break-all text-[var(--muted)]">{item.id}</span>
                        <span className="font-extrabold text-[var(--primary)]">{total ? `Rs. ${Number(total).toLocaleString('en-IN')}` : 'Pay at park'}</span>
                      </div>
                    </button>
                  )
                })}
                {!requestQueueMessage && filteredStaffRequests.length === 0 && (
                  <p className="rounded-2xl bg-white p-4 text-sm font-bold text-[var(--muted)]">No matching requests found.</p>
                )}
              </div>
            </div>
          </div>
          <aside className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-[var(--primary)]">Validation result</h2>
            {scanResult ? (
              <div className="mt-5 rounded-2xl bg-[var(--surface-3)] p-4">
                <p className="text-xs font-extrabold uppercase text-[var(--secondary)]">{scanResult.status}</p>
                <p className="mt-2 break-words font-bold text-[var(--primary)]">{scanResult.code}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{scanResult.message}</p>
                {scanResult.details && (
                  <dl className="mt-4 grid gap-2 text-sm">
                    {[
                      ['Name', scanResult.details.name],
                      ['Item', scanResult.details.item],
                      ['Date', scanResult.details.visitDate],
                      ['Entries', scanResult.details.quantity],
                      ['Amount', scanResult.details.amount ? `Rs. ${Number(scanResult.details.amount).toLocaleString('en-IN')}` : 'Pay at park'],
                      ['Phone', scanResult.details.phone],
                      ['Email', scanResult.details.email],
                    ].filter(([, value]) => value !== undefined && value !== '').map(([label, value]) => (
                      <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2" key={label}>
                        <dt className="text-[var(--muted)]">{label}</dt>
                        <dd className="text-right font-bold text-[var(--primary)]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <button disabled className="mt-4 w-full rounded-full bg-[var(--primary)] px-5 py-3 font-extrabold text-white opacity-50">Check in</button>
              </div>
            ) : (
              <p className="mt-4 leading-7 text-[var(--muted)]">Scan a QR or enter a code to see ticket details here.</p>
            )}
            <div className="mt-6 rounded-2xl border border-[var(--line)] p-4 text-sm leading-6 text-[var(--muted)]">
              <p className="font-extrabold text-[var(--primary)]">Signed in as</p>
              <p>{profile?.name || user.email || user.phoneNumber}</p>
              <p className="mt-2">Role: {profile?.role}</p>
            </div>
          </aside>
        </section>
      )}
    </InternalShell>
  )
}

function InternalShell({ mode, profile, children }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--line)] bg-[rgba(251,248,255,0.96)] px-4 py-4 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <BrandLockup />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[var(--surface-3)] px-4 py-2 text-sm font-extrabold text-[var(--primary)] sm:inline-flex">{mode === 'admin' ? 'Admin Portal' : 'Staff Portal'}</span>
            {profile && <button className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--primary)]" onClick={signOutUser}>Sign out</button>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">{children}</main>
    </div>
  )
}

function AdminDashboard({ profile }) {
  const cards = [
    ['Today check-ins', 'Coming next', 'Live count from checkIns collection.'],
    ['Ticket sync', 'Coming next', 'Firebase to local server sync status.'],
    ['Memberships', 'Coming next', 'Active passes, remaining credits, and renewals.'],
  ]
  return (
    <section>
      <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Admin dashboard</p>
      <h1 className="font-display mt-2 text-4xl font-bold text-[var(--primary)]">Magic Land operations overview</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">Protected management space for reports, staff activity, memberships, and local-server sync.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map(([title, value, copy]) => (
          <article key={title} className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-sm">
            <p className="text-sm font-extrabold uppercase text-[var(--secondary)]">{title}</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-[var(--primary)]">{value}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{copy}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 rounded-[2rem] border border-[var(--line)] bg-white p-5 text-sm leading-6 text-[var(--muted)] shadow-sm">
        Signed in as <strong className="text-[var(--primary)]">{profile?.name || profile?.email || 'Admin'}</strong>. Role: <strong className="text-[var(--primary)]">{profile?.role}</strong>.
      </div>
    </section>
  )
}

function Header({ page, setPage, menuOpen, setMenuOpen }) {
  const { user } = useAuthUser()
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(198,197,209,0.55)] bg-[rgba(251,248,255,0.94)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        <button className="flex items-center text-left" onClick={() => setPage('home')} aria-label="Magic Land Family Fun Park home">
          <BrandLockup />
        </button>
        <nav className="hidden items-center gap-1 xl:flex">
          {[...nav.slice(0, 6), ...moreNav.slice(0, 2)].map((item) => (
            <button key={item.id} onClick={() => setPage(item.id)} className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${page === item.id ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-white hover:text-[var(--primary)]'}`}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button className="sunset hidden rounded-full px-5 py-3 text-sm font-extrabold shadow-sm md:inline-flex" onClick={() => setPage('tickets')}>
            Buy Tickets
          </button>
          <button
            className="hidden rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-extrabold text-[var(--primary)] shadow-sm md:inline-flex"
            onClick={() => setPage('account')}
          >
            {user ? 'Account' : 'Login'}
          </button>
          <button
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--primary)] shadow-sm xl:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="mx-auto grid max-h-[calc(100dvh-5rem)] max-w-7xl gap-2 overflow-y-auto px-4 pb-24 md:grid-cols-3 md:px-8 xl:hidden">
          {[...nav, ...moreNav].filter((item) => item.id !== 'more').map((item) => (
            <button key={item.id} className="rounded-2xl bg-white px-4 py-3 text-left font-bold text-[var(--primary)]" onClick={() => { setPage(item.id); setMenuOpen(false) }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

function HomePage({ setPage }) {
  const weather = useParkWeather()
  const liveStatus = useLiveParkStatus()
  const quickActions = [
    [CalendarDays, 'Today at Magic Land', 'Hours, shows, and events', 'events'],
    [Crown, 'Membership Credits', '5 visits from Rs. 2,999', 'memberships'],
    [PartyPopper, 'Birthday Packages', 'Kids, teens, schools, families', 'birthdays'],
    [MapIcon, 'Directions', 'Open route from your location', 'map'],
  ]

  return (
    <>
      <section className="relative hidden h-[760px] w-full overflow-hidden md:block">
        <img src={img.hero} alt="Magic Land Family Fun Park castle" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,13,70,0.78)] via-[rgba(3,13,70,0.18)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 md:px-8 md:pb-16">
          <div className="max-w-xl text-white">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--gold-soft)]">Now open</p>
            <h1 className="font-display text-6xl font-bold leading-tight">A Place Where Kids Laugh, Families Bond, and Memories Become Magic</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/88">Magic Land Family Fun Park is a place where kids laugh, families bond, and memories become magic through exceptional hospitality and a welcoming experience for everyone.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="sunset rounded-full px-8 py-4 text-lg font-extrabold shadow-xl" onClick={() => setPage('tickets')}>Book Quest</button>
              <button className="rounded-full border-2 border-white/40 bg-white/10 px-8 py-4 text-lg font-extrabold text-white backdrop-blur-sm" onClick={() => setPage('events')}>View Events</button>
            </div>
          </div>
        </div>
      </section>

      <section className="md:hidden">
        <div className="relative h-[480px] w-full overflow-hidden">
          <img src={img.mobileHero} alt="Magic Land castle" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,13,70,0.82)] via-[rgba(3,13,70,0.2)] to-transparent" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 space-y-4 p-4 text-left text-white">
            <h1 className="font-display max-w-[330px] text-2xl font-bold leading-tight">Kids Laugh. Families Bond. Memories Become Magic.</h1>
            <p className="max-w-[330px] text-sm font-semibold leading-6 text-white/88">A joyful family park with VR games, rides, creative play, exceptional hospitality, and a welcoming experience for everyone.</p>
            <div className="flex flex-wrap gap-3">
              <button className="sunset inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold shadow-lg" onClick={() => setPage('tickets')}>
                Buy Tickets
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/18 px-5 py-3 text-sm font-extrabold text-white backdrop-blur-sm" onClick={() => setPage('attractions')}>
                Explore Park
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-4 -mt-12 rounded-xl border border-[rgba(198,197,209,0.45)] bg-white p-4 shadow-xl shadow-[rgba(27,36,90,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[rgba(31,139,234,0.14)] text-[#1F8BEA]">
                <Clock3 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1F8BEA]" />
                  <span className="text-sm font-extrabold uppercase text-[#1F8BEA]">{liveStatus.operatingStatus}</span>
                </div>
                <p className="text-sm font-bold text-[var(--muted)]">{liveStatus.hours}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-[var(--primary)]">{weather.temp}C</div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{weather.label}</p>
            </div>
          </div>
        </div>

        <section className="px-4 pt-5">
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map(([Icon, title, sub, target]) => (
              <button key={title} onClick={() => setPage(target)} className="rounded-xl bg-[var(--surface-3)] p-4 text-left shadow-md shadow-[rgba(27,36,90,0.08)] transition active:scale-95">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary-2)] text-white">
                  <Icon size={20} />
                </div>
                <span className="mt-3 block text-sm font-extrabold text-[var(--ink)]">{title}</span>
                <span className="mt-1 block text-xs font-semibold text-[var(--muted)]">{sub}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="px-4 py-5">
          <h2 className="font-display mb-4 text-2xl font-bold text-[var(--primary)]">Magic Moment</h2>
          <button onClick={() => setPage('events')} className="relative h-48 w-full overflow-hidden rounded-xl text-left shadow-lg">
            <img src={img.mobileMoment} alt="Night parade at Magic Land" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[rgba(0,0,0,0.42)]" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#ffdad6]">Main Boulevard</p>
                  <h3 className="font-display text-2xl font-bold">Night Parade</h3>
                </div>
                <span className="font-display text-2xl font-bold">8:30 PM</span>
              </div>
            </div>
            <span className="absolute right-4 top-4 rounded-full bg-[rgba(239,43,90,0.92)] px-3 py-1 text-xs font-extrabold text-white">Featured</span>
          </button>
        </section>
      </section>

      <div className="hidden md:block">
        <DesktopAttractions setPage={setPage} />
        <StatusStrip />
      </div>
      <InsideMagicLand setPage={setPage} />
      <GardenPondFeature setPage={setPage} />
      <MembershipTeaser setPage={setPage} />
      <div className="hidden md:block">
        <MapTeaser setPage={setPage} />
      </div>
    </>
  )
}

function MembershipTeaser({ setPage }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-14">
      <div className="grid gap-5 rounded-[2rem] border border-[rgba(198,197,209,0.55)] bg-white p-5 shadow-sm md:grid-cols-[1fr_360px] md:p-8">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Membership Program</p>
          <h2 className="font-display mt-2 max-w-3xl text-3xl font-bold leading-tight text-[var(--primary)] md:text-4xl">5 visit credits for Rs. 2,999.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">A safer, smarter membership model built to increase repeat visits, food spending, arcade play, activities, and long-term customer loyalty.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {['5 visit credits', '3 months validity', 'Use it before expiry'].map((item) => <span key={item} className="rounded-full bg-[var(--surface-3)] px-4 py-2 text-sm font-extrabold text-[var(--primary)]">{item}</span>)}
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-[var(--primary)] p-5 text-white">
          <p className="text-sm font-extrabold uppercase text-[#ffdad6]">Family Magic Pass</p>
          <p className="font-display mt-2 text-4xl font-bold">Rs. 9,499</p>
          <p className="mt-2 text-sm font-semibold text-white/82">4 members, 20 shared visit credits, about Rs. 475 per visit.</p>
          <button className="sunset mt-5 w-full rounded-full px-5 py-3 font-extrabold" onClick={() => setPage('memberships')}>Compare Savings</button>
        </div>
      </div>
    </section>
  )
}

function InsideMagicLand({ setPage }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-14">
      <SectionIntro eyebrow="What's inside" title="Experience zones, creative village, and photo-friendly garden moments" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {zoneCards.map(({ title, zone, icon: Icon, image, copy }) => (
          <button key={title} onClick={() => setPage('attractions')} className="storybook-card group overflow-hidden rounded-[1.5rem] text-left shadow-sm transition hover:-translate-y-1">
            <div className="relative h-40 overflow-hidden">
              <SmartImage src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <span className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-[var(--primary)] shadow-sm">
                <Icon size={19} />
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--secondary)]">{zone}</p>
              <h3 className="font-display mt-1 text-xl font-bold text-[var(--primary)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function GardenPondFeature({ setPage }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-14">
      <div className="grid overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-xl md:grid-cols-[1.15fr_0.85fr]">
        <SmartImage src={img.sevenStonesPond} alt="Seven Color Garden Pond" className="h-72 w-full object-cover md:h-full" />
        <div className="p-6 md:p-8">
          <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Garden Pond Feature</p>
          <h2 className="font-display mt-2 text-3xl font-bold leading-tight text-[var(--primary)] md:text-4xl">Seven colored stones, fountain jets, and a garden pond photo spot.</h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">Inspired by the colorful stacked-stone landmark near Las Vegas, Magic Land can make this its own family-friendly garden moment with water, lights, seating, and photo points.</p>
          <button className="sunset mt-6 rounded-full px-6 py-4 font-extrabold shadow-sm" onClick={() => setPage('attractions')}>Explore Garden Feature</button>
        </div>
      </div>
    </section>
  )
}

function DesktopAttractions({ setPage }) {
  const [selectedDay, setSelectedDay] = useState('Today')
  const daySlots = {
    Today: ['10:30 AM', '01:30 PM'],
    Tomorrow: ['11:00 AM', '03:00 PM'],
    '16 May': ['12:00 PM', '04:30 PM'],
    '17 May': ['10:00 AM', '05:00 PM'],
  }
  return (
    <section className="bg-[var(--surface-2)] py-14">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[var(--secondary)]">
              <Sparkles />
              <h2 className="font-display text-4xl font-bold text-[var(--primary)]">VR Games, Rides & Family Fun</h2>
            </div>
            <p className="mt-3 text-[var(--muted)]">From VR bikes and cars to pool, shooting games, arcade challenges, and family-friendly rides.</p>
          </div>
          <div className="flex gap-2">
            {Object.keys(daySlots).map((day) => (
              <button key={day} onClick={() => setSelectedDay(day)} className={`rounded-lg px-5 py-3 text-sm font-bold ${selectedDay === day ? 'bg-[var(--primary)] text-white' : 'border border-[var(--line)] bg-white text-[var(--muted)]'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5 flex gap-5 text-xs font-bold uppercase text-[var(--muted)]">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[var(--secondary)]" /> High thrill</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#1F8BEA]" /> Family friendly</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[var(--line)]" /> Shows</span>
        </div>
        <div className="grid grid-cols-5 gap-5">
          {attractionList.slice(0, 10).map((ride) => (
            <button key={ride.name} onClick={() => setPage('attractions')} className="group text-left">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-lg transition duration-300 group-hover:-translate-y-2">
                <SmartImage src={ride.image} alt={ride.name} className="h-full w-full object-cover" />
                <span className="absolute right-3 top-3 rounded-full bg-white/92 px-3 py-2 text-xs font-extrabold text-[var(--primary)] shadow-sm">{ride.height === 'All ages' ? 'U' : 'PG'}</span>
              </div>
              <h3 className="font-display mt-4 truncate text-2xl font-bold text-[var(--primary)]">{ride.name}</h3>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{ride.wait} | {ride.category}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {daySlots[selectedDay].map((slot) => <span key={slot} className="rounded-md border border-[var(--line)] px-3 py-1 text-xs font-bold text-[var(--primary)]">{slot}</span>)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatusStrip() {
  const weather = useParkWeather()
  const liveStatus = useLiveParkStatus()
  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 rounded-3xl border border-[rgba(198,197,209,0.55)] bg-white p-4 shadow-xl shadow-[rgba(27,36,90,0.08)] md:grid-cols-4 md:gap-4 md:p-5">
        {[
          [liveStatus.operatingStatus, liveStatus.hours, Clock3],
          ['Avg. Wait', liveStatus.avgWait, FerrisWheel],
          ['Weather', `${weather.temp}C - ${weather.label}`, MapPin],
          ['Next Show', liveStatus.nextShow, Sparkles],
        ].map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl bg-[var(--surface-2)] p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-3)] text-[var(--secondary)]">
              <Icon size={20} />
            </div>
            <p className="mt-3 text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
            <p className="font-display mt-1 text-xl font-bold text-[var(--primary)]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function AttractionsPage({ setPage }) {
  const [activeZone, setActiveZone] = useState('All')
  const chooseZone = (zone) => {
    setActiveZone(zone)
    trackEvent('attraction_filter_select', { zone })
  }
  return (
    <PageShell eyebrow="Attractions" title="VR games, skill games, rides, and family fun">
      <div className="mb-7 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {zoneFilters.map((zone) => (
          <button
            key={zone}
            onClick={() => chooseZone(zone)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold transition ${activeZone === zone ? 'bg-[var(--primary)] text-white' : 'border border-[var(--line)] bg-white text-[var(--muted)]'}`}
          >
            {zone}
          </button>
        ))}
      </div>
      <AttractionGrid activeZone={activeZone} setPage={setPage} />
    </PageShell>
  )
}

function AttractionGrid({ compact = false, activeZone = 'All', setPage }) {
  const visibleAttractions = attractionList.filter((ride) => activeZone === 'All' || ride.zone === activeZone)
  return (
    <section className={`mx-auto max-w-7xl px-4 ${compact ? 'py-12' : ''} md:px-8`}>
      {compact && <SectionIntro eyebrow="Attractions" title="VR games and rides for every age group" />}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {visibleAttractions.map((ride, index) => (
          <article key={ride.name} className={`storybook-card group rounded-[2rem] p-4 shadow-sm transition hover:-translate-y-1 ${index === 1 ? 'lg:mt-8' : ''}`}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
              <SmartImage src={ride.image} alt={ride.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <span className="absolute right-3 top-3 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold text-white">{ride.category}</span>
            </div>
            <h3 className="font-display mt-4 text-xl font-bold text-[var(--primary)] md:text-2xl">{ride.name}</h3>
            <p className="mt-2 min-h-16 text-sm leading-6 text-[var(--muted)]">{ride.copy}</p>
            {!compact && <p className="mt-3 rounded-full bg-[var(--surface-3)] px-3 py-2 text-xs font-extrabold text-[var(--primary)]">Best for: {ride.bestFor}</p>}
            <div className="mt-4 flex justify-between border-t border-[var(--line)] pt-4 text-xs font-extrabold text-[var(--secondary)]">
              <span>{ride.wait}</span>
              <span>{ride.height}</span>
            </div>
            {!compact && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="sunset rounded-full px-4 py-2 text-sm font-extrabold" onClick={() => { trackEvent('attraction_book_click', { attraction_name: ride.name, zone: ride.zone }); setPage?.('tickets') }}>Book Game</button>
                <button className="rounded-full border border-[var(--line)] bg-[var(--surface-3)] px-4 py-2 text-sm font-extrabold text-[var(--primary)]" onClick={() => { trackEvent('attraction_membership_click', { attraction_name: ride.name, zone: ride.zone }); setPage?.('memberships') }}>Use Membership</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function TicketsPage({ setPage }) {
  const [selected, setSelected] = useState(ticketOptions[0])
  const [form, setForm] = useState({ name: '', phone: '', email: '', visitDate: '', guests: ticketOptions[0].defaultGuests })
  const [paymentMethod, setPaymentMethod] = useState('khalti')
  const [status, setStatus] = useState({ type: '', message: '' })
  const checkoutRef = useRef(null)
  const guests = Math.max(Number(form.guests) || selected.defaultGuests || 1, 1)
  const priceBreakdown = ticketPriceBreakdown(selected, guests)
  const total = priceBreakdown.total
  const updateForm = (field, value) => {
    const nextValue = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value
    setForm((current) => ({ ...current, [field]: nextValue }))
  }
  const chooseTicket = (ticket) => {
    setSelected(ticket)
    setStatus({ type: '', message: '' })
    setForm((current) => ({ ...current, guests: ticket.defaultGuests || 1 }))
    trackEvent('ticket_select', { ticket_name: ticket.name, price: ticket.price })
    window.requestAnimationFrame(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const submitBooking = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payloadGuests = Math.max(Number(formData.get('guests')) || guests, selected.defaultGuests || 1)
    const payloadBreakdown = ticketPriceBreakdown(selected, payloadGuests)
    const payloadTotal = payloadBreakdown.total

    setStatus({ type: 'loading', message: paymentMethod === 'khalti' ? 'Saving booking and opening Khalti...' : paymentMethod === 'esewa' ? 'Saving booking and opening eSewa...' : 'Sending your booking request...' })
    try {
      const result = await createPublicRequest('bookingRequests', {
        name: String(formData.get('name') || form.name).trim(),
        phone: String(formData.get('phone') || form.phone).trim(),
        email: String(formData.get('email') || form.email).trim(),
        ticketName: selected.name,
        unitPrice: selected.price,
        guests: payloadGuests,
        visitDate: String(formData.get('visitDate') || form.visitDate).trim(),
        note: payloadBreakdown.discount ? `Group discount applied: ${Math.round(payloadBreakdown.discountRate * 100)}% (Rs. ${payloadBreakdown.discount.toLocaleString()})` : '',
        total: payloadTotal,
        paymentMethod,
      })
      trackEvent('booking_request_submitted', {
        ticket_name: selected.name,
        guests: payloadGuests,
        total: payloadTotal,
        store: result.store,
        payment_method: paymentMethod,
      })
      if (paymentMethod === 'khalti' || paymentMethod === 'esewa') {
        const paymentPayload = {
          amount: payloadTotal,
          purchaseOrderId: result.id,
          purchaseOrderName: selected.name,
          productType: 'ticket',
          guests: payloadGuests,
          customerInfo: {
            name: String(formData.get('name') || form.name).trim(),
            phone: String(formData.get('phone') || form.phone).trim(),
            email: String(formData.get('email') || form.email).trim(),
          },
        }
        if (paymentMethod === 'khalti') {
          trackEvent('payment_checkout_click', {
            gateway: 'khalti',
            ticket_name: selected.name,
            total: payloadTotal,
            request_id: result.id,
          })
          const payment = await initiateKhaltiPayment(paymentPayload)
          try {
            sessionStorage.setItem('magicland:pendingPayment', JSON.stringify({
              gateway: 'khalti',
              bookingId: result.id,
              ticketName: selected.name,
              amount: payloadTotal,
              guests: payloadGuests,
              name: String(formData.get('name') || form.name).trim(),
              phone: String(formData.get('phone') || form.phone).trim(),
              email: String(formData.get('email') || form.email).trim(),
            }))
          } catch {
            // Payment can continue even if browser storage is unavailable.
          }
          trackEvent('khalti_payment_initiated', {
            ticket_name: selected.name,
            total: payloadTotal,
            request_id: result.id,
          })
          window.location.href = payment.payment_url
          return
        }

        trackEvent('payment_checkout_click', {
          gateway: 'esewa',
          ticket_name: selected.name,
          total: payloadTotal,
          request_id: result.id,
        })
        const payment = await initiateEsewaPayment(paymentPayload)
        try {
          sessionStorage.setItem('magicland:pendingPayment', JSON.stringify({
            gateway: 'esewa',
            bookingId: result.id,
            ticketName: selected.name,
            amount: payloadTotal,
            guests: payloadGuests,
            name: String(formData.get('name') || form.name).trim(),
            phone: String(formData.get('phone') || form.phone).trim(),
            email: String(formData.get('email') || form.email).trim(),
          }))
        } catch {
          // Payment can continue even if browser storage is unavailable.
        }
        trackEvent('esewa_payment_initiated', {
          ticket_name: selected.name,
          total: payloadTotal,
          request_id: result.id,
        })
        submitEsewaForm(payment)
        return
      }
      const thankYouDetails = {
        title: 'Booking request received',
        message: result.offline
          ? 'Saved in local preview. Add Firebase app config to send this to the console.'
          : 'Thank you. Magic Land will confirm your visit by phone or email.',
        requestId: result.id,
        paymentMethod,
        ticketName: selected.name,
        total: payloadTotal,
      }
      try {
        sessionStorage.setItem('magicland:thankYou', JSON.stringify(thankYouDetails))
      } catch {
        // Thank-you page can still render its default copy if session storage is blocked.
      }
      trackEvent('booking_thank_you_view_ready', {
        request_id: result.id,
        ticket_name: selected.name,
        total: payloadTotal,
      })
      setStatus({ type: 'success', message: thankYouDetails.message })
      setForm({ name: '', phone: '', email: '', visitDate: '', guests: selected.defaultGuests || 1 })
      setPage('thankYou')
    } catch (error) {
      console.error('Booking request failed', error)
      setStatus({
        type: 'error',
        message: paymentMethod === 'khalti' || paymentMethod === 'esewa'
          ? `${error?.message || 'Payment gateway could not be opened.'} You can choose "Reserve, pay at park" for local testing.`
          : 'Could not submit right now. Please try again or contact Magic Land.',
      })
    }
  }

  return (
    <PageShell eyebrow="Tickets" title="Day tickets for a simple Magic Land visit">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="grid content-start gap-4">
          <div className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-sm">
            <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Quick visit</p>
            <h2 className="font-display mt-2 text-2xl font-bold text-[var(--primary)] md:text-3xl">Buy entry for today, a planned date, or a group outing.</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Use this page for regular tickets. If your family plans to visit again and again, memberships are handled separately so the value and shared-visit rules stay clear.</p>
            <button type="button" className="mt-4 rounded-full border border-[var(--line)] bg-[var(--surface-3)] px-5 py-3 text-sm font-extrabold text-[var(--primary)]" onClick={() => setPage('memberships')}>
              See membership plans
            </button>
          </div>
          {ticketOptions.map((ticket) => (
            <button key={ticket.name} onClick={() => chooseTicket(ticket)} className={`storybook-card rounded-[2rem] p-5 text-left transition ${selected.name === ticket.name ? 'ring-4 ring-[#bbc3ff]' : ''}`}>
              <Ticket className="text-[var(--secondary)]" />
              <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">{ticket.name}</h3>
              <p className="mt-2 text-2xl font-extrabold">Rs. {ticket.price.toLocaleString()}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{ticket.detail}</p>
              {ticket.name === 'Group Day Visit' && <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-[var(--primary)]">Starts at 10 guests. Final coordination can happen by phone.</p>}
              {ticket.name === 'Group Day Visit' && <p className="mt-2 rounded-2xl bg-[var(--surface-3)] px-3 py-2 text-xs font-extrabold text-[var(--secondary)]">5% off for 6-9 guests. 10% off for 10+ guests.</p>}
            </button>
          ))}
        </div>
        <form ref={checkoutRef} id="ticket-checkout" onSubmit={submitBooking} className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--surface-3)] text-[var(--primary)]">
              <Ticket size={21} />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--muted)]">Quick booking</p>
              <h3 className="font-display text-2xl font-bold text-[var(--primary)]">Reserve in one step</h3>
              <p className="mt-1 text-xs font-bold text-[var(--muted)]">{selected.name} selected</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Full name<input name="name" required value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="soft-field" placeholder="Parent or guest name" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Phone number<input name="phone" required type="tel" inputMode="numeric" pattern="[0-9]{10}" minLength="10" maxLength="10" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="soft-field" placeholder="98XXXXXXXX" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Email address<input name="email" required type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className="soft-field" placeholder="guest@example.com" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Visit date<input name="visitDate" required type="date" value={form.visitDate} onChange={(e) => updateForm('visitDate', e.target.value)} className="soft-field" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Guests<input name="guests" type="number" min={selected.defaultGuests || 1} max="50" value={form.guests} onChange={(e) => updateForm('guests', e.target.value)} className="soft-field" /></label>
            <div className="grid gap-2 text-sm font-bold text-[var(--primary)]">
              Payment option
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ['khalti', 'Pay now with Khalti'],
                  ['esewa', 'Pay now with eSewa'],
                  ['pay_at_park', 'Reserve, pay at park'],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => { setPaymentMethod(value); trackEvent('payment_method_select', { method: value }) }}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-extrabold ${paymentMethod === value ? 'border-[var(--secondary)] bg-[var(--surface-3)] text-[var(--primary)]' : 'border-[var(--line)] bg-white text-[var(--muted)]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white p-4 text-sm font-bold shadow-sm">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--muted)]">Price summary</p>
              {priceBreakdown.isGroupPrice && selected.name !== 'Group Day Visit' && (
                <p className="mb-3 rounded-2xl bg-[var(--surface-3)] px-3 py-2 text-xs font-extrabold leading-5 text-[var(--primary)]">
                  Group pricing applied because this booking has more than 5 guests.
                </p>
              )}
              <Line label={`${priceBreakdown.isGroupPrice ? 'Group Day Visit' : selected.name} (${guests} x Rs. ${selected.price.toLocaleString()})`} value={`Rs. ${priceBreakdown.subtotal.toLocaleString()}`} />
              {priceBreakdown.discount > 0 && <Line label={`Group discount (${Math.round(priceBreakdown.discountRate * 100)}%)`} value={`- Rs. ${priceBreakdown.discount.toLocaleString()}`} />}
              <Line label="Guests" value={guests} />
              <Line label="Total" value={`Rs. ${total.toLocaleString()}`} strong />
            </div>
            <button disabled={status.type === 'loading'} className="sunset rounded-full px-6 py-4 font-extrabold shadow-sm disabled:opacity-70">{status.type === 'loading' ? 'Processing...' : paymentMethod === 'khalti' ? 'Continue to Khalti' : paymentMethod === 'esewa' ? 'Continue to eSewa' : 'Reserve Visit'}</button>
            {status.message && <p className={`text-sm font-bold leading-6 ${status.type === 'error' ? 'text-[var(--secondary)]' : 'text-[var(--primary)]'}`}>{status.message}</p>}
            <p className="text-xs leading-5 text-[var(--muted)]">No account needed for day tickets. Keep your phone and email reachable for payment and visit confirmation.</p>
          </div>
        </form>
      </div>
    </PageShell>
  )
}

function MembershipPage({ setPage }) {
  const { user, loading: authLoading } = useAuthUser()
  const [selectedPlan, setSelectedPlan] = useState(membershipPlans[0].name)
  const [form, setForm] = useState({ name: '', phone: '', email: '', startDate: '', familyMembers: '', additionalMembers: 0, note: '' })
  const [paymentMethod, setPaymentMethod] = useState('khalti')
  const [status, setStatus] = useState({ type: '', message: '' })
  const activePlan = membershipPlans.find((plan) => plan.name === selectedPlan) ?? membershipPlans[0]
  const membershipBreakdown = membershipPriceBreakdown(activePlan, form.additionalMembers)
  const emailNeedsVerification = Boolean(user?.email && user?.providerData?.some((provider) => provider.providerId === 'password') && !user.emailVerified)
  const choosePlan = (planName) => {
    setSelectedPlan(planName)
    setStatus({ type: '', message: '' })
    trackEvent('membership_plan_select', { plan_name: planName })
    window.requestAnimationFrame(() => document.getElementById('membership-booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const updateForm = (field, value) => {
    const nextValue = field === 'phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : field === 'additionalMembers'
        ? Math.max(Number(value) || 0, 0)
        : value
    setForm((current) => ({ ...current, [field]: nextValue }))
  }

  const submitMembership = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const additionalMembers = Math.max(Number(formData.get('additionalMembers')) || 0, 0)
    const checkoutBreakdown = membershipPriceBreakdown(activePlan, additionalMembers)
    const checkoutTotal = checkoutBreakdown.total
    const wantsOnlinePayment = paymentMethod === 'khalti' || paymentMethod === 'esewa'
    if (wantsOnlinePayment && !user) {
      setStatus({
        type: 'error',
        message: 'Please login or create a Magic Land account before online membership payment.',
      })
      trackEvent('membership_online_payment_auth_required', { payment_method: paymentMethod, plan_name: activePlan.name })
      return
    }
    if (wantsOnlinePayment && emailNeedsVerification) {
      setStatus({
        type: 'error',
        message: 'Please verify your email before online payment. Check your inbox, then return here to continue.',
      })
      trackEvent('membership_online_payment_email_verification_required', { payment_method: paymentMethod, plan_name: activePlan.name })
      return
    }

    setStatus({ type: 'loading', message: wantsOnlinePayment ? `Saving membership and opening ${paymentMethod === 'khalti' ? 'Khalti' : 'eSewa'}...` : 'Sending your membership request...' })
    try {
      const result = await createPublicRequest('membershipRequests', {
        name: String(formData.get('name') || form.name).trim(),
        phone: String(formData.get('phone') || form.phone).trim(),
        email: String(formData.get('email') || form.email).trim(),
        planName: checkoutBreakdown.standardPlan.name,
        price: `Rs. ${checkoutTotal.toLocaleString()}`,
        visits: checkoutBreakdown.standardPlan.entries,
        validity: checkoutBreakdown.standardPlan.perVisit,
        startDate: String(formData.get('startDate') || form.startDate).trim(),
        familyMembers: String(formData.get('familyMembers') || form.familyMembers).trim(),
        note: [
          checkoutBreakdown.standardPlan.name !== activePlan.name ? `Auto-adjusted to ${checkoutBreakdown.standardPlan.name} for ${checkoutBreakdown.totalMembers} members` : '',
          checkoutBreakdown.addOnMembers ? `Additional members: ${checkoutBreakdown.addOnMembers} x Rs. ${membershipAddOnPrice.toLocaleString()} = Rs. ${checkoutBreakdown.addOnTotal.toLocaleString()}` : '',
          String(formData.get('note') || form.note).trim(),
        ].filter(Boolean).join(' | '),
        paymentMethod,
      })
      trackEvent('membership_request_submitted', {
        plan_name: checkoutBreakdown.standardPlan.name,
        price: `Rs. ${checkoutTotal.toLocaleString()}`,
        visits: checkoutBreakdown.standardPlan.entries,
        total_members: checkoutBreakdown.totalMembers,
        additional_members: checkoutBreakdown.addOnMembers,
        store: result.store,
        payment_method: paymentMethod,
      })
      if (wantsOnlinePayment) {
        const paymentPayload = {
          amount: checkoutTotal,
          purchaseOrderId: result.id,
          purchaseOrderName: checkoutBreakdown.addOnMembers ? `${checkoutBreakdown.standardPlan.name} + ${checkoutBreakdown.addOnMembers} member add-on` : checkoutBreakdown.standardPlan.name,
          productType: 'membership',
          totalMembers: checkoutBreakdown.totalMembers,
          customerInfo: {
            name: String(formData.get('name') || form.name).trim(),
            phone: String(formData.get('phone') || form.phone).trim(),
            email: String(formData.get('email') || form.email).trim(),
          },
        }
        const pendingPayment = {
          gateway: paymentMethod,
          bookingId: result.id,
          ticketName: checkoutBreakdown.standardPlan.name,
          amount: checkoutTotal,
          guests: checkoutBreakdown.totalMembers,
          name: paymentPayload.customerInfo.name,
          phone: paymentPayload.customerInfo.phone,
          email: paymentPayload.customerInfo.email,
          requestType: 'membership',
        }
        try {
          sessionStorage.setItem('magicland:pendingPayment', JSON.stringify(pendingPayment))
        } catch {
          // Payment can continue even if browser storage is unavailable.
        }
        trackEvent('membership_payment_checkout_click', {
          gateway: paymentMethod,
          plan_name: checkoutBreakdown.standardPlan.name,
          total: checkoutTotal,
          total_members: checkoutBreakdown.totalMembers,
          additional_members: checkoutBreakdown.addOnMembers,
          request_id: result.id,
        })
        if (paymentMethod === 'khalti') {
          const payment = await initiateKhaltiPayment(paymentPayload)
          window.location.assign(payment.payment_url)
          return
        }
        const payment = await initiateEsewaPayment(paymentPayload)
        submitEsewaForm(payment)
        return
      }
      setStatus({
        type: 'success',
        message: result.offline
          ? 'Saved in local preview. Add Firebase app config to send this to the console.'
          : 'Membership request received. Magic Land will confirm activation by phone.',
      })
      setForm({ name: '', phone: '', email: '', startDate: '', familyMembers: '', additionalMembers: 0, note: '' })
    } catch (error) {
      console.error('Membership request failed', error)
      setStatus({
        type: 'error',
        message: wantsOnlinePayment
          ? `${error?.message || 'Payment gateway could not be opened.'} You can choose "Reserve, pay at park" for local testing.`
          : 'Could not submit right now. Please try again or contact Magic Land.',
      })
    }
  }

  return (
    <PageShell eyebrow="Membership" title="Memberships that make repeat visits simple">
      <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_380px]">
          <div className="p-6 md:p-8 lg:p-10">
            <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">3 month visit credits</p>
            <h2 className="font-display mt-3 max-w-3xl text-3xl font-bold leading-tight text-[var(--primary)] md:text-5xl">More visits. Clear credits. Better family value.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">Pick a plan, add members if needed, and see the exact math before payment. One visit credit always equals one person entry.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['From', 'Rs. 2,999'],
                ['Validity', '3 months'],
                ['Pay with', 'Khalti or eSewa'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[var(--surface-3)] px-4 py-3">
                  <span className="block text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">{label}</span>
                  <span className="font-display text-xl font-bold text-[var(--primary)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid content-center gap-3 bg-[var(--surface-3)] p-6">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--secondary)]">How it works</p>
              <h3 className="font-display mt-2 text-2xl font-bold text-[var(--primary)]">Credits are counted per person.</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">A family of 4 visiting together uses 4 credits. Bigger families can add members and the checkout updates automatically.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="grid content-start gap-5">
          <section className="grid gap-4 lg:grid-cols-3">
            {membershipPlans.map((plan, index) => {
              const isActive = activePlan.name === plan.name
              return (
                <button
                  key={plan.name}
                  type="button"
                  onClick={() => choosePlan(plan.name)}
                  className={`relative rounded-[1.75rem] border p-5 text-left shadow-sm transition hover:-translate-y-1 ${isActive ? 'border-[var(--secondary)] bg-[var(--surface-3)] ring-2 ring-[rgba(255,82,101,0.16)]' : 'border-[var(--line)] bg-white'}`}
                >
                  {index === 2 && <span className="absolute right-4 top-4 rounded-full bg-[var(--secondary)] px-3 py-1 text-[11px] font-extrabold uppercase text-white">Family</span>}
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--secondary)]">{plan.subtitle}</p>
                  <h3 className="font-display mt-2 text-2xl font-bold text-[var(--primary)]">{plan.name}</h3>
                  <p className="font-display mt-4 text-4xl font-bold text-[var(--primary)]">{plan.price}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[plan.entries, plan.perVisit, `${plan.baseMembers} member${plan.baseMembers > 1 ? 's' : ''}`].map((item) => (
                      <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[var(--primary)]">{item}</span>
                    ))}
                  </div>
                  <ComparisonNote text={plan.comparison} />
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{plan.outingText}</p>
                </button>
              )
            })}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              ['Credits', 'One credit = one person entry. The balance is shared by registered members.'],
              ['Add-ons', `After Family Magic, add +1 member for Rs. ${membershipAddOnPrice.toLocaleString()}. The checkout shows the full math.`],
              ['Perks', 'Members revisit for VR racing, bumper cars, arcade games, Creative Village, and seasonal activities.'],
            ].map(([title, copy]) => (
              <article key={title} className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm">
                <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">{title}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">{copy}</p>
              </article>
            ))}
          </section>

          <section className="rounded-[1.75rem] border border-[var(--line)] bg-white p-5 shadow-sm">
            <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Membership FAQ</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ['Validity', 'All memberships are valid for 3 months from activation.'],
                ['Shared visits', 'Family plans share one visit-credit balance among registered members.'],
                ['Refunds', 'Membership purchases are non-refundable once activated.'],
                ['Unused visits', 'Unused visits expire after the validity period ends.'],
              ].map(([question, answer]) => (
                <div key={question} className="rounded-2xl bg-[var(--surface-3)] p-4">
                  <h3 className="font-display text-lg font-bold text-[var(--primary)]">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="xl:sticky xl:top-28 xl:self-start">
          <form id="membership-booking" onSubmit={submitMembership} className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--secondary)]">Membership booking</p>
              <h3 className="font-display mt-1 text-2xl font-bold text-[var(--primary)]">{membershipBreakdown.standardPlan.name}</h3>
              <p className="mt-1 text-xs font-bold text-[var(--muted)]">Auto-priced from your selected plan and member count.</p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-3)] px-3 py-2 text-right">
              <span className="block text-[11px] font-extrabold uppercase text-[var(--muted)]">Members</span>
              <span className="font-display text-2xl font-bold text-[var(--primary)]">{membershipBreakdown.totalMembers}</span>
            </div>
          </div>
          {membershipBreakdown.standardPlan.name !== activePlan.name && (
            <p className="mt-3 rounded-2xl bg-[var(--surface-3)] px-4 py-3 text-xs font-extrabold leading-5 text-[var(--primary)]">
              Updated to the best standard plan for {membershipBreakdown.totalMembers} members.
            </p>
          )}
          <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-3)] p-4 text-sm font-bold text-[var(--muted)]">
              <Line label={`${membershipBreakdown.baseMembers} included member${membershipBreakdown.baseMembers > 1 ? 's' : ''}`} value={membershipBreakdown.standardPlan.price} />
              {membershipBreakdown.addOnMembers > 0 && <Line label={`Add-on members (${membershipBreakdown.addOnMembers} x Rs. ${membershipAddOnPrice.toLocaleString()})`} value={`Rs. ${membershipBreakdown.addOnTotal.toLocaleString()}`} />}
              <Line label="Validity" value="3 months" />
              <Line label="Total" value={`Rs. ${membershipBreakdown.total.toLocaleString()}`} strong />
          </div>
          <div className="mt-5 grid gap-3">
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Full name<input name="name" required value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="soft-field" placeholder="Parent or member name" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Phone number<input name="phone" required type="tel" inputMode="numeric" pattern="[0-9]{10}" minLength="10" maxLength="10" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="soft-field" placeholder="98XXXXXXXX" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Email address<input name="email" required type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className="soft-field" placeholder="guest@example.com" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Start date<input name="startDate" required type="date" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="soft-field" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">
              Additional members
              <input name="additionalMembers" type="number" min="0" max="20" value={form.additionalMembers} onChange={(e) => updateForm('additionalMembers', e.target.value)} className="soft-field" />
              <span className="text-xs font-bold text-[var(--muted)]">We auto-pick the best plan. Extra member add-on: Rs. {membershipAddOnPrice.toLocaleString()}.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Member names, optional<input name="familyMembers" value={form.familyMembers} onChange={(e) => updateForm('familyMembers', e.target.value)} className="soft-field" placeholder="Useful for family passes" /></label>
            <div className="grid gap-2 text-sm font-bold text-[var(--primary)]">
              Payment option
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ['khalti', 'Pay now with Khalti'],
                  ['esewa', 'Pay now with eSewa'],
                  ['pay_at_park', 'Reserve, pay at park'],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => { setPaymentMethod(value); trackEvent('membership_payment_method_select', { method: value, plan_name: activePlan.name }) }}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-extrabold ${paymentMethod === value ? 'border-[var(--secondary)] bg-[var(--surface-3)] text-[var(--primary)]' : 'border-[var(--line)] bg-white text-[var(--muted)]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {(paymentMethod === 'khalti' || paymentMethod === 'esewa') && !user && (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-3)] p-4 text-sm leading-6 text-[var(--primary)]">
                <p className="font-extrabold">Account required for online payment</p>
                <p className="mt-1 text-[var(--muted)]">Login first, then return here to continue securely to {paymentMethod === 'khalti' ? 'Khalti' : 'eSewa'}.</p>
                <button type="button" className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[var(--primary)] shadow-sm" onClick={() => {
                  sessionStorage.setItem('magicland:returnAfterLogin', 'memberships')
                  setPage('account')
                }}>Login or create account</button>
              </div>
            )}
            {(paymentMethod === 'khalti' || paymentMethod === 'esewa') && emailNeedsVerification && (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-3)] p-4 text-sm leading-6 text-[var(--primary)]">
                <p className="font-extrabold">Email verification required</p>
                <p className="mt-1 text-[var(--muted)]">Verify your email before continuing to online membership payment.</p>
              </div>
            )}
            <button disabled={status.type === 'loading' || authLoading} className="sunset rounded-full px-6 py-4 font-extrabold shadow-sm disabled:opacity-70">{status.type === 'loading' ? 'Processing...' : paymentMethod === 'khalti' ? 'Continue to Khalti' : paymentMethod === 'esewa' ? 'Continue to eSewa' : 'Submit Membership Request'}</button>
            {status.message && <p className={`text-sm font-bold leading-6 ${status.type === 'error' ? 'text-[var(--secondary)]' : 'text-[var(--primary)]'}`}>{status.message}</p>}
          </div>
        </form>
      </div>
      </div>
    </PageShell>
  )
}

function BirthdaysPage() {
  const packages = [
    ['Kids birthday', 'Kids Play + Carousel + Creative Village painting activity'],
    ['Teen group', 'VR & Simulator Zone + Arcade & Skill Games'],
    ['Family day', 'Family rides + Creative Village + dining seating'],
    ['School/group visit', 'Pottery, colors, arts, and supervised creative play'],
  ]

  return (
    <PageShell eyebrow="Birthday and events" title="Party booking for children, families, schools, and groups">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <article className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <SmartImage src={img.birthday} alt="Magic Land birthday party" className="h-80 w-full object-cover" />
          <div className="p-6">
            <h3 className="font-display text-3xl font-bold text-[var(--primary)]">Birthday Kingdom Package</h3>
            <p className="mt-3 leading-8 text-[var(--muted)]">Reserve a decorated hall, select food packages, add ride bundles, and include calm Creative Village activities like painting, pottery, colors, and arts for a more memorable celebration.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">{['Hall Slot', 'Catering', 'Creative Add-ons'].map((item) => <span key={item} className="rounded-2xl bg-[var(--surface-3)] px-4 py-3 text-sm font-extrabold text-[var(--primary)]">{item}</span>)}</div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {packages.map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <h4 className="font-display text-lg font-bold text-[var(--primary)]">{title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
        <BookingForm />
      </div>
    </PageShell>
  )
}

function BookingForm() {
  const [kids, setKids] = useState(15)
  const [deposit, setDeposit] = useState('Deposit')
  return (
    <form className="glass rounded-[2rem] p-6">
      <h3 className="font-display text-2xl font-bold text-[var(--primary)]">Event Reservation</h3>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-bold">Event date<input type="date" className="soft-field" /></label>
        <label className="grid gap-2 text-sm font-bold">Children attending<input type="number" value={kids} onChange={(e) => setKids(Number(e.target.value) || 1)} className="soft-field" /></label>
        <label className="grid gap-2 text-sm font-bold">Payment choice<select value={deposit} onChange={(e) => setDeposit(e.target.value)} className="soft-field"><option>Deposit</option><option>Full payment</option></select></label>
        <div className="rounded-2xl bg-white p-4 text-sm font-bold">Estimated package: {kids} children - {deposit}</div>
        <button type="button" className="sunset rounded-full px-6 py-4 font-extrabold shadow-sm">Save Reservation</button>
      </div>
    </form>
  )
}

function MapPage() {
  return (
    <PageShell eyebrow="Location and map" title="Find Magic Land Family Fun Park in Tarakeshwar">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <MapLibreView routeCoords={routeToPark} routeLabel="Tokha Bazar" />
        <aside className="glass rounded-[2rem] p-6">
          <MapPin className="text-[var(--secondary)]" />
          <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">Magic Land Family Fun Park</h3>
          <p className="mt-3 leading-7 text-[var(--muted)]">Q836+95P, Tarakeshwar 44600. Use the map to preview the Tokha Bazar road route, or open live directions from your current location.</p>
          <div className="mt-6 grid gap-3">
            <a href={directionsUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('map_directions_click', { destination: 'magic_land_tarakeshwar' })} className="sunset inline-flex justify-center rounded-full px-6 py-4 text-center font-extrabold shadow-sm">Directions from my location</a>
          </div>
          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <p className="text-sm font-bold text-[var(--muted)]">Park capacity</p>
            <p className="font-display mt-2 text-xl font-bold text-[var(--primary)]">Around 700 guests at once</p>
          </div>
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm leading-6 text-[var(--muted)]">Use the map to check the park area, nearby roads, and the easiest arrival route before your visit.</div>
        </aside>
      </div>
    </PageShell>
  )
}

function MapLibreView({ routeCoords, routeLabel }) {
  const container = useRef(null)
  const mapRef = useRef(null)
  const [mapFailed, setMapFailed] = useState(false)

  useEffect(() => {
    if (!container.current || mapRef.current) return
    let map
    try {
      map = new maplibregl.Map({
        container: container.current,
        center: [85.3267, 27.7739],
        zoom: 13.4,
        maxZoom: 18,
        pitch: 48,
        bearing: -16,
        attributionControl: false,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              maxzoom: 18,
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
      })
    } catch {
      window.setTimeout(() => setMapFailed(true), 0)
      return undefined
    }
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.on('load', () => {
      map.addSource('tokha-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routeCoords },
        },
      })
      map.addLayer({
        id: 'tokha-route-line',
        type: 'line',
        source: 'tokha-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#EF2B5A', 'line-width': 7, 'line-opacity': 0.88 },
      })
      map.addLayer({
        id: 'tokha-route-arrow',
        type: 'symbol',
        source: 'tokha-route',
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 72,
          'text-field': '>',
          'text-size': 26,
          'text-rotate': 0,
          'text-keep-upright': false,
        },
        paint: { 'text-color': '#030d46', 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
      })
      map.addSource('magic-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            zone('Ticket Plaza', [[85.32295, 27.78335], [85.32345, 27.78335], [85.32345, 27.78372], [85.32295, 27.78372]], 28, '#fcd400'),
            zone('Family Ride Court', [[85.32355, 27.78355], [85.32425, 27.78355], [85.32425, 27.78405], [85.32355, 27.78405]], 42, '#a1d2ab'),
            zone('Event Hall', [[85.32325, 27.7829], [85.3239, 27.7829], [85.3239, 27.78325], [85.32325, 27.78325]], 36, '#ffb68c'),
          ],
        },
      })
      map.addLayer({
        id: 'magic-zone-extrusions',
        type: 'fill-extrusion',
        source: 'magic-zones',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.72,
        },
      })
      new maplibregl.Marker({ color: '#EF2B5A' }).setLngLat(routeCoords[0]).setPopup(new maplibregl.Popup().setHTML(`<strong>${routeLabel}</strong><br/>Route preview toward Magic Land`)).addTo(map)
      new maplibregl.Marker({ color: '#1b245a' }).setLngLat([tokhaMunicipality.lng, tokhaMunicipality.lat]).setPopup(new maplibregl.Popup().setHTML('<strong>Tokha Municipality</strong><br/>Nearby reference point')).addTo(map)
      new maplibregl.Marker({ color: '#030D46' }).setLngLat([park.lng, park.lat]).setPopup(new maplibregl.Popup().setHTML('<strong>Magic Land Family Fun Park</strong><br/>Tarakeshwar 44600')).addTo(map)
      const bounds = routeCoords.reduce((box, coord) => box.extend(coord), new maplibregl.LngLatBounds(routeCoords[0], routeCoords[0]))
      map.fitBounds(bounds, { padding: 64, duration: 0 })
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [routeCoords, routeLabel])

  if (mapFailed) return <StaticRouteFallback routeLabel={routeLabel} />
  return <div ref={container} className="h-[520px] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-3)] shadow-xl md:h-[680px]" />
}

function StaticRouteFallback({ routeLabel }) {
  return (
    <div className="relative h-[520px] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-3)] shadow-xl md:h-[680px]">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 opacity-95">
        {osmTileGrid.ys.flatMap((y) => osmTileGrid.xs.map((x) => (
          <img key={`${x}-${y}`} src={`https://tile.openstreetmap.org/${osmTileGrid.z}/${x}/${y}.png`} alt="" className="h-full w-full object-cover" loading="lazy" />
        )))}
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 520" role="img" aria-label="OpenStreetMap road preview from Tokha Bazar to Magic Land">
        <path d="M95 500 C128 422 144 390 184 356 C222 324 212 285 248 250 C292 208 286 164 268 126 C252 92 266 56 302 24" fill="none" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" opacity="0.86" />
        <path d="M95 500 C128 422 144 390 184 356 C222 324 212 285 248 250 C292 208 286 164 268 126 C252 92 266 56 302 24" fill="none" stroke="#EF2B5A" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
        <path d="M184 357 l15 -3 -7 14" fill="none" stroke="#030d46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M248 251 l14 -6 -3 15" fill="none" stroke="#030d46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M268 127 l13 -6 -2 15" fill="none" stroke="#030d46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="95" cy="500" r="8" fill="#EF2B5A" />
        <circle cx="302" cy="24" r="8" fill="#030d46" />
      </svg>
      <div className="pointer-events-none relative flex h-full flex-col justify-between p-4">
        <div className="w-fit rounded-2xl bg-white/88 p-4 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--secondary)]">Nearby start</p>
          <h3 className="font-display text-2xl font-bold text-[var(--primary)]">{routeLabel}</h3>
          <p className="text-sm font-semibold text-[var(--muted)]">Route preview toward Magic Land</p>
        </div>
        <div className="ml-auto w-fit rounded-2xl bg-white/88 p-4 text-right shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--secondary)]">Arrive</p>
          <h3 className="font-display text-2xl font-bold text-[var(--primary)]">Magic Land</h3>
          <p className="text-sm font-semibold text-[var(--muted)]">Tarakeshwar 44600</p>
        </div>
      </div>
    </div>
  )
}

function zone(name, coords, height, color) {
  return { type: 'Feature', properties: { name, height, color }, geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] } }
}

function DiningPage() {
  return <SimpleImagePage eyebrow="Dining" title="Snacks, meals, and celebration-friendly food for full family days" image={img.dining} icon={Utensils} items={['Magic Cafe meals', 'Birthday catering add-ons', 'Membership-friendly offers', 'Creative Village break seating after pottery, painting, and arts sessions']} />
}

function EventsPage() {
  const [selectedDate, setSelectedDate] = useState(15)
  const eventSets = {
    14: [
      ['10:30 AM', 'VR Games Opening', 'Indoor Game Zone'],
      ['01:00 PM', 'Family Pool Challenge', 'Pool & Skill Area'],
      ['05:30 PM', 'Evening Ride Hour', 'Family Ride Court'],
    ],
    15: [
      ['10:30 AM', 'Park Gates Open', 'Main Entrance'],
      ['12:00 PM', 'VR Bike Racing Session', 'VR Zone'],
      ['01:30 PM', 'Creative Village Painting', 'Village Homes'],
      ['03:00 PM', 'VR Shooting Challenge', 'Game Arena'],
      ['05:30 PM', 'Family Games Hour', 'Indoor Game Zone'],
      ['08:30 PM', 'Magic Parade', 'Main Boulevard'],
    ],
    16: [
      ['11:00 AM', 'VR Car Simulator Runs', 'VR Zone'],
      ['02:00 PM', 'Birthday Celebration Slots', 'Party Hall'],
      ['04:30 PM', 'Pool & Arcade Hour', 'Indoor Game Zone'],
      ['08:30 PM', 'Magic Parade', 'Main Boulevard'],
    ],
  }
  const selectedEvents = eventSets[selectedDate] ?? eventSets[15]

  return (
    <PageShell eyebrow="Calendar" title="Park hours, shows, parades, and seasonal events">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="glass rounded-[2rem] p-6">
          <h3 className="font-display text-2xl font-bold text-[var(--primary)]">May 2026</h3>
          <p className="mt-2 text-[var(--muted)]">Open 10:00 AM - 9:00 PM</p>
          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-sm font-bold">
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1
              return <button key={day} onClick={() => setSelectedDate(day)} className={`rounded-full py-2 transition ${day === selectedDate ? 'bg-[var(--primary)] text-white' : 'bg-white text-[var(--muted)] hover:bg-[var(--surface-3)]'}`}>{day}</button>
            })}
          </div>
        </div>
        <div className="space-y-3">{selectedEvents.map(([time, title, place]) => <EventRow key={`${selectedDate}-${title}`} time={time} title={title} place={place} />)}</div>
      </div>
    </PageShell>
  )
}

function AboutPage() {
  return (
    <PageShell eyebrow="About Us" title="A family park built for joy, care, and repeat memories">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <article className="storybook-card rounded-[2rem] p-6 shadow-sm">
          <h3 className="font-display text-3xl font-bold text-[var(--primary)]">Magic Land Family Fun Park</h3>
          <p className="mt-4 leading-8 text-[var(--muted)]">Magic Land Family Fun Park is a place where kids laugh, families bond, and memories become magic through exceptional hospitality and a welcoming experience for everyone.</p>
          <p className="mt-4 leading-8 text-[var(--muted)]">Magic Land brings together VR games, family rides, arcade challenges, Creative Village activities, birthdays, dining, and guest care in one welcoming park experience.</p>
          <p className="mt-4 leading-8 text-[var(--muted)]">The park story is shaped around Ankit Dhakal and Binaya Neupane, two USA-returned family entrepreneurs who wanted to create a cleaner, warmer, and more organized entertainment destination for families in Kathmandu.</p>
        </article>
        <QuickCard icon={Crown} title="Our Promise" copy="A safe, friendly, well-managed park where children laugh, families bond, and every visit feels easy to plan." />
      </div>
    </PageShell>
  )
}

function FAQPage() {
  const faqs = [
    ['What does one entry include?', 'Entry gives guests access to the park experience, with selected games, rides, and activities depending on ticket or membership type.'],
    ['How does membership work?', 'Memberships are simple visit plans. Individual Fun Pass includes 5 visits for Rs. 2,999, Family Duo Pass includes 10 shared visits for Rs. 5,499, and Family Magic Pass includes 20 shared visits for Rs. 9,499. All are valid for 3 months.'],
    ['Do you host birthdays and school visits?', 'Yes. Packages can include Kids Play, carousel, VR games, arcade, Creative Village painting, pottery, dhiki-jato heritage play, doko craft moments, dining, and hall seating.'],
    ['Where is Magic Land located?', 'Magic Land Family Fun Park is in Tarakeshwar 44600, near the Tokha route. Use the Map page for live directions.'],
  ]
  return (
    <PageShell eyebrow="FAQ" title="Helpful answers before your visit">
      <div className="grid gap-4 md:grid-cols-2">
        {faqs.map(([question, answer]) => (
          <details key={question} className="storybook-card rounded-[1.5rem] p-5">
            <summary className="cursor-pointer font-display text-xl font-bold text-[var(--primary)]">{question}</summary>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{answer}</p>
          </details>
        ))}
      </div>
    </PageShell>
  )
}

function PrivacyPage() {
  return <InfoPage eyebrow="Privacy" title="Guest privacy and data care" items={['We collect only the details needed for ticketing, memberships, bookings, support, and guest communication.', 'Payment, booking, and membership details should be handled securely and used only for park operations.', 'Guests can contact Magic Land for corrections, booking questions, or support-related data requests.']} />
}

function TermsPage() {
  return <InfoPage eyebrow="Terms & Conditions" title="Simple park terms for safer family visits" items={['Tickets and memberships are valid according to the selected plan, date, and park rules.', 'Guests should follow staff guidance, age suitability notes, safety signs, and queue instructions.', 'Birthday, group, school, refund, and cancellation requests are handled through guest care and may depend on booking status.']} />
}

function InfoPage({ eyebrow, title, items }) {
  return (
    <PageShell eyebrow={eyebrow} title={title}>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => <article key={item} className="storybook-card rounded-[1.5rem] p-5 text-sm font-semibold leading-7 text-[var(--muted)]">{item}</article>)}
      </div>
    </PageShell>
  )
}

function ContactPage() {
  return (
    <PageShell eyebrow="Contact" title="Questions, group visits, and booking support">
      <div className="grid gap-5 md:grid-cols-3">
        <QuickCard icon={Phone} title="Phone" copy="+977 980-3043824" />
        <QuickCard icon={Mail} title="Email" copy="info@magiclandfunpark.com" />
        <QuickCard icon={MapPin} title="Location" copy="Magic Land Family Fun Park, Q836+95P, Tarakeshwar 44600." />
      </div>
      <section className="mt-6 rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
        <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Social media</p>
        <h2 className="font-display mt-2 text-2xl font-bold text-[var(--primary)]">Follow Magic Land online</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {socialLinks.map(({ label, href, icon }) => (
            href ? (
                <a key={label} href={href} target="_blank" rel="noreferrer" onClick={() => trackEvent('social_link_click', { channel: label.toLowerCase() })} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-extrabold text-[var(--primary)] transition hover:border-[var(--secondary)] hover:text-[var(--secondary)]">
                <SocialIcon name={icon} size={18} />
                {label}
              </a>
            ) : (
              <span key={label} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-extrabold text-[var(--muted)]">
                <SocialIcon name={icon} size={18} />
                {label}
              </span>
            )
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function AccountPage({ setPage }) {
  const { user, loading } = useAuthUser()
  const [emailForm, setEmailForm] = useState({ email: '', password: '' })
  const [phoneForm, setPhoneForm] = useState({ phone: '', otp: '' })
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [status, setStatus] = useState({ type: '', message: '' })

  const updateEmail = (field, value) => setEmailForm((current) => ({ ...current, [field]: value }))
  const updatePhone = (field, value) => setPhoneForm((current) => ({ ...current, [field]: value }))

  const runAuthAction = async (eventName, action, successMessage) => {
    setStatus({ type: 'loading', message: 'Checking your account...' })
    trackEvent(`${eventName}_start`)
    try {
      await action()
      setStatus({ type: 'success', message: successMessage })
      trackEvent(`${eventName}_success`)
      if (!['auth_phone_otp_request', 'auth_email_register'].includes(eventName)) {
        try {
          const returnPage = sessionStorage.getItem('magicland:returnAfterLogin')
          if (returnPage) {
            sessionStorage.removeItem('magicland:returnAfterLogin')
            setPage(returnPage)
          }
        } catch {
          // Login still succeeds if browser storage is unavailable.
        }
      }
    } catch (error) {
      console.error(`${eventName} failed`, error)
      setStatus({ type: 'error', message: error?.message || 'Could not complete login right now.' })
      trackEvent(`${eventName}_error`, { code: error?.code ?? 'unknown' })
    }
  }

  const loginGoogle = () => runAuthAction('auth_google', signInWithGoogle, 'Signed in with Google.')
  const loginEmail = () => runAuthAction('auth_email_login', () => signInWithEmail(emailForm.email, emailForm.password), 'Signed in with email.')
  const registerEmail = () => runAuthAction('auth_email_register', () => createEmailAccount(emailForm.email, emailForm.password), 'Account created. Please verify your email before online payment.')
  const requestOtp = () => runAuthAction('auth_phone_otp_request', async () => {
    const result = await sendPhoneOtp(phoneForm.phone)
    setConfirmationResult(result)
  }, 'OTP sent. Please enter the code.')
  const verifyOtp = () => runAuthAction('auth_phone_otp_verify', () => confirmPhoneOtp(confirmationResult, phoneForm.otp), 'Phone number verified. You are signed in.')
  const logout = () => runAuthAction('auth_logout', signOutUser, 'Signed out.')

  return (
    <PageShell eyebrow="Magic Land Account" title="Login to continue checkout">
      <div className="mx-auto max-w-xl">
        <aside className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[var(--surface-3)] p-4">
            <ShieldCheck className="mt-0.5 text-[var(--secondary)]" size={20} />
            <div>
              <p className="text-sm font-extrabold text-[var(--primary)]">Online payment needs a verified account.</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Login with Google, email, or phone. Magic Land stores payment references under your guest ID.</p>
            </div>
          </div>
          {loading ? (
            <p className="font-bold text-[var(--muted)]">Checking login status...</p>
          ) : user ? (
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Signed in</p>
              <h3 className="font-display mt-2 text-2xl font-bold text-[var(--primary)]">{user.displayName || user.email || user.phoneNumber || 'Magic Land Guest'}</h3>
              <div className="mt-4 rounded-2xl bg-[var(--surface-3)] p-4 text-sm leading-7 text-[var(--muted)]">
                {user.email && <p><strong>Email:</strong> {user.email}</p>}
                {user.email && <p><strong>Email status:</strong> {user.emailVerified ? 'Verified' : 'Needs verification before online payment'}</p>}
                {user.phoneNumber && <p><strong>Phone:</strong> {user.phoneNumber}</p>}
                <p><strong>Guest ID:</strong> {user.uid.slice(0, 10)}...</p>
              </div>
              <button className="mt-5 rounded-full border border-[var(--line)] bg-white px-5 py-3 font-extrabold text-[var(--primary)]" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <div className="grid gap-5">
              <button className="sunset rounded-full px-6 py-4 font-extrabold shadow-sm" onClick={loginGoogle}>Continue with Google</button>

              <div className="grid gap-3 border-t border-[var(--line)] pt-5">
                <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Email login</p>
                <input className="soft-field" type="email" autoComplete="email" placeholder="you@example.com" value={emailForm.email} onChange={(event) => updateEmail('email', event.target.value)} />
                <input className="soft-field" type="password" autoComplete="current-password" placeholder="Password" value={emailForm.password} onChange={(event) => updateEmail('password', event.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-extrabold text-white" onClick={loginEmail}>Sign in</button>
                  <button className="rounded-full border border-[var(--line)] bg-[var(--surface-3)] px-5 py-3 text-sm font-extrabold text-[var(--primary)]" onClick={registerEmail}>Create account</button>
                </div>
                <p className="text-xs leading-5 text-[var(--muted)]">New email accounts receive a verification link. Online payments unlock after verification.</p>
              </div>

              <div className="grid gap-3 border-t border-[var(--line)] pt-5">
                <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Phone login</p>
                <input className="soft-field" type="tel" autoComplete="tel" placeholder="+97798XXXXXXXX" value={phoneForm.phone} onChange={(event) => updatePhone('phone', event.target.value)} />
                <button className="rounded-full border border-[var(--line)] bg-[var(--surface-3)] px-5 py-3 text-sm font-extrabold text-[var(--primary)]" onClick={requestOtp}>Send OTP</button>
                {confirmationResult && (
                  <>
                    <input className="soft-field" inputMode="numeric" placeholder="Enter OTP" value={phoneForm.otp} onChange={(event) => updatePhone('otp', event.target.value)} />
                    <button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-extrabold text-white" onClick={verifyOtp}>Verify OTP</button>
                  </>
                )}
                <div id="magicland-phone-recaptcha" />
              </div>
            </div>
          )}
          {status.message && <p className={`mt-4 text-sm font-bold leading-6 ${status.type === 'error' ? 'text-[var(--secondary)]' : 'text-[var(--primary)]'}`}>{status.message}</p>}
        </aside>
      </div>
    </PageShell>
  )
}

function KhaltiReturnPage() {
  const [status, setStatus] = useState({ type: 'loading', message: 'Verifying Khalti payment...' })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pidx = params.get('pidx')
    const bookingId = params.get('booking_id') || params.get('purchase_order_id')
    const gatewayAmount = Number(params.get('total_amount') || params.get('amount') || 0)
    const amount = gatewayAmount > 0 ? gatewayAmount / 100 : 0
    trackEvent('payment_return_view', { gateway: 'khalti', pidx, booking_id: bookingId, amount })
    const run = async () => {
      if (!pidx) {
        setStatus({ type: 'error', message: 'Khalti did not return a payment ID. Please contact Magic Land with your booking details.' })
        return
      }
      try {
        const result = await verifyKhaltiPayment({ pidx, amount, purchaseOrderId: bookingId })
        trackEvent('khalti_payment_verified', { pidx, booking_id: bookingId, status: result.status, paid_amount: result.paidAmount })
        try {
          const pending = JSON.parse(sessionStorage.getItem('magicland:pendingPayment') || '{}')
          await createPaymentReceipt('khalti', {
            ...pending,
            bookingId: bookingId || pending.bookingId || '',
            gatewayReference: pidx,
            pidx,
            amount: result.paidAmount || amount || pending.amount,
            paidAmount: result.paidAmount || amount || pending.amount,
            rawStatus: result.rawStatus || result.status || '',
            verifiedAt: new Date().toISOString(),
          })
          sessionStorage.removeItem('magicland:pendingPayment')
        } catch (receiptError) {
          console.error('Khalti receipt email event failed', receiptError)
          trackEvent('payment_receipt_email_event_error', { gateway: 'khalti', booking_id: bookingId })
        }
        setStatus({ type: 'success', message: 'Payment verified. Magic Land will confirm your booking by phone.' })
      } catch (error) {
        console.error('Khalti verification failed', error)
        trackEvent('khalti_payment_verify_error', { pidx, booking_id: bookingId })
        setStatus({ type: 'error', message: 'We could not verify this payment automatically. If money was deducted, please contact Magic Land with your Khalti transaction details.' })
      }
    }
    run()
  }, [])

  return (
    <PageShell eyebrow="Khalti Payment" title={status.type === 'success' ? 'Payment received' : 'Payment verification'}>
      <div className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
        <Wallet className={status.type === 'error' ? 'text-[var(--secondary)]' : 'text-[var(--primary)]'} />
        <h2 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">{status.message}</h2>
        <p className="mt-3 max-w-2xl leading-8 text-[var(--muted)]">For safety, Magic Land verifies gateway payments from the server. Do not rely on screenshots alone for final confirmation.</p>
      </div>
    </PageShell>
  )
}

function EsewaReturnPage() {
  const [status, setStatus] = useState({ type: 'loading', message: 'Verifying eSewa payment...' })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const data = params.get('data')
    const bookingId = params.get('booking_id')
    trackEvent('payment_return_view', { gateway: 'esewa', booking_id: bookingId })
    const run = async () => {
      if (!data) {
        setStatus({ type: 'error', message: 'eSewa did not return payment data. Please contact Magic Land with your transaction details.' })
        return
      }
      try {
        const result = await verifyEsewaPayment({ data, purchaseOrderId: bookingId })
        trackEvent('esewa_payment_verified', { status: result.status, booking_id: bookingId })
        try {
          const pending = JSON.parse(sessionStorage.getItem('magicland:pendingPayment') || '{}')
          await createPaymentReceipt('esewa', {
            ...pending,
            bookingId: bookingId || pending.bookingId || '',
            gatewayReference: result.data?.ref_id || result.decoded?.transaction_code || '',
            transactionUuid: result.decoded?.transaction_uuid || result.data?.transaction_uuid || '',
            amount: Number(result.decoded?.total_amount || result.data?.total_amount || pending.amount || 0),
            paidAmount: Number(result.decoded?.total_amount || result.data?.total_amount || pending.amount || 0),
            rawStatus: result.data?.status || result.decoded?.status || result.status || '',
            verifiedAt: new Date().toISOString(),
          })
          sessionStorage.removeItem('magicland:pendingPayment')
        } catch (receiptError) {
          console.error('eSewa receipt email event failed', receiptError)
          trackEvent('payment_receipt_email_event_error', { gateway: 'esewa', booking_id: bookingId })
        }
        setStatus({ type: 'success', message: 'eSewa payment verified. Magic Land will confirm your booking by phone.' })
      } catch (error) {
        console.error('eSewa verification failed', error)
        trackEvent('esewa_payment_verify_error', { booking_id: bookingId })
        setStatus({ type: 'error', message: 'We could not verify this eSewa payment automatically. If money was deducted, please contact Magic Land with your eSewa transaction details.' })
      }
    }
    run()
  }, [])

  return <PaymentStatusPage gateway="eSewa" status={status} />
}

function PaymentFailurePage({ gateway }) {
  return (
    <PageShell eyebrow={`${gateway} Payment`} title="Payment was not completed">
      <div className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
        <Wallet className="text-[var(--secondary)]" />
        <h2 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">No payment was captured.</h2>
        <p className="mt-3 max-w-2xl leading-8 text-[var(--muted)]">You can try checkout again, or choose reserve and pay at park.</p>
      </div>
    </PageShell>
  )
}

function PaymentStatusPage({ gateway, status }) {
  return (
    <PageShell eyebrow={`${gateway} Payment`} title={status.type === 'success' ? 'Payment received' : 'Payment verification'}>
      <div className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
        <Wallet className={status.type === 'error' ? 'text-[var(--secondary)]' : 'text-[var(--primary)]'} />
        <h2 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">{status.message}</h2>
        <p className="mt-3 max-w-2xl leading-8 text-[var(--muted)]">For safety, Magic Land verifies gateway payments from the server. Do not rely on screenshots alone for final confirmation.</p>
      </div>
    </PageShell>
  )
}

function ThankYouPage({ setPage }) {
  const [details] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('magicland:thankYou') || '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    trackEvent('booking_thank_you_view', {
      request_id: details.requestId,
      ticket_name: details.ticketName,
      total: details.total,
      payment_method: details.paymentMethod,
    })
  }, [details.paymentMethod, details.requestId, details.ticketName, details.total])

  return (
    <PageShell eyebrow="Thank You" title={details.title || 'Thank you for choosing Magic Land'}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
          <Ticket className="text-[var(--secondary)]" />
          <h2 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">{details.message || 'Your request has been received. Magic Land will confirm the details soon.'}</h2>
          <div className="mt-6 grid gap-3 text-sm font-bold text-[var(--muted)] md:grid-cols-2">
            {details.ticketName && <div className="rounded-2xl bg-[var(--surface-3)] p-4"><span className="block text-xs uppercase text-[var(--secondary)]">Ticket</span>{details.ticketName}</div>}
            {details.total && <div className="rounded-2xl bg-[var(--surface-3)] p-4"><span className="block text-xs uppercase text-[var(--secondary)]">Total</span>Rs. {Number(details.total).toLocaleString()}</div>}
            {details.paymentMethod && <div className="rounded-2xl bg-[var(--surface-3)] p-4"><span className="block text-xs uppercase text-[var(--secondary)]">Payment</span>{details.paymentMethod === 'pay_at_park' ? 'Pay at park' : details.paymentMethod}</div>}
            {details.requestId && <div className="rounded-2xl bg-[var(--surface-3)] p-4"><span className="block text-xs uppercase text-[var(--secondary)]">Reference</span>{String(details.requestId).slice(0, 12)}</div>}
          </div>
        </section>
        <aside className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
          <h3 className="font-display text-2xl font-bold text-[var(--primary)]">Next step</h3>
          <p className="mt-3 leading-7 text-[var(--muted)]">Please keep your phone and email reachable. For online payments, wait for the payment received page after gateway checkout.</p>
          <div className="mt-5 grid gap-3">
            <button className="sunset rounded-full px-5 py-3 font-extrabold" onClick={() => setPage('tickets')}>Book another visit</button>
            <button className="rounded-full border border-[var(--line)] bg-[var(--surface-3)] px-5 py-3 font-extrabold text-[var(--primary)]" onClick={() => setPage('home')}>Back to home</button>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}

function MorePage({ setPage }) {
  return (
    <PageShell eyebrow="More" title="Explore Magic Land">
      <div className="grid gap-4 md:grid-cols-3">
        {moreNav.map((item) => <QuickCard key={item.id} icon={item.icon} title={item.label} copy="Open this section." onClick={() => setPage(item.id)} />)}
      </div>
    </PageShell>
  )
}

function SimpleImagePage({ eyebrow, title, image, icon, items }) {
  const Icon = icon
  return (
    <PageShell eyebrow={eyebrow} title={title}>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <SmartImage src={image} alt={title} className="h-[460px] w-full rounded-[2rem] object-cover shadow-xl" />
        <div className="glass rounded-[2rem] p-6">
          <Icon className="text-[var(--secondary)]" />
          <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">Made for easy visits</h3>
          <div className="mt-5 space-y-3">{items.map((item) => <div key={item} className="rounded-2xl bg-white p-4 font-bold text-[var(--muted)]">{item}</div>)}</div>
        </div>
      </div>
    </PageShell>
  )
}

function MapTeaser({ setPage }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="map-field grid gap-6 rounded-[2rem] p-6 md:grid-cols-[1fr_380px]">
        <div><p className="text-sm font-extrabold uppercase text-[var(--secondary)]">Location</p><h2 className="font-display mt-2 text-4xl font-bold text-[var(--primary)]">Find Magic Land Family Fun Park</h2><p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">Check the park location and open Google directions before you leave.</p></div>
        <button className="sunset h-fit self-end rounded-full px-6 py-4 font-extrabold shadow-sm" onClick={() => setPage('map')}>Open Map</button>
      </div>
    </section>
  )
}

function SectionIntro({ eyebrow, title }) {
  return <div className="mx-auto mb-8 mt-10 max-w-7xl px-4 md:mt-14 md:px-8"><p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">{eyebrow}</p><h2 className="font-display mt-4 max-w-3xl text-3xl font-bold leading-tight text-[var(--primary)] md:text-4xl">{title}</h2></div>
}

function PageShell({ eyebrow, title, children }) {
  return <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16"><div className="mb-8 max-w-4xl"><p className="text-sm font-extrabold uppercase tracking-wider text-[var(--secondary)]">{eyebrow}</p><h1 className="font-display mt-2 text-3xl font-bold leading-tight text-[var(--primary)] md:text-6xl">{title}</h1></div>{children}</section>
}

function QuickCard({ icon: Icon, title, copy, onClick }) {
  const Comp = onClick ? 'button' : 'article'
  return <Comp onClick={onClick} className="storybook-card rounded-[2rem] p-5 text-left shadow-sm transition hover:-translate-y-1"><Icon className="text-[var(--secondary)]" /><h3 className="font-display mt-4 text-2xl font-bold text-[var(--primary)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p></Comp>
}

function BrandLockup({ large = false }) {
  return (
    <div className={`flex items-center ${large ? 'gap-3' : 'gap-2.5'}`}>
      <img
        src="/magicland-logo-transparent.png"
        alt=""
        className={`${large ? 'h-20 w-20' : 'h-12 w-12'} shrink-0 object-contain`}
      />
      <div className="flex flex-col justify-center leading-[0.95]">
        <p className={`brand-title font-display font-extrabold tracking-tight ${large ? 'text-3xl' : 'text-2xl'}`}>Magic Land</p>
        <p className={`mt-0 font-display font-bold tracking-[0.02em] text-[var(--muted)] ${large ? 'text-base' : 'text-xs'}`}>Family Fun Park</p>
      </div>
    </div>
  )
}

function SocialIcon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'facebook') {
    return <svg {...common}><path d="M15 8h-2.2A2.8 2.8 0 0 0 10 10.8V22" /><path d="M7 14h8" /><path d="M13 2h4" /></svg>
  }
  if (name === 'instagram') {
    return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></svg>
  }
  if (name === 'tiktok') {
    return <svg {...common}><path d="M14 3v11.5a4.5 4.5 0 1 1-4.5-4.5" /><path d="M14 5c1 2.5 2.9 4 6 4.2" /></svg>
  }
  return <svg {...common}><path d="M4 8.5A3 3 0 0 1 7 5.5h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" /><path d="m10 9 5 3-5 3Z" /></svg>
}

function SmartImage({ src, alt, className }) {
  const [imageSrc, setImageSrc] = useState(src)
  return <img src={imageSrc} alt={alt} className={className} loading="lazy" onError={() => setImageSrc((current) => (current === img.arcade ? img.mobileHero : img.arcade))} />
}

function EventRow({ time, title, place }) {
  return <div className="storybook-card flex items-center gap-4 rounded-[2rem] p-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--primary)] text-white"><Clock3 /></div><div><p className="text-sm font-extrabold text-[var(--secondary)]">{time}</p><h3 className="font-display text-2xl font-bold text-[var(--primary)]">{title}</h3><p className="text-sm font-semibold text-[var(--muted)]">{place}</p></div></div>
}

function Line({ label, value, strong }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[var(--line)] py-2.5 last:border-b-0 ${strong ? 'pt-3 text-xl text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
      <span className={`${strong ? 'font-extrabold' : 'font-bold'} leading-5`}>{label}</span>
      <span className={`${strong ? 'font-extrabold' : 'font-bold'} whitespace-nowrap text-right leading-5`}>{value}</span>
    </div>
  )
}

function Footer({ setPage }) {
  const guestCare = [
    { id: 'about', label: 'About Us' },
    { id: 'faq', label: 'FAQ' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'terms', label: 'Terms' },
    { id: 'contact', label: 'Contact' },
  ]
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface-2)] px-4 py-12 text-[var(--ink)] md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div>
          <BrandLockup large />
          <p className="mt-4 max-w-sm leading-7 text-[var(--muted)]">A place where kids laugh, families bond, and memories become magic through exceptional hospitality and a welcoming experience for everyone.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socialLinks.map(({ label, href, icon }) => (
              href ? (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} onClick={() => trackEvent('social_link_click', { channel: label.toLowerCase(), location: 'footer' })} className="grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--primary)] shadow-sm transition hover:text-[var(--secondary)]">
                  <SocialIcon name={icon} size={18} />
                </a>
              ) : (
                <span key={label} aria-label={`${label} coming soon`} className="grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--muted)] shadow-sm">
                  <SocialIcon name={icon} size={18} />
                </span>
              )
            ))}
          </div>
        </div>
        <div><h3 className="font-display text-xl font-bold text-[var(--primary)]">Plan Your Day</h3><div className="mt-4 grid gap-2">{nav.slice(0, 6).map((item) => <button key={item.id} className="text-left text-[var(--muted)] hover:text-[var(--primary)]" onClick={() => setPage(item.id)}>{item.label}</button>)}</div></div>
        <div><h3 className="font-display text-xl font-bold text-[var(--primary)]">Help & Park Info</h3><div className="mt-4 grid gap-2">{guestCare.map((item) => <button key={item.id} className="text-left text-[var(--muted)] hover:text-[var(--primary)]" onClick={() => setPage(item.id)}>{item.label}</button>)}</div></div>
      </div>
    </footer>
  )
}

function BottomNav({ active, setPage }) {
  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'attractions', label: 'Rides', icon: FerrisWheel },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'more', label: 'More', icon: Menu },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around rounded-t-xl border-t border-[var(--line)] bg-[rgba(251,248,255,0.97)] px-2 pt-1 shadow-[0_-4px_12px_rgba(27,36,90,0.08)] backdrop-blur-md md:hidden">
      {items.map((item) => <button key={item.id} onClick={() => setPage(item.id)} className={`flex min-w-12 flex-col items-center gap-0.5 text-[11px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#bbc3ff] ${active === item.id ? 'text-[var(--secondary)]' : 'text-[var(--muted)]'}`}><item.icon size={19} />{item.label}</button>)}
    </nav>
  )
}

export default App


