import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-transparent text-slate-400 light:text-slate-500 py-12 border-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center space-y-6">
        <Logo link href="#top" iconClassName="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" textClassName="text-xl font-bold tracking-tight text-white light:text-slate-900" />
        <p className="max-w-sm text-sm font-light text-slate-500 light:text-slate-500">
          Simplifying shared expenses, one receipt at a time. The intelligent way to split bills and settle debts.
        </p>
      </div>
    </footer>
  );
}
