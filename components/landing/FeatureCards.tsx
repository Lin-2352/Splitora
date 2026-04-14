"use client";

import { motion } from "framer-motion";
import { Receipt, Network, PieChart, ShieldCheck, MessageSquare, Lightbulb } from "lucide-react";

export default function FeatureCards() {
  return (
    <section id="features" className="py-32 text-white light:text-slate-900 relative bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-emerald-500 font-semibold tracking-wider uppercase text-sm mb-4 block">Features</span>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Everything you need. <br />Nothing you don't.</h2>
          <p className="text-lg md:text-xl text-slate-400 light:text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Splitora replaces disconnected spreadsheets and awkward texts with an intelligent, centralized ledger.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: Large Span */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-1 group relative rounded-3xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 p-8 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 light:hover:border-slate-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] light:shadow-xl light:hover:shadow-2xl hover:-translate-y-2 flex flex-col items-start"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-auto border border-indigo-500/30 relative z-10">
              <Receipt className="w-6 h-6 text-indigo-400" />
            </div>

            {/* Miniature Receipt Animation Overlay */}
            <div className="absolute top-10 right-10 w-16 h-20 bg-slate-800/50 light:bg-slate-200/50 border border-slate-700/50 light:border-slate-300/50 rounded-lg opacity-60 transition-opacity duration-500 pointer-events-none flex flex-col items-center py-3 gap-2 overflow-hidden z-0">
               <div className="w-8 h-1 bg-indigo-400/50 rounded-full" />
               <div className="w-10 h-1 bg-indigo-400/50 rounded-full" />
               <div className="w-6 h-1 bg-indigo-400/50 rounded-full" />
               <motion.div className="absolute left-0 right-0 h-[1px] bg-indigo-400 shadow-[0_0_5px_currentColor]" animate={{ translateY: ["0px", "70px", "0px"] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} />
            </div>
            
            <div className="relative z-10 mt-8">
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white light:text-slate-900 group-hover:text-indigo-400 light:group-hover:text-indigo-600 transition-colors duration-300">AI Receipt Parsing</h3>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed max-w-md font-light">
                Snap a photo. Our ImageKit-powered engine instantly extracts merchants, items, prices, and taxes with 99% accuracy. No more manual entry.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Debt Simplification */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-1 group relative rounded-3xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 p-8 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 light:hover:border-slate-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] light:shadow-xl light:hover:shadow-2xl hover:-translate-y-2 flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-auto border border-emerald-500/30 relative z-10">
              <Network className="w-6 h-6 text-emerald-400" />
            </div>

            {/* Miniature Graph Animation Overlay */}
            <div className="absolute top-10 right-10 w-24 h-24 pointer-events-none opacity-60 transition-opacity duration-500 z-0">
               {/* Node A */}
               <motion.div className="absolute top-0 left-10 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor]" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
               {/* Node B */}
               <motion.div className="absolute bottom-4 left-0 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
               {/* Node C */}
               <motion.div className="absolute bottom-4 right-0 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_currentColor]" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
               
               {/* Connecting Lines */}
               <svg className="absolute inset-0 w-full h-full -z-10" overflow="visible">
                 <motion.line x1="46" y1="6" x2="6" y2="76" stroke="currentColor" className="text-emerald-500/50" strokeWidth="2" strokeDasharray="4" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 3 }} />
                 <motion.line x1="6" y1="76" x2="86" y2="76" stroke="currentColor" className="text-emerald-600/50" strokeWidth="2" strokeDasharray="4" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }} />
                 {/* The Simplified Path */}
                 <motion.line x1="46" y1="6" x2="86" y2="76" stroke="currentColor" className="text-cyan-400" strokeWidth="2" animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 1.5 }} />
               </svg>
            </div>

            <div className="relative z-10 mt-8">
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white light:text-slate-900">Graph Algorithm</h3>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed font-light">
                Our debt simplification engine reduces the total number of transactions needed to settle a group by up to 80%.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Analytics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-1 group relative rounded-3xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 p-8 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 light:hover:border-slate-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] light:shadow-xl light:hover:shadow-2xl hover:-translate-y-2 flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-auto border border-cyan-500/30 relative z-10">
              <PieChart className="w-6 h-6 text-cyan-400" />
            </div>

            {/* Miniature Chart Animation Overlay */}
            <div className="absolute top-10 right-10 w-20 h-20 flex items-end justify-between gap-2 opacity-60 transition-opacity duration-500 pointer-events-none pb-2 z-0">
               <motion.div className="w-full bg-cyan-500 rounded-t-sm" initial={{ height: "30%" }} animate={{ height: ["30%", "70%", "30%"] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} />
               <motion.div className="w-full bg-indigo-500 rounded-t-sm" initial={{ height: "50%" }} animate={{ height: ["50%", "90%", "50%"] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5, ease: "easeInOut" }} />
               <motion.div className="w-full bg-emerald-500 rounded-t-sm" initial={{ height: "70%" }} animate={{ height: ["70%", "100%", "70%"] }} transition={{ repeat: Infinity, duration: 3, delay: 1, ease: "easeInOut" }} />
            </div>

            <div className="relative z-10 mt-8">
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white light:text-slate-900">Interactive Analytics</h3>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed font-light">
                Visualize spending habits with beautiful Recharts treemaps. Know exactly where the money went.
              </p>
            </div>
          </motion.div>

          {/* Card 4: AI Chatbot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="md:col-span-1 group relative rounded-3xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 p-8 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 light:hover:border-slate-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] light:shadow-xl light:hover:shadow-2xl hover:-translate-y-2 flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-auto border border-purple-500/30 relative z-10">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>

            {/* Miniature Chat Animation Overlay */}
            <div className="absolute top-10 right-10 w-20 h-16 bg-slate-800/50 light:bg-slate-200/50 border border-slate-700/50 light:border-slate-300/50 rounded-2xl rounded-tr-sm pointer-events-none opacity-60 transition-opacity duration-500 z-0 flex items-center justify-center gap-1.5 backdrop-blur-sm">
               <motion.div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_5px_currentColor]" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
               <motion.div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_5px_currentColor]" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
               <motion.div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_5px_currentColor]" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
            </div>

            <div className="relative z-10 mt-8">
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white light:text-slate-900">AI Support Agent</h3>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed font-light">
                Ask our intelligent chatbot any question about Splitora or debt simplification and receive instant, personalized answers.
              </p>
            </div>
          </motion.div>

          {/* Card 5: AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="md:col-span-1 group relative rounded-3xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 p-8 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 light:hover:border-slate-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] light:shadow-xl light:hover:shadow-2xl hover:-translate-y-2 flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-auto border border-pink-500/30 relative z-10">
              <Lightbulb className="w-6 h-6 text-pink-400" />
            </div>

            {/* Miniature Insights Animation Overlay */}
            <div className="absolute top-10 right-10 w-24 h-24 pointer-events-none opacity-60 transition-opacity duration-500 z-0">
               <motion.div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-pink-400 shadow-[0_0_15px_currentColor]" animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 2 }} />
               <motion.div className="absolute top-[15%] left-[30%] w-1.5 h-1.5 rounded-full bg-pink-300" animate={{ y: [0, -15], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} />
               <motion.div className="absolute top-[25%] right-[20%] w-2 h-2 rounded-full bg-pink-300" animate={{ y: [0, -20], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.5 }} />
               <motion.div className="absolute top-[45%] left-[75%] w-1.5 h-1.5 rounded-full bg-pink-300" animate={{ y: [0, -12], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.8 }} />
            </div>

            <div className="relative z-10 mt-8">
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white light:text-slate-900">Smart Insights</h3>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed font-light">
                Set active budgets and allow our intelligence engine to generate actionable insights and tips to manage your money more efficiently over time.
              </p>
            </div>
          </motion.div>

          {/* Card 6: Security */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="md:col-span-1 group relative rounded-3xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 p-8 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 light:hover:border-slate-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] light:shadow-xl light:hover:shadow-2xl hover:-translate-y-2 flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-auto border border-amber-500/30 relative z-10">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>

            {/* Miniature Security Animation Overlay */}
            <div className="absolute top-10 right-10 w-24 h-24 pointer-events-none opacity-60 transition-opacity duration-500 z-0 flex items-center justify-center">
               <div className="w-3 h-3 rounded-full bg-amber-400 z-10 shadow-[0_0_10px_currentColor]" />
               <motion.div className="absolute w-8 h-8 rounded-full border border-amber-400/60" animate={{ scale: [1, 2.5], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
               <motion.div className="absolute w-8 h-8 rounded-full border border-amber-400/60" animate={{ scale: [1, 2.5], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
            </div>

            <div className="relative z-10 mt-8">
              <h3 className="text-2xl font-bold mb-3 tracking-tight text-white light:text-slate-900">Privacy & Security</h3>
              <p className="text-slate-400 light:text-slate-600 leading-relaxed font-light">
                Secure stateless JWT sessions and bcrypt hashing keep your financial data strictly protected and groups isolated.
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Aesthetic blur */}
      <div className="absolute top-[20%] right-0 w-96 h-96 bg-emerald-500/10 blur-[150px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-[20%] left-0 w-96 h-96 bg-indigo-500/10 blur-[150px] pointer-events-none" />
    </section>
  );
}
