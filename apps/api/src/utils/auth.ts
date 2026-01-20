import { createClient } from "@supabase/supabase-js";

export type Session = {
  user: {
    id: string;
    email?: string;
    full_name?: string;
  };
  teamId?: string;
};

export async function verifyAccessToken(
  accessToken?: string,
): Promise<Session | null> {
  if (!accessToken) return null;

  try {
    // Use Supabase SDK to verify the token (works with both HS256 and ES256)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
      },
    };
  } catch (error) {
    return null;
  }
}
