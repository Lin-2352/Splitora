"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 relative bg-transparent">
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-4xl h-64 bg-emerald-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 light:from-white light:to-slate-100 border border-slate-800 light:border-slate-200 p-8 md:p-12 lg:p-16 shadow-xl light:shadow-sm flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          {/* Inner glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <div className="w-full lg:w-5/12 text-left relative z-10 flex flex-col items-center lg:items-start">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white light:text-slate-900 mb-6 tracking-tight text-center lg:text-left leading-tight">
              Ready to completely <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                eliminate money stress?
              </span>
            </h2>
            
            <p className="text-base md:text-lg text-slate-400 light:text-slate-600 max-w-md mb-8 text-center lg:text-left leading-relaxed">
              Join Splitora today and experience the smartest way to manage shared expenses. 
              No more manual spreadsheets, no more awkward conversations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 w-full">
              <Link
                href="/signup"
                className="group w-full sm:w-auto flex flex-row items-center justify-center px-8 py-4 text-base md:text-lg font-semibold text-slate-950 light:text-white transition-all duration-300 bg-white light:bg-slate-900 border border-transparent rounded-full hover:bg-slate-200 light:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white light:focus:ring-slate-900 focus:ring-offset-slate-950 light:focus:ring-offset-slate-50 shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] light:shadow-lg light:hover:shadow-xl hover:-translate-y-1"
              >
                Start for Free
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Grand Finale Debt Resolution Animation */}
          <div className="w-full lg:w-7/12 h-[350px] md:h-[400px] lg:h-[450px] relative flex items-center justify-center z-10 overflow-hidden mt-8 lg:mt-0">
             {/* Central Settled Node */}
             <motion.div 
               className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center z-20 backdrop-blur-md"
               animate={{ scale: [1, 1.05, 1], boxShadow: ["0px 0px 30px rgba(52,211,153,0.3)", "0px 0px 60px rgba(52,211,153,0.6)", "0px 0px 30px rgba(52,211,153,0.3)"] }}
               transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
             >
               <span className="text-emerald-400 font-bold text-xl md:text-2xl tracking-wide">SETTLED</span>
             </motion.div>

             {/* Chaotic Outer Debt Nodes */}
             <motion.div className="absolute top-[15%] left-[10%] w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center z-10 backdrop-blur-sm" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                <span className="text-rose-400 font-medium text-sm tabular-nums">-₹800</span>
             </motion.div>
             <motion.div className="absolute bottom-[15%] left-[20%] w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center z-10 backdrop-blur-sm" animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }}>
                <span className="text-rose-400 font-medium text-sm tabular-nums">-₹450</span>
             </motion.div>
             <motion.div className="absolute top-[35%] right-[10%] w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center z-10 backdrop-blur-sm" animate={{ x: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: 0.5 }}>
                <span className="text-rose-400 font-medium text-sm tabular-nums">-₹1,250</span>
             </motion.div>

             {/* Animated Flow Lasers */}
             <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" overflow="visible">
                <defs>
                  <linearGradient id="roseGradient1" x1="15%" y1="15%" x2="50%" y2="50%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="roseGradient2" x1="25%" y1="85%" x2="50%" y2="50%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="roseGradient3" x1="85%" y1="40%" x2="50%" y2="50%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                {/* Flow from Top Left */}
                <motion.line x1="15%" y1="20%" x2="50%" y2="50%" stroke="url(#roseGradient1)" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" animate={{ strokeDashoffset: [0, -40] }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} />
                {/* Flow from Bottom Left */}
                <motion.line x1="25%" y1="80%" x2="50%" y2="50%" stroke="url(#roseGradient2)" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" animate={{ strokeDashoffset: [0, -40] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} />
                {/* Flow from Right */}
                <motion.line x1="85%" y1="40%" x2="50%" y2="50%" stroke="url(#roseGradient3)" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" animate={{ strokeDashoffset: [0, -40] }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }} />
             </svg>
             
             {/* The "Settled" Pulse Ring */}
             <motion.div 
               className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full border border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)] z-10 pointer-events-none"
               animate={{ scale: [1, 2.5], opacity: [1, 0] }}
               transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
             />
          </div>
          
        </motion.div>
      </div>
    </section>
  );
}
