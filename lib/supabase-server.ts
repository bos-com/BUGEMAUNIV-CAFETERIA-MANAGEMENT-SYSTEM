import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function createServerSupabaseClient() {
  const cookieStore = await cookies() // ⬅️ must await

  const accessToken = cookieStore.get("sb-access-token")?.value || ""

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}
