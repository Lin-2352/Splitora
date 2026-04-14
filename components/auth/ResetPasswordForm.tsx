"use client";

import InputField from "@/components/InputField";
import Button from "@/components/Button";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/verify-reset-token?token=${token}`);
        if (!res.ok) {
          throw new Error("Invalid or expired reset token.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); 
    if (success) setSuccess("");
  };

  const validateForm = () => {
    if (formData.password.length < 8) return "Password must be at least 8 characters long.";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setError("");
    setSuccess("");
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess("Password has been reset successfully. You can now log in.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return <div className="text-[#380049] font-manjari text-[18px]">Verifying token...</div>;
  }

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
                className="font-risque text-[26px] lg:text-[32px] text-[#731E8C] text-center mb-0 whitespace-nowrap leading-tight"
                style={{ WebkitTextStroke: "0.5px #67187F" }}
              >
                Reset Password
              </h1>

              <InputField label="New Password*" name="password" type="password" value={formData.password} onChange={handleChange} required />
              <InputField label="Confirm Password*" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />

              {error && <div className="text-red-500 text-[13px] text-left font-manjari">* {error}</div>}
              {success && <div className="text-green-600 text-[13px] text-left font-manjari">{success}</div>}

              <div className="mt-2">
                <Button disabled={!!error && error.includes("token")}>{loading ? "Resetting..." : "Reset Password"}</Button>
              </div>

              <div className="flex justify-center items-center gap-1 mt-0 relative z-30">
                <span className="font-manjari text-[13px] text-[#111727]">
                  Remembered your password?
                </span>
                <Link
                  href="/login"
                  className="font-manjari text-[13px] text-[#6C1E83] font-bold"
                >
                  Log In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
