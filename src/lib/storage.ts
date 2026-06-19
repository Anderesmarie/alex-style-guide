import { ClothingItem, Outfit, UserProfile, DailyCounter, AvatarConfig, CalendarEvent, Trip, TripDay } from './types';
import { ColorPalette } from './colorimetry';
import { supabase } from './supabase';

// ---------- helpers ----------
let cachedUserId: string | null | undefined = undefined;

async function getUserId(): Promise<string> {
  if (cachedUserId !== undefined) {
    if (!cachedUserId) throw new Error('Not authenticated');
    return cachedUserId;
  }
  const { data } = await supabase.auth.getUser();
  cachedUserId = data.user?.id ?? null;
  if (!cachedUserId) throw new Error('Not authenticated');
  return cachedUserId;
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') cachedUserId = null;
  if (event === 'SIGNED_IN') cachedUserId = undefined;
});

export const genId = () => crypto.randomUUID();

// ---------- Profile ----------
export async function getProfile(): Promise<UserProfile | null> {
  const uid = await getUserId();
  const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
  if (!data) return null;
  const d = data as any;
  return {
    silhouette: data.silhouette || '',
    styles: (data.styles as string[]) || [],
    budget: data.budget || 80,
    brands: (data.brands as string[]) || [],
    taille: data.taille || null,
    corpulence: data.corpulence || null,
    morphologie: data.morphologie || null,
    favorite_colors: (data.favorite_colors as string[]) || [],
    lifestyle: data.lifestyle || null,
    styles_semaine: (d.styles_semaine as string[]) || [],
    styles_weekend: (d.styles_weekend as string[]) || [],
  };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const uid = await getUserId();
  await supabase.from('profiles').upsert({
    id: uid,
    silhouette: profile.silhouette,
    styles: profile.styles,
    budget: profile.budget,
    brands: profile.brands,
    taille: profile.taille,
    corpulence: profile.corpulence,
    morphologie: profile.morphologie,
    favorite_colors: profile.favorite_colors,
    lifestyle: profile.lifestyle ?? null,
    styles_semaine: profile.styles_semaine ?? [],
    styles_weekend: profile.styles_weekend ?? [],
  } as any);
}

// ---------- Avatar ----------
export async function getAvatar(): Promise<AvatarConfig | null> {
  const uid = await getUserId();
  const { data } = await supabase.from('avatar').select('*').eq('user_id', uid).single();
  if (!data) return null;
  return {
    skin: data.skin,
    faceShape: data.face_shape || 'ovale',
    eyeColor: data.eye_color,
    eyeShape: data.eye_shape || 'amande',
    browShape: data.brow_shape || 'arques',
    browColor: data.brow_color || '#6B4226',
    noseShape: data.nose_shape || 'petit',
    lipsShape: data.lips_shape || 'naturelles',
    lipsColor: data.lips_color || '#D4756A',
    hairStyle: data.hair_style,
    hairColor: data.hair_color,
    extras: (data.extras as string[]) || [],
  };
}

export async function saveAvatar(avatar: AvatarConfig): Promise<void> {
  const uid = await getUserId();
  await supabase.from('avatar').upsert({
    user_id: uid,
    skin: avatar.skin,
    face_shape: avatar.faceShape,
    eye_color: avatar.eyeColor,
    eye_shape: avatar.eyeShape,
    brow_shape: avatar.browShape,
    brow_color: avatar.browColor,
    nose_shape: avatar.noseShape,
    lips_shape: avatar.lipsShape,
    lips_color: avatar.lipsColor,
    hair_style: avatar.hairStyle,
    hair_color: avatar.hairColor,
    extras: avatar.extras,
  }, { onConflict: 'user_id' });
}

// ---------- Palette (still localStorage — no table) ----------
export const getPalette = (): ColorPalette | null => {
  try { const v = localStorage.getItem('mystyl_palette'); return v ? JSON.parse(v) : null; } catch { return null; }
};
export const savePalette = (palette: ColorPalette) => {
  localStorage.setItem('mystyl_palette', JSON.stringify(palette));
};

