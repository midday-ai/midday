import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { Database } from "../types/db";

const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies();

  return createServerComponentClient<Database>({ cookies: () => cookieStore });
});

export const getSupabaseServerClient = cache(
  (
    params = {
      admin: false,
    },
  ) => {
    if (params.admin) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
          },
        },
      );
    }

    return createServerSupabaseClient();
  },
);
