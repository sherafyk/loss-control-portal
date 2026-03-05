"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        const supabase = supabaseBrowser();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
