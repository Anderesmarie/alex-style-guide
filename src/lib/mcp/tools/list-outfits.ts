import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase-client";

export default defineTool({
  name: "list_outfits",
  title: "Lister les tenues",
  description:
    "Liste les tenues enregistrées de l'utilisateur MyStyl connecté, avec les ids des pièces qui les composent.",
  inputSchema: {
    limit: z.number().int().optional().describe("Nombre maximum de tenues à retourner (défaut 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("outfits")
      .select("id, name, item_ids, liked, is_modified, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 50, 200));
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { count: data?.length ?? 0, outfits: data ?? [] },
    };
  },
});
