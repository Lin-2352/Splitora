"use client";

import { useEffect, useState, useRef } from "react";
import { Moon, Sun, ChevronDown, User, UserPlus } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const [isLight, setIsLight] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check initial theme
    const isLightScheme = document.documentElement.classList.contains("light");
    setIsLight(isLightScheme);

    // Handle outside clicks for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    if (isLight) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
      setIsLight(false);
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
      setIsLight(true);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-slate-950/50 light:bg-white/80 border-b border-slate-800/50 light:border-slate-200">
      <Logo link />

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 light:bg-slate-100 light:hover:bg-slate-200 text-slate-300 light:text-slate-600 transition-colors"
          aria-label="Toggle theme"
        >
          {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-colors"
          >
            Sign in
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-48 rounded-2xl bg-slate-900/90 light:bg-white/90 backdrop-blur-xl border border-slate-800 light:border-slate-200 shadow-2xl py-2 overflow-hidden transform origin-top-right flex flex-col"
              >
                <Link
                  href="/login"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex flex-row items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-slate-800/50 light:hover:bg-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-emerald-500" />
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex flex-row items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-slate-800/50 light:hover:bg-slate-100 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  Sign up
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
