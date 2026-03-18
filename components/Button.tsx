export default function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-full h-[38px] bg-gradient-to-r from-[#8E44FF] to-[#6C1E83] border-[1px] border-[#3F0051] text-[#FFFFFD] font-manjari font-normal text-[15px] rounded-[8px] shadow-[0px_3px_0px_#111727] hover:translate-y-[2px] hover:shadow-[0px_1px_0px_#111727] transition-all">
      {children}
    </button>
  );
}
