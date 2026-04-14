import { Wallet } from "lucide-react";
import Link from "next/link";

interface LogoProps {
  className?: string; // Container className
  iconClassName?: string; // e.g. "w-5 h-5 text-emerald-500"
  textClassName?: string; // e.g. "text-xl font-bold tracking-tight text-white"
  link?: boolean;
  href?: string;
}

export default function Logo({ 
  className = "", 
  iconClassName = "w-5 h-5 text-emerald-500", 
  textClassName = "text-xl font-bold tracking-tight text-white light:text-slate-900", 
  link = false,
  href = "/"
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2 group ${className}`}>
      <div className="p-1.5 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
        <Wallet className={iconClassName} />
      </div>
      <span className={textClassName}>
        Split<span className="text-emerald-500">ora</span>
      </span>
    </div>
  );

  if (link) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
