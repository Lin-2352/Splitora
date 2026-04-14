import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-[#380049] font-manjari text-[18px]">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
