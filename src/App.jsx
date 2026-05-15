import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
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
  PartyPopper,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Ticket,
  Utensils,
  Wallet,
} from 'lucide-react'

const park = { lng: 85.3239042, lat: 27.7836311 }
const directionsUrl =
  'https://www.google.com/maps/dir//Magic+Land+Family+Fun+Park,+Q836%2B95P,+Tarakeshwar+44600/@27.7184512,85.3381417,14z/data=!3m1!4b1!4m8!4m7!1m0!1m5!1m1!1s0x39eb1ff50274c9b9:0x2acfcb4719ba6c9d!2m2!1d85.3239042!2d27.7836311'

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

const attractions = [
  { name: 'Dragon Coaster', category: 'High thrill', wait: '25 min', height: '48 in', image: img.coaster, copy: 'A fast outdoor coaster for older kids, teens, and brave parents.' },
  { name: 'Starlight Carousel', category: 'Family', wait: '5 min', height: 'All ages', image: img.carousel, copy: 'A gentle classic ride for toddlers, families, photos, and first-time visitors.' },
  { name: 'Splash Lagoon', category: 'Water play', wait: '15 min', height: '40 in', image: img.splash, copy: 'Cool water moments, bright family seating, and summer-friendly fun.' },
  { name: 'Wonder Arcade', category: 'Indoor', wait: 'Open', height: 'All ages', image: img.arcade, copy: 'Indoor games, prize counters, and weather-proof entertainment.' },
  { name: 'Wizard Theater', category: 'Live show', wait: '5:00 PM', height: 'All ages', image: img.parade, copy: 'Character performances, music, and the park’s signature evening moment.' },
]

const ticketTypes = [
  { name: 'Day Pass', price: 1200, detail: 'One-day entry for rides and family attractions.' },
  { name: 'VIP Pass', price: 2800, detail: 'Priority access, premium parade viewing, and photo perks.' },
  { name: 'Family Bundle', price: 4200, detail: 'Two adults, two children, and a dining voucher.' },
  { name: 'Gift Ticket', price: 1500, detail: 'A shareable ticket for friends and family celebrations.' },
]

const memberPlans = [
  ['Spark Pass', 'NPR 9,999 / year', ['Unlimited weekday visits', '10% dining discount', 'Member-only campaigns']],
  ['Royal Pass', 'NPR 16,999 / year', ['Any-day visits', 'Birthday bonus tickets', 'Priority booking windows']],
  ['Gifted Membership', 'Custom', ['Digital gifting', 'Easy ticket redemption', 'Personalized message']],
]

const schedule = [
  ['10:00 AM', 'Park Gates Open', 'Main Entrance'],
  ['11:30 AM', 'Magic Music Show', 'Midway Stage'],
  ['02:00 PM', 'Birthday Celebration Slots', 'Party Hall'],
  ['05:45 PM', 'Character Meet & Greet', 'Castle Plaza'],
  ['08:30 PM', 'Grand Magic Parade', 'Main Boulevard'],
  ['09:30 PM', 'Starlight Finale', 'Castle Plaza'],
]

function App() {
  const [page, setPage] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const allPages = useMemo(() => [...nav, ...moreNav], [])
  const active = allPages.find((item) => item.id === page) ?? allPages[0]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  return (
    <div className="min-h-screen">
      <Header page={page} setPage={setPage} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'attractions' && <AttractionsPage />}
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
        {page === 'more' && <MorePage setPage={setPage} />}
      </main>
      <Footer setPage={setPage} />
      <BottomNav active={active.id} setPage={setPage} />
    </div>
  )
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
            <span className="hidden text-xs font-bold uppercase tracking-wider text-[var(--muted)] sm:block">Family Fun Park, Tarakeshwar</span>
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
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--primary)] shadow-sm xl:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={22} />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="mx-auto grid max-w-7xl gap-2 px-4 pb-4 md:grid-cols-3 md:px-8 xl:hidden">
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
            <h1 className="font-display text-6xl font-bold leading-tight">Step Into A World Of Pure Imagination</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/88">Plan a full family day with rides, shows, tickets, birthdays, dining, and directions.</p>
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
          <div className="absolute inset-x-0 bottom-0 space-y-4 p-4 pb-16 text-white">
            <h1 className="font-display max-w-[290px] text-4xl font-bold leading-tight">Where Every Moment is Magic</h1>
            <button className="sunset inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold shadow-lg" onClick={() => setPage('attractions')}>
              Explore the Park
              <Sparkles size={18} />
            </button>
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
              <div className="font-display text-2xl font-bold text-[var(--primary)]">24C</div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Sunny Skies</p>
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
      <div className="md:hidden">
        <AttractionGrid compact />
      </div>
      <div className="hidden md:block">
        <MapTeaser setPage={setPage} />
      </div>
    </>
  )
}

