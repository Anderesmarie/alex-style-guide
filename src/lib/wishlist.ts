import { supabase } from './supabase';

export interface WishlistItem {
  id: string;
  photo: string;
  name: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.id) throw new Error('Not authenticated');
  return data.user.id;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const user_id = await uid();
  const { data } = await supabase
    .from('wishlist')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map((row: any) => ({
    id: row.id,
    photo: row.photo || '',
    name: row.name,
    url: row.url || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  }));
}

export async function addWishlistItem(item: Omit<WishlistItem, 'id' | 'createdAt'>): Promise<WishlistItem> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from('wishlist')
    .insert({
      user_id,
      photo: item.photo,
      name: item.name,
      url: item.url || null,
      notes: item.notes || null,
    })
    .select()
    .single();
  if (error || !data) throw error || new Error('Insert failed');
  return {
    id: data.id,
    photo: data.photo || '',
    name: data.name,
    url: data.url || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at,
  };
}

export async function updateWishlistItem(id: string, patch: Partial<Omit<WishlistItem, 'id' | 'createdAt'>>): Promise<void> {
  const user_id = await uid();
  await supabase
    .from('wishlist')
    .update({
      ...(patch.photo !== undefined && { photo: patch.photo }),
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.url !== undefined && { url: patch.url || null }),
      ...(patch.notes !== undefined && { notes: patch.notes || null }),
    })
    .eq('id', id)
    .eq('user_id', user_id);
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const user_id = await uid();
  await supabase.from('wishlist').delete().eq('id', id).eq('user_id', user_id);
}
