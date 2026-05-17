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
  Gift,
  Home,
  LayoutDashboard,
  Mail,
  Map as MapIcon,
  MapPin,
  Menu,
  Palette,
  PartyPopper,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Ticket,
  Utensils,
  Wallet,
  X,
} from 'lucide-react'

const park = { lng: 85.3239042, lat: 27.7836311 }
const tokhaMunicipality = { lng: 85.32746, lat: 27.74526 }
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
const tokhaEmbedUrl = `https://www.google.com/maps?output=embed&saddr=Tokha+Bazar,+Kathmandu&daddr=${park.lat},${park.lng}`
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
  pool: 'https://images.unsplash.com/photo-1629224336810-9d8805b95e76?auto=format&fit=crop&w=900&q=80',
  familyGames: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
  kidsPlay: 'https://images.unsplash.com/photo-1564429238817-393bd4286b2d?auto=format&fit=crop&w=900&q=80',
  creativeVillage: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=80',
  bicycle: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
  zipline: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80',
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
  { id: 'app', label: 'Mobile App', icon: LayoutDashboard },
  { id: 'admin', label: 'Admin Preview', icon: ShieldCheck },
  { id: 'policies', label: 'Policies', icon: ShieldCheck },
  { id: 'contact', label: 'Contact', icon: Mail },
]

const zoneFilters = ['All', 'VR & Simulators', 'Family Rides', 'Kids Play', 'Arcade & Skill', 'Creative Village']

const zoneCards = [
  { title: 'VR & Simulator Zone', zone: 'VR & Simulators', icon: Ticket, image: img.vrBike, copy: 'VR bikes, car simulators, immersive shooting, motion games, and high-energy replay fun.' },
  { title: 'Family Rides', zone: 'Family Rides', icon: FerrisWheel, image: img.carousel, copy: 'Classic rides for children and families, from carousel moments to bumper car laughs.' },
  { title: 'Kids Play Zone', zone: 'Kids Play', icon: PartyPopper, image: img.kidsPlay, copy: 'Soft play, jumping, bouncy castle, spray ball, trampoline bridge, zipline, and active fun.' },
  { title: 'Arcade & Skill Games', zone: 'Arcade & Skill', icon: Ticket, image: img.pool, copy: 'Coin games, basketball machines, pool tables, prize games, and quick repeatable challenges.' },
  { title: 'Creative Village', zone: 'Creative Village', icon: Palette, image: img.creativeVillage, copy: 'A softer village-style space for pottery, painting, color play, arts, crafts, and family bonding.' },
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
  { name: 'Pottery Workshop', zone: 'Creative Village', category: 'Creative', wait: 'Workshop', height: 'All ages', image: img.creativeVillage, bestFor: 'Parent-child bonding', copy: 'A calm hands-on pottery space inside aesthetic village-style homes for creative family time.' },
  { name: 'Painting Studio', zone: 'Creative Village', category: 'Creative', wait: 'Workshop', height: 'All ages', image: img.creativeVillage, bestFor: 'Birthdays and schools', copy: 'Painting sessions where children can explore colors, brushes, and take-home memories.' },
  { name: 'Color Sand Play', zone: 'Creative Village', category: 'Creative', wait: 'Open', height: 'Kids', image: img.creativeVillage, bestFor: 'Sensory play', copy: 'Color sand activities for calm sensory play, art corners, and photo-friendly moments.' },
  { name: 'Arts & Crafts Village Homes', zone: 'Creative Village', category: 'Creative', wait: 'Open', height: 'All ages', image: img.creativeVillage, bestFor: 'Slow family time', copy: 'Aesthetic village homes for arts, crafts, workshops, and quiet moments between high-energy games.' },
]

const ticketOptions = [
  { name: 'One-Time Entry', price: 1500, detail: 'A single Magic Land visit for rides, VR games, arcade fun, and family attractions.' },
  { name: 'Individual Fun Pass', price: 2999, detail: '3 months, 30 entries, and the smartest value for frequent visitors.' },
  { name: 'Family Magic Pass', price: 9999, detail: '3 months for 4 members with 120 total entries and better per-visit value.' },
  { name: 'Gift Ticket', price: 1500, detail: 'A shareable entry for birthdays, friends, and family celebrations.' },
]

