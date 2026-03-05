import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={clsx(
        "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-slate-900",
        className
      )}
      {...props}
    />
  );
}
