import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const ParallaxImage = ({ src, alt, className, reverse = false }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  // Move image down as we scroll down, creating a parallax effect
  const y = useTransform(scrollYProgress, [0, 1], reverse ? [80, -80] : [-80, 80]);
  // Rotate the image slightly as we scroll
  const rotate = useTransform(scrollYProgress, [0, 1], reverse ? [-15, 15] : [15, -15]);

  return (
    <motion.img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={{ y, rotate }}
    />
  );
};

export default function Home() {
  const { auth } = usePage().props;
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { scrollY } = useScroll();
  
  // Hero section image rotations based on global scroll
  const heroCoffeeRotate = useTransform(scrollY, [0, 1000], [8, 45]); // Starts at 8deg
  const heroCroissantRotate = useTransform(scrollY, [0, 1000], [-12, -50]); // Starts at -12deg

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <Head title="CREMA.OS — The Operating System for Cafes" />

      <div className="min-h-screen overflow-x-hidden bg-stone-50 text-stone-900 font-sans selection:bg-orange-500/30">
        <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-stone-50/80 backdrop-blur-xl border-b border-stone-200' : 'bg-transparent'}`}>
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-600">
                <div className="absolute h-3 w-3 animate-ping rounded-full bg-white/30" />
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight sm:text-xl">CREMA.OS</span>
            </Link>
            
            <div className="hidden items-center gap-9 text-sm font-medium text-stone-500 md:flex">
              <a href="#features" className="transition-colors hover:text-stone-900">Features</a>
              <a href="#kds" className="transition-colors hover:text-stone-900">KDS</a>
              <a href="#pricing" className="transition-colors hover:text-stone-900">Pricing</a>
              <a href="#customers" className="transition-colors hover:text-stone-900">Customers</a>
            </div>
            
            <div className="flex items-center gap-4">
              {auth.user ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-900 transition-colors hover:bg-stone-200 outline-none cursor-pointer"
                  >
                    <div className="h-5 w-5 overflow-hidden rounded-full bg-orange-200 flex items-center justify-center text-[10px] text-orange-700">
                      {auth.user.name.charAt(0).toUpperCase()}
                    </div>
                    {auth.user.name}
                    <motion.svg 
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="h-4 w-4 opacity-50"
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </motion.svg>
                  </button>
                  
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-48 flex flex-col rounded-2xl border border-stone-200 bg-white p-2 shadow-xl z-50 origin-top-right"
                      >
                        <Link 
                          href="/dashboard" 
                          onClick={() => setDropdownOpen(false)}
                          className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                        >
                          Dashboard
                        </Link>
                        <Link 
                          href="/profile" 
                          onClick={() => setDropdownOpen(false)}
                          className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                        >
                          Profile
                        </Link>
                        <div className="my-1 h-px bg-stone-100 mx-2" />
                        <Link 
                          href={route('logout')} 
                          method="post" 
                          as="button" 
                          onClick={() => setDropdownOpen(false)}
                          className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Log Out
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-bold text-stone-900 transition-colors hover:text-orange-600">
                    Log in
                  </Link>
                  <a href="/book-demo" className="shrink-0 whitespace-nowrap rounded-full bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-orange-600 sm:px-5 sm:text-sm">
                    Book Demo
                  </a>
                </>
              )}
            </div>
          </div>
        </nav>

        <main className="relative">
          {/* Hero Section */}
          <section className="px-4 pb-20 pt-24 sm:px-6 sm:pb-32 sm:pt-32 lg:pt-40">
            <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.span variants={fadeInUp} className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-orange-600 sm:text-xs">
                  Release 2.4 — 3D POS Ecosystem
                </motion.span>
                <motion.h1 variants={fadeInUp} className="mb-6 text-balance text-5xl font-extrabold leading-[0.9] tracking-tighter sm:mb-8 sm:text-6xl md:text-7xl lg:text-8xl">
                  The Operating <br />
                  <span className="text-orange-600">System</span> for Flavor.
                </motion.h1>
                <motion.p variants={fadeInUp} className="mb-8 max-w-[45ch] text-pretty text-base text-stone-500 sm:mb-10 sm:text-xl">
                  Streamline your kitchen, automate your front-of-house, and craft the perfect guest experience with the world's first 3D-native cafe SaaS.
                </motion.p>
                <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 sm:gap-4">
                  <a href="/start-trial" className="rounded-xl bg-orange-600 px-6 py-3.5 font-bold text-white shadow-xl shadow-orange-600/25 transition-transform hover:scale-105 sm:px-8 sm:py-4">
                    Start Free Trial
                  </a>
                  <a href="/book-demo" className="rounded-xl bg-white px-6 py-3.5 font-bold text-stone-900 ring-1 ring-stone-200 transition-colors hover:bg-stone-100 sm:px-8 sm:py-4">
                    Book a Demo
                  </a>
                </motion.div>
                <motion.div variants={fadeInUp} className="mt-10 flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-stone-500 sm:mt-12 sm:gap-8 sm:text-xs">
                  <div>
                    <span className="block font-sans text-base font-bold normal-case tracking-tight text-stone-900 sm:text-lg">4,000+</span>
                    cafes
                  </div>
                  <div>
                    <span className="block font-sans text-base font-bold normal-case tracking-tight text-stone-900 sm:text-lg">99.99%</span>
                    uptime
                  </div>
                  <div>
                    <span className="block font-sans text-base font-bold normal-case tracking-tight text-stone-900 sm:text-lg">28</span>
                    countries
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Hero Images Grid / Layout */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative flex h-[400px] items-center justify-center sm:h-[520px] lg:h-[640px]"
              >
                <div className="absolute h-[280px] w-[280px] rounded-full bg-orange-600/15 blur-3xl sm:h-[420px] sm:w-[420px]" />
                
                {/* Tablet */}
                <div className="absolute z-0 -translate-x-16 translate-y-20 sm:-translate-x-28 sm:translate-y-32">
                  <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  >
                    <div className="overflow-hidden rounded-2xl bg-stone-900 shadow-2xl ring-1 ring-white/10 w-[220px] sm:w-[320px] aspect-[4/3]">
                      <img src="https://cafe-animate-scroll.lovable.app/assets/kds-interface-Bm_UZdPZ.png" alt="Kitchen display system" className="h-full w-full object-cover" />
                    </div>
                  </motion.div>
                </div>

                {/* Coffee Cup */}
                <div className="absolute z-20">
                  <motion.div 
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
                    style={{ rotate: heroCoffeeRotate }}
                  >
                    <img src="https://cafe-animate-scroll.lovable.app/assets/3d-espresso-cup-C8Cnw9Hy.png" alt="3D espresso cup" className="h-auto w-[220px] drop-shadow-[0_50px_60px_rgba(0,0,0,0.35)] sm:w-[320px]" />
                  </motion.div>
                </div>

                {/* Croissant */}
                <div className="absolute z-10 -translate-y-20 translate-x-24 sm:-translate-y-28 sm:translate-x-40">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
                    style={{ rotate: heroCroissantRotate }}
                  >
                    <img src="https://cafe-animate-scroll.lovable.app/assets/3d-croissant-TEgu43Fl.png" alt="3D croissant" className="h-auto w-[140px] drop-shadow-[0_30px_40px_rgba(0,0,0,0.3)] sm:w-[200px]" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="border-y border-stone-200 bg-white/60 py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="mb-12 max-w-2xl sm:mb-16"
              >
                <span className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-orange-600 sm:text-xs">
                  One platform, every shift
                </span>
                <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  Built for the rush. Quiet enough for the slow Sundays.
                </h2>
              </motion.div>
              
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-6"
              >
                <motion.div variants={fadeInUp} id="kds" className="group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:min-h-[400px] sm:p-10 md:col-span-2">
                  <div>
                    <span className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-orange-600">Real-time Sync</span>
                    <h3 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">Intelligent Kitchen Display</h3>
                    <p className="max-w-sm text-stone-500">Orders sorted by prep-time, integrated with inventory alerts. No more paper trails, no more missed modifiers.</p>
                  </div>
                  <div className="mt-8 translate-y-8 transition-transform duration-700 group-hover:translate-y-2">
                    <img src="https://cafe-animate-scroll.lovable.app/assets/kds-interface-Bm_UZdPZ.png" alt="KDS preview" className="h-40 w-full rounded-t-xl border border-stone-200 object-cover sm:h-52" />
                  </div>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="flex min-h-[260px] flex-col justify-between gap-8 rounded-3xl bg-orange-600 p-6 text-white shadow-lg shadow-orange-600/20 sm:p-10 md:min-h-[400px]">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-2xl font-bold">Table Booking</h3>
                    <p className="text-white/80">Automated floor plans, waitlist SMS, and no-show predictions — stitched into your POS.</p>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-3xl bg-stone-900 text-white p-6 shadow-xl sm:min-h-[400px] sm:p-10 md:col-span-2">
                  <div>
                    <span className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-orange-500">DYNAMIC IDENTITY</span>
                    <h3 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">Custom Café Branding & Profiles</h3>
                    <p className="max-w-sm text-stone-300">Your café's logo, custom theme settings, and dynamic alphabet avatar initials for active cashiers are fully integrated. No more static layouts—your brand and cashier profiles are unified right at the counter.</p>
                  </div>
                  <div className="mt-8 translate-y-8 transition-transform duration-700 group-hover:translate-y-2">
                    <img src="/images/pos-viewer-mockup.png" alt="POS dynamic logo and profile initials preview" className="h-40 w-full rounded-t-xl border border-stone-850 object-cover sm:h-52" />
                  </div>
                </motion.div>

                {[
                  { title: 'Smart Loyalty', desc: 'Predictive rewards based on customer behavior, weather, and time of day.' },
                  { title: 'Live Inventory', desc: 'Recipe-aware deductions and gram-level COGS tracking, in real-time.' },
                  { title: 'Advanced Analytics', desc: 'Hourly margin reports, server leaderboards, and waste insights at a glance.' },
                  { title: 'Global Payments', desc: 'Tap-to-pay, QR, and split-tender at a flat 0.5% across 28 markets.' },
                  { title: 'Online Ordering', desc: 'Branded storefront with menu sync — your kitchen sees every order in one queue.' }
                ].map((feature, i) => (
                  <motion.div variants={fadeInUp} key={i} className="rounded-3xl bg-stone-100 p-6 ring-1 ring-stone-200 transition-colors hover:bg-white sm:p-8">
                    <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                    <p className="text-sm text-stone-500">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Scrolling Menu */}
          <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
            <div className="mx-auto max-w-7xl">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="mb-16 text-center sm:mb-24"
              >
                <span className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-orange-600 sm:text-xs">Scroll the menu</span>
                <h2 className="text-balance text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl">
                  Every dish, <span className="text-orange-600 italic">choreographed.</span>
                </h2>
              </motion.div>

              <div className="space-y-24 sm:space-y-40">
                {[
                  { tag: 'Pastry / 04:32 prep', title: 'Buttery Croissant', desc: 'Lamination tracked layer-by-layer. Inventory updates the moment butter hits the oven.', img: '3d-croissant-TEgu43Fl.png', reverse: false },
                  { tag: 'Mains / 06:10 prep', title: 'Smash Burger', desc: 'Modifier-aware routing fires patties and buns in the right sequence — every single time.', img: '3d-burger-CNwmPVt0.png', reverse: true },
                  { tag: 'Brunch / 05:45 prep', title: 'Maple Stack', desc: 'Recipe-linked yields auto-deduct flour, eggs, and syrup down to the gram.', img: '3d-pancakes-DmHlzk8k.png', reverse: false },
                  { tag: 'Bar / 02:18 prep', title: 'Iced Matcha', desc: 'Bar tickets land on a separate KDS lane. No more lost drinks at the pass.', img: '3d-matcha-CLKRyMDz.png', reverse: true },
                ].map((item, i) => (
                  <div key={i} className="grid items-center gap-8 md:grid-cols-2 sm:gap-12">
                    <div className={`relative flex h-[300px] items-center justify-center sm:h-[420px] md:h-[520px] ${item.reverse ? 'md:order-2' : ''}`}>
                      <div className="absolute inset-0 m-auto h-[240px] w-[240px] rounded-full bg-orange-600 opacity-40 blur-3xl sm:h-[340px] sm:w-[340px] md:h-[420px] md:w-[420px]" />
                      <ParallaxImage 
                        src={`https://cafe-animate-scroll.lovable.app/assets/${item.img}`}
                        alt={item.title} 
                        className="relative h-auto w-[230px] drop-shadow-[0_40px_60px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:scale-105 hover:-translate-y-4 sm:w-[320px] md:w-[440px]"
                        reverse={item.reverse}
                      />
                    </div>
                    <motion.div 
                      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                      variants={fadeInUp}
                      className={`text-center md:text-left ${item.reverse ? 'md:order-1' : ''}`}
                    >
                      <span className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-orange-600 sm:text-[11px]">{item.tag}</span>
                      <h3 className="mb-4 text-balance text-3xl font-extrabold tracking-tight sm:mb-6 sm:text-4xl md:text-5xl">{item.title}</h3>
                      <p className="mx-auto max-w-md text-pretty text-base text-stone-500 md:mx-0 sm:text-lg">{item.desc}</p>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="py-24 sm:py-32">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="mb-12 text-center sm:mb-16"
              >
                <span className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-orange-600 sm:text-xs">Pricing</span>
                <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">Simple, scaled to your shop.</h2>
                <p className="text-stone-500">Built to grow with your first cafe — or your hundredth.</p>
              </motion.div>
              
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="grid items-stretch gap-6 pt-4 md:grid-cols-3"
              >
                <motion.div variants={fadeInUp} className="relative flex flex-col rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                  <span className="mb-4 font-mono text-xs text-stone-500">01 / STARTER</span>
                  <div className="mb-1 text-5xl font-extrabold tracking-tight">$49<span className="text-sm font-normal text-stone-500">/mo</span></div>
                  <p className="mb-8 text-xs text-stone-500">Billed annually</p>
                  <ul className="mb-8 flex-grow space-y-3 text-sm text-stone-500">
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>1 POS terminal</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Basic analytics</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Online ordering</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Email support</li>
                  </ul>
                  <a href="/start-trial" className="w-full rounded-xl py-3 text-center font-bold ring-1 ring-stone-200 transition-all hover:bg-stone-50">Select Plan</a>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="relative flex flex-col rounded-3xl bg-stone-900 p-6 text-white shadow-2xl shadow-stone-900/20 ring-1 ring-stone-900 md:scale-[1.03] sm:p-8">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Most Popular</div>
                  <span className="mb-4 font-mono text-xs opacity-60">02 / PROFESSIONAL</span>
                  <div className="mb-1 text-5xl font-extrabold tracking-tight">$129<span className="text-sm font-normal opacity-60">/mo</span></div>
                  <p className="mb-8 text-xs opacity-60">Billed annually</p>
                  <ul className="mb-8 flex-grow space-y-3 text-sm opacity-90">
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>5 POS terminals</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Pro KDS integration</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Inventory management</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Customer loyalty</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Priority support</li>
                  </ul>
                  <a href="/start-trial" className="w-full rounded-xl bg-orange-600 py-3 text-center font-bold text-white transition-all hover:opacity-90">Start 30-Day Trial</a>
                </motion.div>

                <motion.div variants={fadeInUp} className="relative flex flex-col rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                  <span className="mb-4 font-mono text-xs text-stone-500">03 / ENTERPRISE</span>
                  <div className="mb-1 text-5xl font-extrabold tracking-tight">Custom</div>
                  <p className="mb-8 text-xs text-stone-500">Billed annually</p>
                  <ul className="mb-8 flex-grow space-y-3 text-sm text-stone-500">
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Unlimited terminals</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Multi-site dashboard</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Dedicated manager</li>
                    <li className="flex items-start gap-2"><span className="mt-0.5 text-orange-600">●</span>Custom API access</li>
                  </ul>
                  <a href="/book-demo" className="w-full rounded-xl py-3 text-center font-bold ring-1 ring-stone-200 transition-all hover:bg-stone-50">Contact Sales</a>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* CTA */}
          <section id="customers" className="px-4 py-20 sm:px-6 sm:py-24">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative mx-auto overflow-hidden rounded-[28px] bg-stone-900 p-8 text-center text-white sm:rounded-[40px] sm:p-12 md:p-20"
            >
              <div className="absolute inset-0 animate-pulse bg-orange-600/15 blur-[120px]" />
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-600/30 blur-3xl" />
              <div className="relative z-10">
                <span className="mb-6 block font-mono text-[10px] uppercase tracking-widest text-orange-600 sm:text-xs">Brew the future</span>
                <h2 className="mb-8 text-balance text-4xl font-extrabold tracking-tighter sm:mb-10 sm:text-5xl md:text-7xl">Brew a better business.</h2>
                <a href="/start-trial" className="inline-block transform rounded-full bg-white px-8 py-4 text-base font-bold text-stone-900 transition-all hover:scale-105 hover:bg-orange-600 hover:text-white sm:px-12 sm:py-5 sm:text-lg">
                  Join the CREMA.OS Network
                </a>
                <p className="mt-8 font-mono text-xs text-white/50 sm:text-sm">Used by 4,000+ specialty cafes globally.</p>
              </div>
            </motion.div>
          </section>
        </main>

        <footer className="border-t border-stone-200 py-10 sm:py-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left sm:gap-8">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-stone-900" />
              <span className="font-bold tracking-tight">CREMA.OS</span>
            </div>
            <div className="flex gap-10 font-mono text-xs uppercase tracking-widest text-stone-500">
              <a href="#" className="transition-colors hover:text-orange-600">Legal</a>
              <a href="#" className="transition-colors hover:text-orange-600">Privacy</a>
              <a href="#" className="transition-colors hover:text-orange-600">Changelog</a>
              <a href="#" className="transition-colors hover:text-orange-600">Status</a>
            </div>
            <p className="font-mono text-[10px] text-stone-500">© 2026 DIGITAL ROASTERS LLC</p>
          </div>
        </footer>
      </div>
    </>
  );
}