const membershipPlans = [
  {
    name: 'Individual Fun Pass',
    price: 'Rs. 2,999',
    subtitle: '3 months membership',
    entries: '30 entries',
    perVisit: 'About Rs. 100 per entry',
    regular: 'Rs. 45,000',
    savings: 'Save Rs. 42,001',
    bestFor: ['Kids who love visiting again and again', 'Weekend family outings', 'After-school playtime', 'Affordable entertainment for parents'],
  },
  {
    name: 'Family Magic Pass',
    price: 'Rs. 9,999',
    subtitle: '3 months family membership',
    entries: '4 members - 120 total entries',
    perVisit: 'About Rs. 83 per visit',
    regular: 'Rs. 180,000',
    savings: 'Save Rs. 170,001',
    bestFor: ['Families with children', 'Regular weekend visitors', 'Parents planning more family time', 'Groups who want better value per visit'],
  },
]


function App() {
  const pageFromLocation = () => window.location.hash.replace(/^#\/?/, '') || 'home'
  const [page, setPageState] = useState(pageFromLocation)
  const [menuOpen, setMenuOpen] = useState(false)

  const allPages = useMemo(() => [...nav, ...moreNav], [])
  const active = allPages.find((item) => item.id === page) ?? allPages[0]
  const navigate = (nextPage, replace = false) => {
    setMenuOpen(false)
    setPageState(nextPage)
    const nextUrl = `#/${nextPage}`
    if (replace) {
      window.history.replaceState(null, '', nextUrl)
    } else if (window.location.hash !== nextUrl) {
      window.history.pushState(null, '', nextUrl)
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        {page === 'tickets' && <TicketsPage />}
        {page === 'memberships' && <MembershipPage />}
        {page === 'birthdays' && <BirthdaysPage />}
        {page === 'map' && <MapPage />}
        {page === 'dining' && <DiningPage />}
        {page === 'events' && <EventsPage />}
        {page === 'app' && <MobileAppPage />}
        {page === 'admin' && <AdminPage />}
        {page === 'policies' && <PoliciesPage />}
        {page === 'contact' && <ContactPage />}
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

function Header({ page, setPage, menuOpen, setMenuOpen }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(198,197,209,0.55)] bg-[rgba(251,248,255,0.94)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        <button className="flex items-center gap-3 text-left" onClick={() => setPage('home')}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-3)] text-[var(--primary)] ring-1 ring-[var(--line)]">
            <FerrisWheel size={22} />
          </span>
          <span>
            <span className="font-display block text-2xl font-bold text-[var(--primary)]">Magic Land</span>
            <span className="hidden text-xs font-bold uppercase tracking-wider text-[var(--muted)] sm:block">Family Fun Park</span>
          </span>
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
  const quickActions = [
    [Ticket, 'My Tickets', '2 Active Passes', 'tickets'],
    [MapIcon, 'Interactive Map', 'Find your way', 'map'],
    [Clock3, 'Wait Times', '15-45 mins', 'attractions'],
    [Utensils, 'Dining', 'Food and treats', 'dining'],
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
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/88">Welcome to Magic Land Family Fun Park, a joyful destination with VR games, rides, arcade fun, warm hospitality, and a welcoming experience for everyone.</p>
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
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[rgba(120,220,119,0.28)] text-[#40a346]">
                <Clock3 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#40a346]" />
                  <span className="text-sm font-extrabold uppercase text-[#40a346]">Open</span>
                </div>
                <p className="text-sm font-bold text-[var(--muted)]">10:00 AM - 9:00 PM</p>
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
            <span className="absolute right-4 top-4 rounded-full bg-[rgba(228,31,37,0.92)] px-3 py-1 text-xs font-extrabold text-white">Featured</span>
          </button>
        </section>
      </section>

      <div className="hidden md:block">
        <DesktopAttractions setPage={setPage} />
        <StatusStrip />
      </div>
      <InsideMagicLand setPage={setPage} />
      <div className="md:hidden">
        <AttractionGrid compact setPage={setPage} />
      </div>
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
          <h2 className="font-display mt-2 max-w-3xl text-3xl font-bold leading-tight text-[var(--primary)] md:text-4xl">30 visits for Rs. 2,999.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">More playtime, more laughter, and smarter savings for kids who love VR games, rides, pool, shooting games, and arcade moments.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {['Rs. 100 per entry', '3 months access', 'VR and arcade fun'].map((item) => <span key={item} className="rounded-full bg-[var(--surface-3)] px-4 py-2 text-sm font-extrabold text-[var(--primary)]">{item}</span>)}
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-[var(--primary)] p-5 text-white">
          <p className="text-sm font-extrabold uppercase text-[#ffdad6]">Family Magic Pass</p>
          <p className="font-display mt-2 text-4xl font-bold">Rs. 9,999</p>
          <p className="mt-2 text-sm font-semibold text-white/82">4 members, 120 total entries, about Rs. 83 per visit.</p>
          <button className="sunset mt-5 w-full rounded-full px-5 py-3 font-extrabold" onClick={() => setPage('memberships')}>Compare Savings</button>
        </div>
      </div>
    </section>
  )
}

function InsideMagicLand({ setPage }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-14">
      <SectionIntro eyebrow="What's inside" title="Five experience zones, one full family day" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {zoneCards.map(({ title, zone, icon: Icon, image, copy }) => (
          <button key={title} onClick={() => setPage('attractions')} className="storybook-card group overflow-hidden rounded-[1.5rem] text-left shadow-sm transition hover:-translate-y-1">
            <div className="relative h-40 overflow-hidden">
              <img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
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
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#78dc77]" /> Family friendly</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[var(--line)]" /> Shows</span>
        </div>
        <div className="grid grid-cols-5 gap-5">
          {attractionList.slice(0, 10).map((ride) => (
            <button key={ride.name} onClick={() => setPage('attractions')} className="group text-left">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-lg transition duration-300 group-hover:-translate-y-2">
                <img src={ride.image} alt={ride.name} className="h-full w-full object-cover" />
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
  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 rounded-3xl border border-[rgba(198,197,209,0.55)] bg-white p-4 shadow-xl shadow-[rgba(27,36,90,0.08)] md:grid-cols-4 md:gap-4 md:p-5">
        {[
          ['Open', '10:00 AM - 9:00 PM', Clock3],
          ['Avg. Wait', '15-25 min', FerrisWheel],
          ['Weather', `${weather.temp}C - ${weather.label}`, MapPin],
          ['Next Show', '8:30 PM Parade', Sparkles],
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
  return (
    <PageShell eyebrow="Attractions" title="VR games, skill games, rides, and family fun">
      <div className="mb-7 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {zoneFilters.map((zone) => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
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
              <img src={ride.image} alt={ride.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
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
                <button className="sunset rounded-full px-4 py-2 text-sm font-extrabold" onClick={() => setPage?.('tickets')}>Book Game</button>
                <button className="rounded-full border border-[var(--line)] bg-[var(--surface-3)] px-4 py-2 text-sm font-extrabold text-[var(--primary)]" onClick={() => setPage?.('memberships')}>Use Membership</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function TicketsPage() {
  const [selected, setSelected] = useState(ticketOptions[0])
  const [qty, setQty] = useState(2)
  const [promo, setPromo] = useState('')
  const subtotal = selected.price * qty
  const discount = promo.trim().toUpperCase() === 'MAGIC25' ? Math.round(subtotal * 0.25) : 0
  const total = subtotal - discount

  return (
    <PageShell eyebrow="Tickets" title="Choose one visit or unlock three months of fun">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-4 md:grid-cols-2">
          {ticketOptions.map((ticket) => (
            <button key={ticket.name} onClick={() => setSelected(ticket)} className={`storybook-card rounded-[2rem] p-5 text-left transition ${selected.name === ticket.name ? 'ring-4 ring-[#bbc3ff]' : ''}`}>
              <Ticket className="text-[var(--secondary)]" />
              <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">{ticket.name}</h3>
              <p className="mt-2 text-2xl font-extrabold">Rs. {ticket.price.toLocaleString()}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{ticket.detail}</p>
            </button>
          ))}
        </div>
        <aside className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface-2)] p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--surface-3)] text-[var(--primary)]">
              <Ticket size={21} />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--muted)]">Your visit</p>
              <h3 className="font-display text-2xl font-bold text-[var(--primary)]">Booking Summary</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Visit date<input type="date" className="soft-field" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Guests<input type="number" min="1" max="20" value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} className="soft-field" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Promo code<input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Try MAGIC25" className="soft-field" /></label>
            <div className="rounded-2xl border border-[var(--line)] bg-white p-4 text-sm font-bold">
              <Line label={selected.name} value={`Rs. ${subtotal.toLocaleString()}`} />
              <Line label="Discount" value={`Rs. ${discount.toLocaleString()}`} />
              <Line label="Total" value={`Rs. ${total.toLocaleString()}`} strong />
            </div>
            <button className="sunset rounded-full px-6 py-4 font-extrabold shadow-sm">Continue</button>
            <p className="text-xs leading-5 text-[var(--muted)]">Your visit details will be kept ready for checkout.</p>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}

function MembershipPage() {
  const [selectedPlan, setSelectedPlan] = useState(membershipPlans[0].name)
  const activePlan = membershipPlans.find((plan) => plan.name === selectedPlan) ?? membershipPlans[0]
  const choosePlan = (planName) => {
    setSelectedPlan(planName)
    window.requestAnimationFrame(() => document.getElementById('membership-booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <PageShell eyebrow="Membership Program" title="More visits. More savings.">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] bg-[var(--primary)] p-6 text-white shadow-xl md:p-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#ffdad6]">Best value offer</p>
          <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold leading-tight md:text-5xl">Turn one regular visit into 30 magical memories.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/86">One regular entry is Rs. 1,500. With the Individual Fun Pass, guests get 30 entries for only Rs. 2,999 over 3 months. It is the easiest way to enjoy VR bikes, car simulators, shooting games, pool, arcade fun, and family attractions again and again.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['VR games included', 'Digital pass access', 'Great for weekends'].map((item) => (
              <span key={item} className="rounded-2xl bg-white/12 px-4 py-3 text-sm font-extrabold text-white">{item}</span>
            ))}
          </div>
        </div>
        <aside className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
          <Crown className="text-[var(--secondary)]" />
          <h3 className="font-display mt-4 text-2xl font-bold text-[var(--primary)] md:text-3xl">Why become a member?</h3>
          <div className="mt-5 space-y-3">
            {['Huge savings compared to regular entry', 'More visits without worrying about ticket cost', 'Perfect for weekends, holidays, and after-school fun', 'Priority access to selected offers and events'].map((perk) => <p key={perk} className="text-sm font-bold leading-6 text-[var(--muted)]">- {perk}</p>)}
          </div>
        </aside>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {membershipPlans.map((plan, index) => (
          <article key={plan.name} className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-sm ${index === 0 ? 'border-[#bbc3ff] bg-[var(--surface-3)]' : 'border-[var(--line)] bg-white'}`}>
            {index === 0 && <span className="absolute right-5 top-5 rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-extrabold uppercase text-white">Best value</span>}
            <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">{plan.subtitle}</p>
            <h3 className="font-display mt-2 text-3xl font-bold text-[var(--primary)] md:text-4xl">{plan.name}</h3>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <p className="font-display text-4xl font-bold text-[var(--primary)] md:text-5xl">{plan.price}</p>
              <p className="pb-2 text-sm font-extrabold text-[var(--muted)]">{plan.entries}</p>
            </div>
            <div className="mt-5 rounded-2xl bg-white p-4 md:p-5">
              <p className="font-display text-xl font-bold text-[var(--secondary)] md:text-2xl">{plan.perVisit}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">Regular price value: {plan.regular}</p>
              <p className="mt-1 text-lg font-extrabold text-[var(--primary)]">{plan.savings}</p>
            </div>
            <h4 className="font-display mt-5 text-xl font-bold text-[var(--primary)]">Perfect for</h4>
            <ul className="mt-3 grid gap-2">
              {plan.bestFor.map((item) => <li key={item} className="list-inside list-disc text-sm font-semibold text-[var(--muted)]">{item}</li>)}
            </ul>
            <button className="sunset mt-6 rounded-full px-6 py-4 font-extrabold shadow-sm" onClick={() => choosePlan(plan.name)}>{index === 0 ? 'Buy Individual Fun Pass' : 'Buy Family Magic Pass'}</button>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-sm">
        <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Savings comparison</p>
        <h3 className="font-display mt-2 text-3xl font-bold text-[var(--primary)]">Why pay every time when the fun can continue?</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Line label="One regular entry" value="Rs. 1,500" strong />
          <Line label="30 separate entries" value="Rs. 45,000" strong />
          <Line label="Individual Fun Pass" value="Rs. 2,999" strong />
        </div>
        </div>
        <form id="membership-booking" className="rounded-[2rem] border border-[#bbc3ff] bg-[var(--surface-3)] p-6 shadow-sm">
          <p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">Membership booking</p>
          <h3 className="font-display mt-2 text-2xl font-bold text-[var(--primary)]">{activePlan.name}</h3>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Full name<input className="soft-field" placeholder="Parent or member name" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Phone number<input className="soft-field" placeholder="98XXXXXXXX" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--primary)]">Start date<input type="date" className="soft-field" /></label>
            <div className="rounded-2xl bg-white p-4 text-sm font-bold text-[var(--muted)]">{activePlan.entries} - {activePlan.price}</div>
            <button type="button" className="sunset rounded-full px-6 py-4 font-extrabold shadow-sm">Submit Booking Request</button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}

function BirthdaysPage() {
  return (
    <PageShell eyebrow="Birthday and events" title="Party booking for children, families, schools, and groups">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <article className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <img src={img.birthday} alt="Magic Land birthday party" className="h-80 w-full object-cover" />
          <div className="p-6">
            <h3 className="font-display text-3xl font-bold text-[var(--primary)]">Birthday Kingdom Package</h3>
            <p className="mt-3 leading-8 text-[var(--muted)]">Reserve a decorated hall, select food packages, assign a party host, add ride bundles, include partner gifts, and choose deposit or full payment.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">{['Hall Slot', 'Catering', 'Ride Add-ons'].map((item) => <span key={item} className="rounded-2xl bg-[var(--surface-3)] px-4 py-3 text-sm font-extrabold text-[var(--primary)]">{item}</span>)}</div>
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
  const [routeCoords, setRouteCoords] = useState(routeToPark)
  const [routeLabel, setRouteLabel] = useState('Tokha Bazar')

  const showTokhaRoute = () => {
    setRouteCoords(routeToPark)
    setRouteLabel('Tokha Bazar')
  }

  return (
    <PageShell eyebrow="Location and map" title="Find Magic Land Family Fun Park in Tarakeshwar">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <MapLibreView key={`${routeLabel}-${routeCoords[0]?.join(',')}`} routeCoords={routeCoords} routeLabel={routeLabel} />
        <aside className="glass rounded-[2rem] p-6">
          <MapPin className="text-[var(--secondary)]" />
          <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">Magic Land Family Fun Park</h3>
          <p className="mt-3 leading-7 text-[var(--muted)]">Q836+95P, Tarakeshwar 44600. Preview the Tokha Bazar route or open directions from your current location.</p>
          <div className="mt-6 grid gap-3">
            <button type="button" onClick={showTokhaRoute} className="sunset inline-flex rounded-full px-6 py-4 font-extrabold shadow-sm">Show Tokha Route</button>
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-[var(--line)] px-6 py-4 text-center font-extrabold text-[var(--primary)]">Directions from my location</a>
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
    map.on('error', () => setMapFailed(true))
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
        paint: { 'line-color': '#e41f25', 'line-width': 7, 'line-opacity': 0.88 },
      })
      map.addLayer({
        id: 'tokha-route-arrow',
        type: 'symbol',
        source: 'tokha-route',
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 72,
          'text-field': '›',
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
      new maplibregl.Marker({ color: '#bb0014' }).setLngLat(routeCoords[0]).setPopup(new maplibregl.Popup().setHTML(`<strong>${routeLabel}</strong><br/>Route preview toward Magic Land`)).addTo(map)
      new maplibregl.Marker({ color: '#1b245a' }).setLngLat([tokhaMunicipality.lng, tokhaMunicipality.lat]).setPopup(new maplibregl.Popup().setHTML('<strong>Tokha Municipality</strong><br/>Nearby reference point')).addTo(map)
      new maplibregl.Marker({ color: '#003016' }).setLngLat([park.lng, park.lat]).setPopup(new maplibregl.Popup().setHTML('<strong>Magic Land Family Fun Park</strong><br/>Tarakeshwar 44600')).addTo(map)
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
      <iframe title="Tokha Bazar to Magic Land route map" src={tokhaEmbedUrl} className="absolute inset-0 h-full w-full border-0" loading="lazy" />
      <div className="pointer-events-none relative flex h-full flex-col justify-between p-4">
        <div className="w-fit rounded-2xl bg-white/88 p-4 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--secondary)]">Nearby start</p>
          <h3 className="font-display text-2xl font-bold text-[var(--primary)]">{routeLabel}</h3>
          <p className="text-sm font-semibold text-[var(--muted)]">Road map toward Magic Land</p>
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
  return <SimpleImagePage eyebrow="Dining" title="Snacks, meals, and celebration-friendly food for full family days" image={img.dining} icon={Utensils} items={['Magic Cafe meals', 'Birthday catering add-ons', 'Membership-friendly offers', 'Quick snacks between VR games and rides']} />
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

function MobileAppPage() {
  return (
    <PageShell eyebrow="Mobile app" title="A simple guest app experience for families">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <PhoneMock />
        <div className="grid gap-5 md:grid-cols-2">
          <QuickCard icon={Wallet} title="Digital Wallet" copy="Tickets, memberships, QR codes, gift vouchers, and visit history." />
          <QuickCard icon={MapIcon} title="Park Map" copy="Find rides, dining, restrooms, events, and helpful park locations." />
          <QuickCard icon={Bell} title="Notifications" copy="Flash sales, booking reminders, birthday updates, and parade alerts." />
          <QuickCard icon={Gift} title="Rewards" copy="Collect offers, birthday treats, and membership benefits in one place." />
        </div>
      </div>
    </PageShell>
  )
}

function AdminPage() {
  return (
    <PageShell eyebrow="Operations" title="Admin dashboard preview for sales, QR validation, and guest flow">
      <div className="grid gap-5 md:grid-cols-4">
        {[
        ['Sales', 'Rs. 461K'],
          ['Occupancy', '68%'],
          ['QR Scans', '1,248'],
          ['Promo Use', '24%'],
        ].map(([label, value]) => <div key={label} className="storybook-card rounded-[2rem] p-5"><p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p><p className="font-display mt-2 text-3xl font-bold text-[var(--primary)]">{value}</p></div>)}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <QuickCard icon={QrCode} title="QR Validation" copy="QR membership checks, ticket scans, and duplicate-use prevention." />
        <QuickCard icon={CreditCard} title="Payments" copy="Track ticket sales, deposits, refunds, and booking totals." />
        <QuickCard icon={ShieldCheck} title="Role Access" copy="Admin, scanner staff, finance, and content manager permissions." />
      </div>
    </PageShell>
  )
}

function PoliciesPage() {
  return (
    <PageShell eyebrow="Policies" title="Clear guest information and park rules">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {['About Us', 'Mission & Vision', 'Privacy Policy', 'Terms & Conditions', 'Refund Policy', 'Cancellation Policy', 'Cookie Policy', 'FAQ'].map((item) => (
          <details key={item} className="storybook-card rounded-[2rem] p-5">
            <summary className="cursor-pointer font-display text-xl font-bold text-[var(--primary)]">{item}</summary>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Helpful information for families planning their visit to Magic Land Family Fun Park.</p>
          </details>
        ))}
      </div>
    </PageShell>
  )
}

function ContactPage() {
  return (
    <PageShell eyebrow="Contact" title="Questions, group visits, and booking support">
      <div className="grid gap-5 md:grid-cols-3">
        <QuickCard icon={Phone} title="Phone" copy="+977-9800000000" />
        <QuickCard icon={Mail} title="Email" copy="hello@magicland.fun for enquiries and support@magicland.fun for complaints." />
        <QuickCard icon={MapPin} title="Location" copy="Magic Land Family Fun Park, Q836+95P, Tarakeshwar 44600." />
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
        <img src={image} alt={title} className="h-[460px] w-full rounded-[2rem] object-cover shadow-xl" />
        <div className="glass rounded-[2rem] p-6">
          <Icon className="text-[var(--secondary)]" />
          <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">Made for easy visits</h3>
          <div className="mt-5 space-y-3">{items.map((item) => <div key={item} className="rounded-2xl bg-white p-4 font-bold text-[var(--muted)]">{item}</div>)}</div>
        </div>
      </div>
    </PageShell>
  )
}

function PhoneMock() {
  return (
    <div className="mx-auto max-w-[380px] rounded-[2.5rem] border-8 border-[var(--primary)] bg-[var(--surface)] p-4 shadow-2xl">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[var(--muted)]">Good Morning,</p><h3 className="font-display text-2xl font-bold text-[var(--primary)]">Explorer!</h3></div><Bell /></div>
      <div className="ticket-bg mt-5 rounded-[2rem] p-5 text-white"><p className="text-xs font-bold uppercase text-white/70">Up Next</p><h4 className="font-display text-2xl font-bold">VR Bike Racing</h4><p className="mt-2 text-sm">Member slot - 11:45 AM</p><div className="mt-5 flex justify-between"><span className="rounded-xl bg-white/15 px-3 py-2 font-bold">2 Passes</span><QrCode size={44} /></div></div>
      <div className="mt-5 grid grid-cols-2 gap-3">{[[Ticket, 'Tickets'], [MapIcon, 'Map'], [CalendarDays, 'Events'], [Utensils, 'Dining']].map(([Icon, label]) => <button key={label} className="rounded-2xl bg-white p-4 text-left shadow-sm"><Icon className="text-[var(--secondary)]" /><span className="mt-3 block text-sm font-extrabold">{label}</span></button>)}</div>
    </div>
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

function EventRow({ time, title, place }) {
  return <div className="storybook-card flex items-center gap-4 rounded-[2rem] p-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--primary)] text-white"><Clock3 /></div><div><p className="text-sm font-extrabold text-[var(--secondary)]">{time}</p><h3 className="font-display text-2xl font-bold text-[var(--primary)]">{title}</h3><p className="text-sm font-semibold text-[var(--muted)]">{place}</p></div></div>
}

function Line({ label, value, strong }) {
  return <div className={`flex justify-between border-b border-[var(--line)] py-2 last:border-b-0 ${strong ? 'text-lg text-[var(--primary)]' : 'text-[var(--muted)]'}`}><span>{label}</span><span>{value}</span></div>
}

function Footer({ setPage }) {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface-2)] px-4 py-12 text-[var(--ink)] md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div><div className="flex items-center gap-3"><FerrisWheel className="text-[var(--secondary)]" /><h2 className="font-display text-2xl font-bold text-[var(--primary)]">Magic Land</h2></div><p className="mt-4 max-w-sm leading-7 text-[var(--muted)]">A place where kids laugh, families bond, and memories become magic through VR games, rides, celebrations, and warm hospitality.</p></div>
        <div><h3 className="font-display text-xl font-bold text-[var(--primary)]">Visit</h3><div className="mt-4 grid gap-2">{nav.slice(0, 6).map((item) => <button key={item.id} className="text-left text-[var(--muted)] hover:text-[var(--primary)]" onClick={() => setPage(item.id)}>{item.label}</button>)}</div></div>
        <div><h3 className="font-display text-xl font-bold text-[var(--primary)]">Guest Care</h3><p className="mt-4 text-[var(--muted)]">Privacy, terms, refund, cancellation, cookie policy, and FAQ information are available for guests.</p></div>
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
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around rounded-t-xl border-t border-[var(--line)] bg-[rgba(251,248,255,0.97)] px-4 pt-2 shadow-[0_-4px_12px_rgba(27,36,90,0.08)] backdrop-blur-md md:hidden">
      {items.map((item) => <button key={item.id} onClick={() => setPage(item.id)} className={`flex min-w-14 flex-col items-center gap-1 text-xs font-extrabold outline-none transition focus-visible:ring-2 focus-visible:ring-[#bbc3ff] ${active === item.id ? 'scale-110 text-[var(--secondary)]' : 'text-[var(--muted)]'}`}><item.icon size={22} />{item.label}</button>)}
    </nav>
  )
}

export default App