function DesktopAttractions({ setPage }) {
  return (
    <section className="bg-[var(--surface-2)] py-14">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[var(--secondary)]">
              <Sparkles />
              <h2 className="font-display text-4xl font-bold text-[var(--primary)]">Popular Attractions</h2>
            </div>
            <p className="mt-3 text-[var(--muted)]">Rides, shows, and family zones guests ask about first.</p>
          </div>
          <div className="flex gap-2">
            {['Today', 'Tomorrow', '16 May', '17 May'].map((day, index) => (
              <button key={day} className={`rounded-lg px-5 py-3 text-sm font-bold ${index === 0 ? 'bg-[var(--primary)] text-white' : 'border border-[var(--line)] bg-white text-[var(--muted)]'}`}>
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
          {attractions.map((ride) => (
            <button key={ride.name} onClick={() => setPage('attractions')} className="group text-left">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-lg transition duration-300 group-hover:-translate-y-2">
                <img src={ride.image} alt={ride.name} className="h-full w-full object-cover" />
                <span className="absolute right-3 top-3 rounded-full bg-white/92 px-3 py-2 text-xs font-extrabold text-[var(--primary)] shadow-sm">{ride.height === 'All ages' ? 'U' : 'PG'}</span>
              </div>
              <h3 className="font-display mt-4 truncate text-2xl font-bold text-[var(--primary)]">{ride.name}</h3>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{ride.wait} | {ride.category}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-[var(--line)] px-3 py-1 text-xs font-bold text-[var(--primary)]">{ride.wait}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatusStrip() {
  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 rounded-3xl border border-[rgba(198,197,209,0.55)] bg-white p-4 shadow-xl shadow-[rgba(27,36,90,0.08)] md:grid-cols-4 md:gap-4 md:p-5">
        {[
          ['Open', '10:00 AM - 9:00 PM', Clock3],
          ['Avg. Wait', '15-25 min', FerrisWheel],
          ['Location', 'Tarakeshwar 44600', MapPin],
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

function AttractionsPage() {
  return (
    <PageShell eyebrow="Attractions" title="Rides, play zones, and family-friendly adventures">
      <AttractionGrid />
    </PageShell>
  )
}

function AttractionGrid({ compact = false }) {
  return (
    <section className={`mx-auto max-w-7xl px-4 ${compact ? 'py-12' : ''} md:px-8`}>
      {compact && <SectionIntro eyebrow="Legendary attractions" title="Rides made for every age group" />}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {attractions.map((ride, index) => (
          <article key={ride.name} className={`storybook-card group rounded-[2rem] p-4 shadow-sm transition hover:-translate-y-1 ${index === 1 ? 'lg:mt-8' : ''}`}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
              <img src={ride.image} alt={ride.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <span className="absolute right-3 top-3 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold text-white">{ride.category}</span>
            </div>
            <h3 className="font-display mt-4 text-2xl font-bold text-[var(--primary)]">{ride.name}</h3>
            <p className="mt-2 min-h-16 text-sm leading-6 text-[var(--muted)]">{ride.copy}</p>
            <div className="mt-4 flex justify-between border-t border-[var(--line)] pt-4 text-xs font-extrabold text-[var(--secondary)]">
              <span>{ride.wait}</span>
              <span>{ride.height}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TicketsPage() {
  const [selected, setSelected] = useState(ticketTypes[0])
  const [qty, setQty] = useState(2)
  const [promo, setPromo] = useState('')
  const subtotal = selected.price * qty
  const discount = promo.trim().toUpperCase() === 'MAGIC25' ? Math.round(subtotal * 0.25) : 0
  const total = subtotal - discount

  return (
    <PageShell eyebrow="Tickets" title="Choose your pass and plan your visit">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-4 md:grid-cols-2">
          {ticketTypes.map((ticket) => (
            <button key={ticket.name} onClick={() => setSelected(ticket)} className={`storybook-card rounded-[2rem] p-5 text-left transition ${selected.name === ticket.name ? 'ring-4 ring-[#bbc3ff]' : ''}`}>
              <Ticket className="text-[var(--secondary)]" />
              <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">{ticket.name}</h3>
              <p className="mt-2 text-2xl font-extrabold">NPR {ticket.price.toLocaleString()}</p>
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
              <Line label={selected.name} value={`NPR ${subtotal.toLocaleString()}`} />
              <Line label="Discount" value={`NPR ${discount.toLocaleString()}`} />
              <Line label="Total" value={`NPR ${total.toLocaleString()}`} strong />
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
  return (
    <PageShell eyebrow="Membership" title="Annual magic for regular guests and gifted family passes">
      <div className="grid gap-5 md:grid-cols-3">
        {memberPlans.map(([name, price, perks]) => (
          <article key={name} className="storybook-card rounded-[2rem] p-6">
            <Crown className="text-[var(--secondary)]" />
            <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">{name}</h3>
            <p className="mt-2 text-xl font-extrabold">{price}</p>
            <ul className="mt-5 space-y-3">
              {perks.map((perk) => <li key={perk} className="flex gap-2 text-sm font-semibold text-[var(--muted)]"><ShieldCheck className="shrink-0 text-[var(--primary)]" size={18} />{perk}</li>)}
            </ul>
          </article>
        ))}
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
        <div className="rounded-2xl bg-white p-4 text-sm font-bold">Draft package: {kids} children - {deposit}</div>
        <button type="button" className="sunset rounded-full px-6 py-4 font-extrabold shadow-sm">Save Reservation</button>
      </div>
    </form>
  )
}

function MapPage() {
  return (
    <PageShell eyebrow="Location and map" title="Find Magic Land Family Fun Park in Tarakeshwar">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <MapLibreView />
        <aside className="glass rounded-[2rem] p-6">
          <MapPin className="text-[var(--secondary)]" />
          <h3 className="font-display mt-4 text-3xl font-bold text-[var(--primary)]">Magic Land Family Fun Park</h3>
          <p className="mt-3 leading-7 text-[var(--muted)]">Q836+95P, Tarakeshwar 44600. Coordinates: 27.7836311, 85.3239042.</p>
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="sunset mt-6 inline-flex rounded-full px-6 py-4 font-extrabold shadow-sm">Open Google Directions</a>
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm leading-6 text-[var(--muted)]">Use the map to check the park area, nearby roads, and the easiest arrival route before your visit.</div>
        </aside>
      </div>
    </PageShell>
  )
}

function MapLibreView() {
  const container = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!container.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: container.current,
      center: [park.lng, park.lat],
      zoom: 15.8,
      maxZoom: 18,
      pitch: 64,
      bearing: -28,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 18,
            attribution: 'OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.on('load', () => {
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
      new maplibregl.Marker({ color: '#003016' }).setLngLat([park.lng, park.lat]).setPopup(new maplibregl.Popup().setHTML('<strong>Magic Land Family Fun Park</strong><br/>Tarakeshwar 44600')).addTo(map)
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={container} className="h-[520px] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-3)] shadow-xl md:h-[680px]" />
}

function zone(name, coords, height, color) {
  return { type: 'Feature', properties: { name, height, color }, geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] } }
}

function DiningPage() {
  return <SimpleImagePage eyebrow="Dining" title="Family food, birthday catering, and mobile-order ready menus" image={img.dining} icon={Utensils} items={['Magic Cafe meals', 'Birthday catering add-ons', 'Voucher and partner offers', 'Future mobile ordering']} />
}

function EventsPage() {
  return (
    <PageShell eyebrow="Calendar" title="Park hours, shows, parades, and seasonal events">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="glass rounded-[2rem] p-6">
          <h3 className="font-display text-2xl font-bold text-[var(--primary)]">Today</h3>
          <p className="mt-2 text-[var(--muted)]">Open 10:00 AM - 9:00 PM</p>
          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-sm font-bold">{Array.from({ length: 31 }, (_, i) => <span key={i} className={`rounded-full py-2 ${i + 1 === 14 ? 'bg-[var(--primary)] text-white' : 'bg-white text-[var(--muted)]'}`}>{i + 1}</span>)}</div>
        </div>
        <div className="space-y-3">{schedule.map(([time, title, place]) => <EventRow key={title} time={time} title={title} place={place} />)}</div>
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
          ['Sales', 'NPR 461K'],
          ['Occupancy', '68%'],
          ['QR Scans', '1,248'],
          ['Promo Use', '24%'],
        ].map(([label, value]) => <div key={label} className="storybook-card rounded-[2rem] p-5"><p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p><p className="font-display mt-2 text-3xl font-bold text-[var(--primary)]">{value}</p></div>)}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <QuickCard icon={QrCode} title="QR Validation" copy="Encrypted QR generation, turnstile scanner flow, duplicate-use prevention." />
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
      <div className="ticket-bg mt-5 rounded-[2rem] p-5 text-white"><p className="text-xs font-bold uppercase text-white/70">Up Next</p><h4 className="font-display text-2xl font-bold">Dragon Coaster</h4><p className="mt-2 text-sm">Lightning Lane - 11:45 AM</p><div className="mt-5 flex justify-between"><span className="rounded-xl bg-white/15 px-3 py-2 font-bold">2 Passes</span><QrCode size={44} /></div></div>
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
  return <div className="mx-auto mb-8 mt-10 max-w-7xl px-4 md:mt-14 md:px-8"><p className="text-sm font-extrabold uppercase tracking-wide text-[var(--secondary)]">{eyebrow}</p><h2 className="font-display mt-4 max-w-3xl text-4xl font-bold leading-tight text-[var(--primary)]">{title}</h2></div>
}

function PageShell({ eyebrow, title, children }) {
  return <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16"><div className="mb-8 max-w-4xl"><p className="text-sm font-extrabold uppercase tracking-wider text-[var(--secondary)]">{eyebrow}</p><h1 className="font-display mt-2 text-4xl font-bold leading-tight text-[var(--primary)] md:text-6xl">{title}</h1></div>{children}</section>
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
        <div><div className="flex items-center gap-3"><FerrisWheel className="text-[var(--secondary)]" /><h2 className="font-display text-2xl font-bold text-[var(--primary)]">Magic Land</h2></div><p className="mt-4 max-w-sm leading-7 text-[var(--muted)]">Magic Land Family Fun Park is a family destination for rides, birthdays, dining, events, and joyful days out.</p></div>
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
