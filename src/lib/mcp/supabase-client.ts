import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Supabase client scoped to the authenticated MCP caller.
 * The verified bearer token is forwarded so RLS runs as that user.
 * Env is read lazily inside the call (never at module import time).
 */
export function supabaseForUser(ctx: ToolContext) {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY as string;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
