import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listWardrobe from "./tools/list-wardrobe";
import listOutfits from "./tools/list-outfits";
import getStyleProfile from "./tools/get-style-profile";
import addWardrobeItem from "./tools/add-wardrobe-item";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "mystyl-mcp",
  title: "MyStyl",
  version: "0.1.0",
  instructions:
    "Outils MyStyl : accède au dressing, aux tenues et au profil style de l'utilisateur connecté. Utilise `list_wardrobe` pour voir les vêtements, `list_outfits` pour les tenues enregistrées, `get_style_profile` pour la morphologie/colorimétrie/styles, et `add_wardrobe_item` pour ajouter une pièce.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listWardrobe, listOutfits, getStyleProfile, addWardrobeItem],
});
