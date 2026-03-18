"use client";

interface InputFieldProps {
  label: string;
  type?: string;
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export default function InputField({
  label,
  type = "text",
  value,
  name,
  onChange,
  required = false,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full relative z-30">
      <label className="font-manjari text-[13px] text-[#111727] font-normal ml-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="h-[38px] bg-[#F9F5FD] rounded-[8px] px-3 outline-none border-[1.5px] border-[#D6C1EE] focus:border-[#8E44FF] shadow-[0px_2px_10px_rgba(159,110,234,0.15)] transition-all z-30 relative text-sm text-[#111727]"
      />
    </div>
  );
}
