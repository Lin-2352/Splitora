"use client";

import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); 
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Please enter a valid email address.";

    if (formData.password.length < 8) return "Password must be at least 8 characters long.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save the JWT token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      router.push("/dashboard"); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-full lg:max-w-[480px] ml-0 lg:ml-4 flex flex-col z-20">
      <div className="flex flex-row justify-start items-end lg:items-end w-full relative z-20 translate-y-[2px] gap-2 lg:gap-3 mb-0 lg:mb-0">
        <div className="h-[60px] lg:h-[75px] bg-[#FFFFFD] border-[2px] border-[#111727] rounded-bl-[30px] lg:rounded-bl-[40px] rounded-tl-none rounded-tr-none rounded-br-none flex items-center justify-start pl-[16px] pr-[16px] lg:pl-[20px] lg:pr-[20px] gap-2 shadow-[4px_4px_0px_#111727] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111727] transition-all duration-300 w-max shrink-0 relative z-30 ml-2 lg:ml-4 cursor-default">
          <div className="relative w-[28px] h-[28px] lg:w-[36px] lg:h-[36px] shrink-0">
            <Image
              src="/money.svg"
              alt="Money Icon"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="font-marhey text-[20px] lg:text-[26px] text-[#710192] leading-none pt-1 lg:pt-2 whitespace-nowrap">
            Let&apos;s Split It!
          </h2>
        </div>

        <div className="font-manjari text-[14px] lg:text-[18px] text-[#380049] font-normal leading-tight pb-1 lg:pb-2 relative z-30 flex-wrap shrink pr-2">
          Elevated financial clarity
        </div>
      </div>

      <div className="relative z-10 w-full mt-2 lg:mt-0">
        <div className="absolute left-[-30px] lg:left-[-35px] top-[-40px] lg:top-[-25px] w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] -rotate-[15deg] opacity-80 z-0 pointer-events-none">
          <Image
            src="/rose.png"
            alt="Decorative Rose"
            fill
            sizes="(max-width: 1024px) 100px, 120px"
            className="object-contain"
          />
        </div>
        
        <div className="flex flex-col relative z-20 w-full pl-2 lg:pl-6 filter drop-shadow-[4px_4px_0px_#111727] hover:-translate-y-1 hover:drop-shadow-[8px_8px_0px_#111727] transition-all duration-300 cursor-default">
          <div className="flex w-full h-[30px] lg:h-[50px]">
            <div className="w-[45%] bg-transparent border-r-[2px] border-[#111727] rounded-tl-none relative border-b-transparent border-r-transparent filter-none drop-shadow-none">
              <div className="absolute inset-0 border-b-[2px] border-r-[2px] border-[#111727] rounded-tl-none"></div>
            </div>

            <div className="w-[55%] bg-[#FFFFFD] border-t-[2px] border-[#111727] rounded-tr-[50px] lg:rounded-tr-[70px]"></div>
          </div>

          <div className="w-full bg-[#FFFFFD] border-l-[2px] border-r-[2px] border-b-[2px] border-[#111727] rounded-bl-[16px] rounded-br-[16px] px-4 lg:px-8 pt-4 pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-[10px] lg:gap-[12px] w-full relative z-30 bg-[#FFFFFD]">
              <h1
                className="font-risque text-[26px] lg:text-[34px] text-[#731E8C] text-center mb-0 whitespace-nowrap leading-tight"
                style={{ WebkitTextStroke: "0.5px #67187F" }}
              >
                Login to Splitora
              </h1>

              <InputField label="Email*" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <InputField label="Password*" name="password" type="password" value={formData.password} onChange={handleChange} required />

              <div className="w-full flex justify-start pb-2">
			    <Link href="/forget-password" className="font-manjari text-[13px] text-[#6C1E83] font-bold">
				  Forget Password?
				</Link>
			  </div>

              {error && <div className="text-red-500 text-[13px] text-left font-manjari">* {error}</div>}

              <div className="mt-2">
                <Button>{loading ? "Submitting..." : "Submit"}</Button>
              </div>

              <div className="flex justify-center items-center gap-1 mt-0 relative z-30">
                <span className="font-manjari text-[13px] text-[#111727]">
                  Create an account?
                </span>
                <Link
                  href="/signup"
                  className="font-manjari text-[13px] text-[#6C1E83] font-bold"
                >
                  Sign Up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
