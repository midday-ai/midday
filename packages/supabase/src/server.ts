import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { Database } from "./types/db";

export const createServerClient = cache(() =>
  createServerComponentClient<Database>({ cookies }),
);

export async function getSession() {
  const supabase = createServerClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export async function getUserDetails() {
  const supabase = createServerClient();
  const user = await getSession();

  try {
    const { data: userDetails } = await supabase
      .from("users")
      .select()
      .eq("id", user?.user.id)
      .single();
    return userDetails;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// export async function getUserTeams() {
//   const supabase = createServerClient();
//   const user = await getSession();
//   const { data, error } = await supabase.from("teams").select(`
//   id,
//   team_name,
//   users ( id, name )
// `);

//   return data;
// }

export async function saveAccounts() {
  const supabase = createServerClient();
  const user = await getSession();
}
