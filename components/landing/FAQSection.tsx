"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How accurate is the AI Receipt Parsing?",
    answer: "Our system uses advanced OCR combined with trained LLMs to identify merchants, line items, prices, and tax rates. It handles crumpled, faded, and long receipts with up to 99% accuracy.",
  },
  {
    question: "Is my financial data secure?",
    answer: "Absolutely. We hash all passwords using bcrypt and use stateless JWTs for sessions. Your transaction data is fully isolated to your specific groups; we never sell or share your data.",
  },
  {
    question: "How does the Graph Algorithm reduce debts?",
    answer: "Instead of Everyone paying Everyone, our engine analyzes the entire group's debts. If Amit owes Priya ₹500, and Priya owes Rahul ₹500, the algorithm simplifies it so Amit just pays Rahul ₹500. In complex groups, this eliminates up to 80% of necessary transactions.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 relative bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-emerald-500 font-semibold tracking-wider uppercase text-sm mb-4 block">Support</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white light:text-slate-900 mb-6">Frequently Asked Questions</h2>
          <p className="text-lg text-slate-400 light:text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Everything you need to know about Splitora's inner workings.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="border border-slate-800 light:border-slate-200 rounded-2xl bg-slate-900/40 light:bg-white overflow-hidden backdrop-blur-md hover:border-slate-700/80 light:hover:border-slate-300 transition-colors duration-300 shadow-lg light:shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full p-6 md:p-8 text-left focus:outline-none"
              >
                <span className="text-lg md:text-xl font-bold text-white light:text-slate-900 pr-8 tracking-tight">{faq.question}</span>
                <ChevronDown
                  className={`w-6 h-6 text-slate-500 light:text-slate-400 transition-transform duration-300 shrink-0 ${
                    openIndex === index ? "rotate-180 text-emerald-400 light:text-emerald-600" : ""
                  }`}
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0 text-slate-400 light:text-slate-600 leading-relaxed font-light">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Aesthetic blur */}
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-emerald-500/10 blur-[150px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 blur-[150px] pointer-events-none" />
    </section>
  );
}
