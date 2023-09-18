"use client";

import { useRouter } from "next/navigation";

export default function SingOut({ buttonText }: { buttonText: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    // await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <button className="text-xs text-black" onClick={handleSignOut}>
      {buttonText}
    </button>
  );
}