// ---------- Wardrobe ----------
export async function getWardrobe(): Promise<ClothingItem[]> {
  const uid = await getUserId();
  const { data } = await supabase
    .from('wardrobe')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(row => {
    const imageUrl = (row as any).image_url as string | null | undefined;
    return {
      id: row.id,
      // Préfère l'URL Storage si dispo, fallback base64 legacy.
      imageBase64: imageUrl || row.image_base64 || '',
      imageUrl: imageUrl ?? null,
      category: row.category || '',
      subcategory: row.subcategory || '',
      layer: row.layer ?? 1,
      type: row.type,
      color: Array.isArray(row.color) ? (row.color as string[]) : (typeof row.color === 'string' ? (row.color as string).split(',').map(s => s.trim()).filter(Boolean) : []),
      temperatures: (row.season as string[]) || [],
      style: row.style as string[],
      occasion: row.occasion as string[],
      brand: row.brand || undefined,
      price: row.price || undefined,
      pattern: (row as any).pattern || 'uni',
      texture: (row as any).texture || undefined,
      fit: (row as any).fit || undefined,
      length: (row as any).length || undefined,
    };
  });
}

export async function addClothing(item: ClothingItem): Promise<void> {
  const uid = await getUserId();
  // Si on a une URL Storage, on n'écrit PAS le base64 en DB (économise l'egress).
  const hasUrl = !!item.imageUrl;
  const { error } = await supabase.from('wardrobe').insert({
    id: item.id,
    user_id: uid,
    image_base64: hasUrl ? null : item.imageBase64,
    image_url: item.imageUrl ?? null,
    category: item.category || null,
    subcategory: item.subcategory || null,
    type: item.type,
    color: item.color,
    season: item.temperatures,
    style: item.style,
    occasion: item.occasion,
    brand: item.brand || null,
    price: item.price || null,
    pattern: item.pattern || 'uni',
    texture: item.texture || null,
    fit: item.fit || null,
    length: item.length || null,
  } as any);
  if (error) {
    console.error('addClothing error:', error);
    throw error;
  }
}

export async function updateClothing(item: ClothingItem): Promise<void> {
  const uid = await getUserId();
  const patch: any = {
    category: item.category || null,
    subcategory: item.subcategory || null,
    type: item.type,
    color: item.color,
    season: item.temperatures,
    style: item.style,
    occasion: item.occasion,
    brand: item.brand || null,
    price: item.price || null,
    pattern: item.pattern || 'uni',
    texture: item.texture || null,
    fit: item.fit || null,
    length: item.length || null,
  };
  if (item.imageUrl) {
    patch.image_url = item.imageUrl;
    patch.image_base64 = null;
  } else {
    patch.image_base64 = item.imageBase64;
  }
  const { error } = await supabase.from('wardrobe').update(patch).eq('id', item.id).eq('user_id', uid);
  if (error) {
    console.error('updateClothing error:', error);
    throw error;
  }
}

/** Met à jour uniquement image_url (pour migration des anciennes pièces). image_base64 conservé pour fallback. */
export async function setClothingImageUrl(id: string, imageUrl: string): Promise<void> {
  const uid = await getUserId();
  const { error } = await supabase
    .from('wardrobe')
    .update({ image_url: imageUrl } as any)
    .eq('id', id)
    .eq('user_id', uid);
  if (error) {
    console.error('setClothingImageUrl error:', error);
    throw error;
  }
}

export async function deleteClothing(id: string): Promise<void> {
  const uid = await getUserId();
  // 1) Récupère image_url avant suppression
  const { data: row } = await supabase
    .from('wardrobe')
    .select('image_url')
    .eq('id', id)
    .eq('user_id', uid)
    .maybeSingle();
  const imageUrl = (row as any)?.image_url as string | null | undefined;

  // 2) Si l'image est stockée dans le bucket wardrobe-images, supprime le fichier
  if (imageUrl && imageUrl.includes('/wardrobe-images/')) {
    const marker = '/wardrobe-images/';
    const idx = imageUrl.indexOf(marker);
    const filePath = imageUrl.substring(idx + marker.length).split('?')[0];
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('wardrobe-images')
        .remove([filePath]);
      if (storageError) {
        console.warn('deleteClothing storage remove failed:', storageError);
      }
    }
  }

  // 3) Supprime la ligne en DB
  await supabase.from('wardrobe').delete().eq('id', id).eq('user_id', uid);
}

// ---------- Outfits ----------
export async function getOutfits(): Promise<Outfit[]> {
  const uid = await getUserId();
  const { data } = await supabase.from('outfits').select('*').eq('user_id', uid).order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    name: row.name,
    itemIds: row.item_ids as string[],
    createdAt: row.created_at,
    liked: (row as any).liked ?? false,
    layoutData: ((row as any).layout_data ?? null) as Outfit['layoutData'],
  }));
}

