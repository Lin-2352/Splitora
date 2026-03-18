import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:h-screen w-full bg-gradient-to-b from-[#9C3EB8] to-[#440856] flex items-center justify-center relative p-4 sm:p-8 lg:p-0 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <Image
        src="/dotted.png"
        alt="decor"
        width={400}
        height={400}
        className="absolute top-0 right-0 opacity-30 object-contain pointer-events-none"
      />

      <div className="w-full max-w-[1300px] min-h-[600px] lg:h-[85vh] bg-[#FFFFFD] rounded-[20px] lg:rounded-[32px] border-[3px] border-[#111727] shadow-[8px_8px_0px_#111727] lg:shadow-[12px_12px_0px_#111727] flex relative flex-col lg:flex-row mt-4 mb-4 lg:mt-0 lg:mb-0">
        <div className="w-full lg:w-[50%] h-full pt-8 pl-4 pr-4 pb-8 sm:p-12 lg:pt-12 lg:pl-12 lg:pr-4 lg:pb-12 relative z-20 flex flex-col justify-center items-center lg:items-start">
          {children}
        </div>

        <div className="hidden lg:block w-[50%] h-full relative z-10" style={{ clipPath: "polygon(-100% -100%, 200% -100%, 200% 100%, -100% 100%)" }}>
          <div className="absolute bottom-[-130px] right-[120px] w-[700px] h-[700px] z-40 pointer-events-none rotate-[5deg]">
            <Image
              src="/rose1.svg"
              alt="Large Background Rose"
              fill
              className="object-contain object-bottom"
              priority
            />
          </div>
          
          <div className="absolute bottom-[-105px] right-[-55px] w-[650px] h-[950px] z-50 pointer-events-none">
            <Image
              src="/tiger.png"
              alt="Tiger with Flowers"
              fill
              className="object-contain object-bottom-right"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
