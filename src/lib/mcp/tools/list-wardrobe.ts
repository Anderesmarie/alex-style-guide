import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase-client";

export default defineTool({
  name: "list_wardrobe",
  title: "Lister le dressing",
  description:
    "Liste les vêtements du dressing MyStyl de l'utilisateur connecté (catégorie, type, couleur, style, occasion, marque).",
  inputSchema: {
    category: z.string().optional().describe("Filtrer par catégorie, ex: Hauts, Bas, Chaussures."),
    limit: z.number().int().optional().describe("Nombre maximum de pièces à retourner (défaut 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("wardrobe")
      .select("id, category, subcategory, type, color, pattern, texture, fit, length, season, style, occasion, brand, price, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 100, 300));
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { count: data?.length ?? 0, items: data ?? [] },
    };
  },
});
