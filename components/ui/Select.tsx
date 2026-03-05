import clsx from "clsx";
import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: Props) {
  return (
    <select
      className={clsx(
        "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-slate-900",
        className
      )}
      {...props}
    />
  );
}