export async function addOutfit(outfit: Outfit): Promise<void> {
  const uid = await getUserId();
  await supabase.from('outfits').insert({
    id: outfit.id,
    user_id: uid,
    name: outfit.name,
    item_ids: outfit.itemIds,
    layout_data: (outfit.layoutData ?? null) as any,
  });
}

export async function setOutfitLiked(id: string, liked: boolean): Promise<void> {
  const uid = await getUserId();
  await supabase.from('outfits').update({ liked }).eq('id', id).eq('user_id', uid);
}

export async function deleteOutfit(id: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) throw new Error('Not authenticated');

  // 1) Supprimer les références dans calendar_events
  const { error: calErr } = await supabase
    .from('calendar_events')
    .delete()
    .eq('outfit_id', id)
    .eq('user_id', uid);
  if (calErr) console.warn('deleteOutfit: calendar_events cleanup failed', calErr);

  // 2) Supprimer les références dans trip_days (pas de user_id direct, RLS via trips)
  const { error: tripErr } = await supabase
    .from('trip_days')
    .delete()
    .eq('outfit_id', id);
  if (tripErr) console.warn('deleteOutfit: trip_days cleanup failed', tripErr);

  // 3) Supprimer la tenue elle-même
  const { error } = await supabase
    .from('outfits')
    .delete()
    .eq('id', id)
    .eq('user_id', uid);
  if (error) {
    console.error('deleteOutfit failed:', error);
    throw error;
  }
}

export async function saveOutfits(outfits: Outfit[]): Promise<void> {
  const uid = await getUserId();
  // Delete all then re-insert
  await supabase.from('outfits').delete().eq('user_id', uid);
  if (outfits.length > 0) {
    await supabase.from('outfits').insert(
      outfits.map(o => ({
        id: o.id,
        user_id: uid,
        name: o.name,
        item_ids: o.itemIds,
        created_at: o.createdAt,
      }))
    );
  }
}

// ---------- Daily counter ----------
export async function getDailyCounter(): Promise<DailyCounter> {
  const uid = await getUserId();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('daily_counter').select('*').eq('user_id', uid).eq('date', today).single();
  if (!data) return { date: today, count: 0 };
  return { date: data.date, count: data.count };
}

export async function saveDailyCounter(counter: DailyCounter): Promise<void> {
  const uid = await getUserId();
  await supabase.from('daily_counter').upsert({
    user_id: uid,
    date: counter.date,
    count: counter.count,
  }, { onConflict: 'user_id,date' });
}

// ---------- Last outfit / Rejected (Supabase) ----------
export async function getLastOutfit(): Promise<string[]> {
  const uid = await getUserId();
  const { data } = await supabase.from('last_outfit').select('item_ids').eq('user_id', uid).maybeSingle();
  if (!data) return [];
  return (data.item_ids as string[]) ?? [];
}

export async function saveLastOutfit(ids: string[]): Promise<void> {
  const uid = await getUserId();
  await supabase.from('last_outfit').upsert({
    user_id: uid,
    item_ids: ids,
  }, { onConflict: 'user_id' });
}

export async function getRejected(): Promise<string[][]> {
  const uid = await getUserId();
  const { data } = await supabase.from('rejected_outfits').select('item_ids').eq('user_id', uid);
  if (!data) return [];
  return data.map(r => (r.item_ids as string[]) ?? []);
}

export async function addRejected(ids: string[]): Promise<void> {
  const uid = await getUserId();
  await supabase.from('rejected_outfits').insert({
    user_id: uid,
    item_ids: ids.sort(),
  });
}

// ---------- Calendar events ----------
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const uid = await getUserId();
  const { data } = await supabase.from('calendar_events').select('*').eq('user_id', uid).order('date', { ascending: true });
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    outfitId: row.outfit_id,
    eventName: row.event_name,
    createdAt: row.created_at,
    occasion: (row as any).occasion ?? null,
  }));
}

export async function upsertCalendarEvent(event: Partial<CalendarEvent> & { date: string }): Promise<CalendarEvent> {
  const uid = await getUserId();
  const payload: any = {
    user_id: uid,
    date: event.date,
    outfit_id: event.outfitId ?? null,
    event_name: event.eventName ?? null,
    occasion: event.occasion ?? null,
  };
  if (event.id) payload.id = event.id;
  const { data, error } = await supabase.from('calendar_events').upsert(payload).select().single();
  if (error) throw error;
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    outfitId: data.outfit_id,
    eventName: data.event_name,
    createdAt: data.created_at,
    occasion: (data as any).occasion ?? null,
  };
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const uid = await getUserId();
  await supabase.from('calendar_events').delete().eq('id', id).eq('user_id', uid);
}

