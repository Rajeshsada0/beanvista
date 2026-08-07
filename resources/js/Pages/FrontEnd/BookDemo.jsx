import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function BookDemo() {
  const { flash } = usePage().props;
  const { data, setData, post, processing, errors, reset } = useForm({
    first_name: '',
    last_name: '',
    email: '',
    cafe_name: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('book-demo.store'), {
      onSuccess: () => {
        reset();
      }
    });
  };

  return (
    <>
      <Head title="Book a Demo — CREMA.OS" />

      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-500/30">
        <nav className="absolute top-0 z-50 w-full">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-600">
                <div className="absolute h-3 w-3 animate-ping rounded-full bg-white/30" />
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight sm:text-xl">CREMA.OS</span>
            </Link>
            
            <Link href="/start-trial" className="text-sm font-bold text-stone-500 transition-colors hover:text-stone-900">
              Skip — Start free trial &rarr;
            </Link>
          </div>
        </nav>

        <main className="relative flex min-h-screen items-center px-4 pt-24 sm:px-6 lg:px-8">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-orange-600/10 blur-[100px]" />
            <div className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-orange-600/10 blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-2xl"
            >
              <motion.h1 variants={fadeInUp} className="mb-6 text-balance text-4xl font-extrabold leading-[1.1] tracking-tighter sm:text-5xl md:text-6xl">
                See your shop running on <span className="text-orange-600">CREMA.OS.</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="mb-8 text-pretty text-lg text-stone-500 sm:text-xl">
                A real cafe operator on the call — no SDR scripts. We'll mirror your menu, your floor plan, and your KDS in under 15 minutes.
              </motion.p>
              
              <motion.ul variants={staggerContainer} className="mb-10 space-y-4">
                {[
                  "Live KDS demo with your top 5 menu items",
                  "Floor plan import from your current system",
                  "Custom pricing tailored to your shop count",
                  "Migration plan with zero downtime"
                ].map((item, i) => (
                  <motion.li variants={fadeInUp} key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3"><path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="font-medium text-stone-700">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div variants={fadeInUp} className="rounded-2xl border border-stone-200 bg-white/50 p-6 backdrop-blur-sm">
                <p className="mb-3 text-lg italic text-stone-700">"Set up in 4 days. ROI by week 3."</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-stone-200" />
                  <div>
                    <div className="text-sm font-bold text-stone-900">Mira Okafor</div>
                    <div className="text-xs font-mono text-stone-500">GREYFERN COFFEE</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <div className="relative mx-auto w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl shadow-stone-200/50 ring-1 ring-stone-200 sm:p-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">Pick a time</h2>
                  <p className="mt-2 text-sm text-stone-500">All times in your local timezone. Reschedule anytime.</p>
                </div>

                {flash?.success && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold">
                    {flash.success}
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500">FIRST NAME</label>
                      <input 
                        type="text" 
                        value={data.first_name} 
                        onChange={e => setData('first_name', e.target.value)} 
                        className="w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-sm ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-orange-600" 
                        placeholder="Mira" 
                        required 
                      />
                      {errors.first_name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.first_name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500">LAST NAME</label>
                      <input 
                        type="text" 
                        value={data.last_name} 
                        onChange={e => setData('last_name', e.target.value)} 
                        className="w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-sm ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-orange-600" 
                        placeholder="Okafor" 
                        required 
                      />
                      {errors.last_name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.last_name}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500">WORK EMAIL</label>
                    <input 
                      type="email" 
                      value={data.email} 
                      onChange={e => setData('email', e.target.value)} 
                      className="w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-sm ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-orange-600" 
                      placeholder="mira@greyfern.coffee" 
                      required 
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500">CAFE NAME</label>
                    <input 
                      type="text" 
                      value={data.cafe_name} 
                      onChange={e => setData('cafe_name', e.target.value)} 
                      className="w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-sm ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-orange-600" 
                      placeholder="Greyfern Coffee" 
                      required 
                    />
                    {errors.cafe_name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.cafe_name}</p>}
                  </div>
 
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={processing} 
                      className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {processing ? 'Booking...' : 'View Availability \u2192'}
                    </button>
                  </div>
                </form>
                
                <p className="mt-6 text-center text-xs text-stone-400">
                  No card required. We'll send a calendar invite within minutes.
                </p>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
