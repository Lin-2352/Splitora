"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  const ref = useRef(null);

  return (
    <section
      ref={ref}
      className="relative pt-32 pb-10 lg:pt-48 lg:pb-16 w-full flex flex-col items-center justify-center bg-transparent text-white light:text-slate-900"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[50%] -translate-x-1/2 w-full h-[30rem] bg-cyan-500/10 rounded-full blur-[150px]" />
        
        {/* Subtle Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto">


        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 light:from-slate-900 light:via-slate-700 light:to-slate-500"
        >
          Split the bill. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Keep the peace.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl lg:text-2xl text-slate-400 light:text-slate-600 mb-12 max-w-3xl leading-relaxed font-light"
        >
          Splitora is the intelligent expense management platform that parses your receipts, simplifies complex debts, and settles balances instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full"
        >
          <Link
            href="/signup"
            className="group w-full sm:w-auto flex items-center justify-center px-8 py-4 text-lg font-semibold text-slate-950 transition-all duration-300 bg-emerald-400 rounded-full hover:bg-emerald-300 shadow-[0_0_40px_-10px_rgba(52,211,153,0.5)] hover:shadow-[0_0_60px_-15px_rgba(52,211,153,0.7)] hover:-translate-y-1"
          >
            Start Splitting Free
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#features"
            className="group w-full sm:w-auto flex flex-row items-center justify-center px-8 py-4 text-lg font-semibold text-white light:text-slate-900 transition-all duration-300 bg-slate-800/40 light:bg-white border border-slate-700/50 light:border-slate-200 rounded-full hover:bg-slate-800/80 light:hover:bg-slate-50 backdrop-blur-xl hover:-translate-y-1 light:shadow-lg light:hover:shadow-xl"
          >
            See How It Works
          </Link>
        </motion.div>
        
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 md:mt-16 w-full max-w-4xl mx-auto h-[400px] md:h-[500px] relative rounded-3xl border border-slate-800/50 light:border-slate-200/50 bg-slate-900/20 light:bg-white/40 backdrop-blur-xl shadow-lg flex items-center justify-center overflow-hidden"
          >
            {/* The Animated Receipt */}
            <motion.div 
              className="absolute left-[50%] top-[55%] -translate-x-1/2 -translate-y-1/2 w-48 md:w-56 bg-white light:bg-slate-50 rounded-xl shadow-2xl p-4 md:p-5 flex flex-col gap-3 md:gap-4 z-10 border border-slate-200 overflow-hidden"
              initial={{ y: "-50%", x: "-50%" }}
              animate={{ y: ["-48%", "-44%", "-48%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="w-full h-8 flex items-center justify-center border-b border-dashed border-slate-300 pb-2 mb-2">
                <span className="font-mono text-xs font-bold text-slate-400">DINER RECEIPT</span>
              </div>
              <div className="flex justify-between items-center"><div className="w-1/2 h-3 bg-slate-200 rounded" /><div className="w-1/4 h-3 bg-slate-200 rounded" /></div>
              <div className="flex justify-between items-center"><div className="w-2/3 h-3 bg-slate-200 rounded" /><div className="w-1/4 h-3 bg-slate-200 rounded" /></div>
              <div className="flex justify-between items-center"><div className="w-1/3 h-3 bg-slate-200 rounded" /><div className="w-1/4 h-3 bg-slate-200 rounded" /></div>
              <div className="flex justify-between items-center"><div className="w-3/4 h-3 bg-slate-200 rounded" /><div className="w-1/4 h-3 bg-slate-200 rounded" /></div>
              <div className="mt-2 border-t border-slate-200 pt-3 flex justify-between items-center">
                <div className="w-1/2 h-5 bg-emerald-100 rounded" />
                <div className="w-1/3 h-5 bg-emerald-500 rounded" />
              </div>
              
              {/* Scanner Laser */}
              <motion.div 
                className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)] z-20 pointer-events-none origin-left"
                animate={{ translateY: ["0px", "260px", "0px"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            {/* Glowing Connection Nodes */}
            <div className="absolute inset-0 z-0">
               {/* Just purely visual decorative connection lines */}
               <svg className="w-full h-full opacity-30 light:opacity-50" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" fill="none">
                 <path d="M 50% 50% L 15% 30%" className="text-indigo-400" />
                 <path d="M 50% 50% L 85% 60%" className="text-emerald-400" />
                 <path d="M 50% 50% L 25% 85%" className="text-cyan-400" />
               </svg>
            </div>

            {/* Floating Friend Balances */}
            {/* Friend 1: Amit */}
            <motion.div 
              className="absolute left-[5%] md:left-[15%] top-[15%] md:top-[20%] bg-slate-950 border border-slate-800 light:bg-white light:border-slate-200 rounded-2xl p-3 md:p-4 shadow-xl flex items-center gap-3 z-20"
              initial={{ y: 0 }}
              animate={{ y: [-15, 10, -15] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30"><User className="w-5 h-5 text-indigo-400" /></div>
              <div className="hidden sm:block">
                <div className="text-xs text-slate-400 font-medium tracking-wide">AMIT OWES</div>
                <div className="text-lg md:text-xl font-bold text-white light:text-slate-900 tabular-nums">
                  <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 3 }}>₹2,500</motion.span>
                </div>
              </div>
            </motion.div>
            
            {/* Friend 2: Priya */}
            <motion.div 
              className="absolute right-[5%] md:right-[15%] top-[40%] md:top-[50%] bg-slate-950 border border-slate-800 light:bg-white light:border-slate-200 rounded-2xl p-3 md:p-4 shadow-xl flex items-center gap-3 z-20"
              initial={{ y: 0 }}
              animate={{ y: [15, -10, 15] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30"><User className="w-5 h-5 text-emerald-400" /></div>
              <div className="hidden sm:block">
                <div className="text-xs text-slate-400 font-medium tracking-wide">PRIYA GETS</div>
                <div className="text-lg md:text-xl font-bold text-emerald-500 tabular-nums">
                   <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}>₹1,250</motion.span>
                </div>
              </div>
            </motion.div>

            {/* Friend 3: Rahul */}
            <motion.div 
              className="absolute left-[10%] md:left-[25%] bottom-[10%] md:bottom-[15%] bg-slate-950 border border-slate-800 light:bg-white light:border-slate-200 rounded-2xl p-3 md:p-4 shadow-xl flex items-center gap-3 z-20"
              initial={{ y: 0 }}
              animate={{ y: [-10, 20, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }}
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-500/30"><User className="w-5 h-5 text-cyan-400" /></div>
              <div className="hidden sm:block">
                <div className="text-xs text-slate-400 font-medium tracking-wide">RAHUL OWES</div>
                <div className="text-lg md:text-xl font-bold text-white light:text-slate-900 tabular-nums">
                   <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 3 }}>₹800</motion.span>
                </div>
              </div>
            </motion.div>

          </motion.div>
        
      </div>
    </section>
  );
}
