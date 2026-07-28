import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase-client";

export default defineTool({
  name: "add_wardrobe_item",
  title: "Ajouter une pièce au dressing",
  description:
    "Ajoute une pièce (sans photo) au dressing MyStyl de l'utilisateur connecté.",
  inputSchema: {
    category: z.string().describe("Catégorie, ex: Hauts, Bas, Chaussures."),
    type: z.string().describe("Type de pièce, ex: T-shirt, Jean droit."),
    subcategory: z.string().optional(),
    color: z.array(z.string()).optional().describe("Couleurs de la pièce."),
    season: z.array(z.string()).optional(),
    style: z.array(z.string()).optional(),
    occasion: z.array(z.string()).optional(),
    brand: z.string().optional(),
    price: z.number().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("wardrobe")
      .insert({
        user_id: ctx.getUserId(),
        category: input.category,
        type: input.type,
        subcategory: input.subcategory ?? null,
        color: input.color ?? [],
        season: input.season ?? [],
        style: input.style ?? [],
        occasion: input.occasion ?? [],
        brand: input.brand ?? null,
        price: input.price ?? null,
      })
      .select("id, category, type")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Pièce ajoutée : ${data.type} (${data.id})` }],
      structuredContent: { item: data },
    };
  },
});