// ---------- Trips ----------
export async function getTrips(): Promise<Trip[]> {
  const uid = await getUserId();
  const { data } = await supabase.from('trips').select('*').eq('user_id', uid).order('start_date', { ascending: true });
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  }));
}

export async function upsertTrip(trip: Partial<Trip> & { destination: string; startDate: string; endDate: string }): Promise<Trip> {
  const uid = await getUserId();
  const payload: any = {
    user_id: uid,
    destination: trip.destination,
    start_date: trip.startDate,
    end_date: trip.endDate,
  };
  if (trip.id) payload.id = trip.id;
  const { data, error } = await supabase.from('trips').upsert(payload).select().single();
  if (error) throw error;
  return {
    id: data.id,
    userId: data.user_id,
    destination: data.destination,
    startDate: data.start_date,
    endDate: data.end_date,
    createdAt: data.created_at,
  };
}

export async function deleteTrip(id: string): Promise<void> {
  const uid = await getUserId();
  // trip_days are removed via ON DELETE CASCADE
  await supabase.from('trips').delete().eq('id', id).eq('user_id', uid);
}

// ---------- Trip days ----------
export async function getTripDays(tripId: string): Promise<TripDay[]> {
  const { data } = await supabase.from('trip_days').select('*').eq('trip_id', tripId).order('date', { ascending: true });
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    tripId: row.trip_id,
    date: row.date,
    outfitId: row.outfit_id,
    eventName: row.event_name,
    occasion: (row as any).occasion ?? 'Quotidien',
    createdAt: row.created_at,
  }));
}

export async function upsertTripDay(day: Partial<TripDay> & { tripId: string; date: string }): Promise<TripDay> {
  const payload: any = {
    trip_id: day.tripId,
    date: day.date,
    outfit_id: day.outfitId ?? null,
    event_name: day.eventName ?? null,
  };
  if (day.occasion !== undefined) payload.occasion = day.occasion;
  if (day.id) payload.id = day.id;
  const { data, error } = await supabase.from('trip_days').upsert(payload).select().single();
  if (error) throw error;
  return {
    id: data.id,
    tripId: data.trip_id,
    date: data.date,
    outfitId: data.outfit_id,
    eventName: data.event_name,
    occasion: (data as any).occasion ?? 'Quotidien',
    createdAt: data.created_at,
  };
}

export async function deleteTripDay(id: string): Promise<void> {
  await supabase.from('trip_days').delete().eq('id', id);
}

// ---------- Migration one-shot : split "Cours/Campus" -> "Cours lycée" | "Campus" ----------
export async function migrerTagCours(userId: string): Promise<void> {
  const flag = localStorage.getItem('cours_tag_migre');
  if (flag) return;

  const { data: profil } = await supabase
    .from('profiles')
    .select('lifestyle')
    .eq('id', userId)
    .maybeSingle();

  const lifestyle = (profil as { lifestyle?: string | null } | null)?.lifestyle;
  if (!lifestyle || !['lycee', 'etudes_sup'].includes(lifestyle)) return;

  const nouveauTag = lifestyle === 'lycee' ? 'Cours lycée' : 'Campus';

  const { data: pieces } = await supabase
    .from('wardrobe')
    .select('id, occasion')
    .eq('user_id', userId);
  if (!pieces) return;

  for (const piece of pieces) {
    const occasions: string[] = Array.isArray(piece.occasion) ? piece.occasion as string[] : [];
    if (occasions.includes('Cours/Campus')) {
      const miseAJour = occasions
        .filter((o: string) => o !== 'Cours/Campus')
        .concat(occasions.includes(nouveauTag) ? [] : [nouveauTag]);
      await supabase
        .from('wardrobe')
        .update({ occasion: miseAJour })
        .eq('id', piece.id);
    }
  }

  localStorage.setItem('cours_tag_migre', 'true');
}


// ---------- Auth compat (deprecated — Supabase handles sessions) ----------
export const getAuth = () => null;
export const saveAuth = () => {};
export const clearAuth = () => {};
