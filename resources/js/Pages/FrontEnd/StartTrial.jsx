import { Head, Link, useForm } from '@inertiajs/react';
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

export default function StartTrial() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    phone: '',
    cafe_name: '',
    password: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('register'));
  };

  return (
    <>
      <Head title="Start Free Trial — CREMA.OS" />

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
            
            <Link href="/book-demo" className="text-sm font-bold text-stone-500 transition-colors hover:text-stone-900">
              Talk to sales instead &rarr;
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
                Your shop, live in <br/><span className="text-orange-600">60 seconds.</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="mb-8 max-w-lg text-pretty text-lg text-stone-500 sm:text-xl">
                We'll spin up your workspace, import a sample menu, and walk you to your first sale.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-6 border-t border-stone-200 pt-8">
                <div>
                  <div className="mb-2 text-2xl font-bold text-stone-900">30</div>
                  <div className="text-xs font-bold tracking-widest text-stone-400">DAYS FREE</div>
                </div>
                <div>
                  <div className="mb-2 text-2xl font-bold text-stone-900">0</div>
                  <div className="text-xs font-bold tracking-widest text-stone-400">CREDIT CARD</div>
                </div>
                <div>
                  <div className="mb-2 flex items-center text-2xl font-bold text-stone-900">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-6 w-6 text-orange-600"><path d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div className="text-xs font-bold tracking-widest text-stone-400">FULL ACCESS</div>
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
                  <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
                  <p className="mt-2 text-sm text-stone-500">Takes about 30 seconds.</p>
                </div>

                <form className="space-y-4" onSubmit={submit}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500">FULL NAME</label>
                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required className="w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-sm ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-orange-600" placeholder="Mira Okafor" />
                    {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500">WORK EMAIL</label>
                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} required className="w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-sm ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-orange-600" placeholder="you@cafe.com" />
                    {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500">PHONE NUMBER</label>
                    <div className="flex rounded-xl bg-stone-50 ring-1 ring-inset ring-stone-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-600">
                      <select className="bg-transparent py-3 pl-4 pr-8 text-sm font-medium text-stone-500 border-none focus:ring-0">
                        <option value="+977">NP (+977)</option>
                        <option value="+1">US (+1)</option>
                        <option value="+1">CA (+1)</option>
                        <option value="+44">UK (+44)</option>
                        <option value="+61">AU (+61)</option>
                        <option value="+64">NZ (+64)</option>
                        <option value="+91">IN (+91)</option>
                        <option value="+49">DE (+49)</option>
                        <option value="+33">FR (+33)</option>
                        <option value="+81">JP (+81)</option>
                        <option value="+86">CN (+86)</option>
                        <option value="+971">AE (+971)</option>
                        <option value="+65">SG (+65)</option>
                        <option value="+55">BR (+55)</option>
                        <option value="+27">ZA (+27)</option>
                      </select>
                      <input type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} required className="w-full bg-transparent border-0 px-4 py-3 text-sm focus:ring-0" placeholder="(555) 000-0000" />
                    </div>
                    {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500">CAFE NAME</label>
                    <input type="text" value={data.cafe_name} onChange={e => setData('cafe_name', e.target.value)} required className="w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-sm ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-orange-600" placeholder="Acme Coffee" />
                    {errors.cafe_name && <div className="text-xs text-red-500 mt-1">{errors.cafe_name}</div>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500">PASSWORD</label>
                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} required className="w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-sm ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-inset focus:ring-orange-600" placeholder="••••••••" />
                    {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password}</div>}
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={processing} className="w-full rounded-xl bg-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02] hover:bg-orange-500 disabled:opacity-50">
                      Start 30-Day Free Trial
                    </button>
                  </div>
                </form>
                
                <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-stone-400">
                  By continuing you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
