import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={clsx(
        "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-slate-900",
        className
      )}
      {...props}
    />
  );
}
