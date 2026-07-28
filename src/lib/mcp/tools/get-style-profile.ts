import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase-client";

export default defineTool({
  name: "get_style_profile",
  title: "Profil style",
  description:
    "Récupère le profil style MyStyl de l'utilisateur connecté : morphologie, silhouette, colorimétrie, styles préférés, lifestyle, budget.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select(
        "pseudo, silhouette, morphologie, taille, corpulence, styles, styles_semaine, styles_weekend, lifestyle, budget, brands, favorite_colors, colorimetry_season, streak_current, streak_longest",
      )
      .eq("id", ctx.getUserId())
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Aucun profil trouvé." }] };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { profile: data },
    };
  },
});
