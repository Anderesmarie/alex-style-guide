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
  return {
    silhouette: data.silhouette || '',
    styles: (data.styles as string[]) || [],
    budget: data.budget || 80,
    brands: (data.brands as string[]) || [],
    taille: data.taille || null,
    corpulence: data.corpulence || null,
    morphologie: data.morphologie || null,
    favorite_colors: (data.favorite_colors as string[]) || [],
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
  });
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
  const { data } = await supabase.from('wardrobe').select('*').eq('user_id', uid).order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    imageBase64: row.image_base64,
    category: row.category || '',
    subcategory: row.subcategory || '',
    layer: row.layer ?? 1,
    type: row.type,
    color: row.color,
    season: row.season as string[],
    style: row.style as string[],
    occasion: row.occasion as string[],
    brand: row.brand || undefined,
    price: row.price || undefined,
  }));
}

export async function addClothing(item: ClothingItem): Promise<void> {
  const uid = await getUserId();
  const { error } = await supabase.from('wardrobe').insert({
    id: item.id,
    user_id: uid,
    image_base64: item.imageBase64,
    category: item.category || null,
    subcategory: item.subcategory || null,
    type: item.type,
    color: item.color,
    season: item.season,
    style: item.style,
    occasion: item.occasion,
    brand: item.brand || null,
    price: item.price || null,
  });
  if (error) {
    console.error('addClothing error:', error);
    throw error;
  }
}

export async function updateClothing(item: ClothingItem): Promise<void> {
  const uid = await getUserId();
  const { error } = await supabase.from('wardrobe').update({
    image_base64: item.imageBase64,
    category: item.category || null,
    subcategory: item.subcategory || null,
    type: item.type,
    color: item.color,
    season: item.season,
    style: item.style,
    occasion: item.occasion,
    brand: item.brand || null,
    price: item.price || null,
  }).eq('id', item.id).eq('user_id', uid);
  if (error) {
    console.error('updateClothing error:', error);
    throw error;
  }
}

export async function deleteClothing(id: string): Promise<void> {
  const uid = await getUserId();
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

export async function setOutfitLayoutData(id: string, layoutData: import('./types').OutfitLayoutData | null): Promise<void> {
  const uid = await getUserId();
  await supabase.from('outfits').update({ layout_data: layoutData as any }).eq('id', id).eq('user_id', uid);
}

export async function deleteOutfit(id: string): Promise<void> {
  const uid = await getUserId();
  await supabase.from('outfits').delete().eq('id', id).eq('user_id', uid);
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
  }));
}

export async function upsertCalendarEvent(event: Partial<CalendarEvent> & { date: string }): Promise<CalendarEvent> {
  const uid = await getUserId();
  const payload: any = {
    user_id: uid,
    date: event.date,
    outfit_id: event.outfitId ?? null,
    event_name: event.eventName ?? null,
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
  if (day.id) payload.id = day.id;
  const { data, error } = await supabase.from('trip_days').upsert(payload).select().single();
  if (error) throw error;
  return {
    id: data.id,
    tripId: data.trip_id,
    date: data.date,
    outfitId: data.outfit_id,
    eventName: data.event_name,
    createdAt: data.created_at,
  };
}

export async function deleteTripDay(id: string): Promise<void> {
  await supabase.from('trip_days').delete().eq('id', id);
}

// ---------- Auth compat (deprecated — Supabase handles sessions) ----------
export const getAuth = () => null;
export const saveAuth = () => {};
export const clearAuth = () => {};
