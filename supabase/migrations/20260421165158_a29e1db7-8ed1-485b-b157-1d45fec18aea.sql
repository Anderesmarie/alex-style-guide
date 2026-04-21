-- TABLE 1: calendar_events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  event_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_events_user_date ON public.calendar_events(user_id, date);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events"
ON public.calendar_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events"
ON public.calendar_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
ON public.calendar_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
ON public.calendar_events FOR DELETE
USING (auth.uid() = user_id);

-- TABLE 2: trips
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_user ON public.trips(user_id);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips"
ON public.trips FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
ON public.trips FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
ON public.trips FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
ON public.trips FOR DELETE
USING (auth.uid() = user_id);

-- TABLE 3: trip_days
CREATE TABLE public.trip_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  event_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_days_trip ON public.trip_days(trip_id);

ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trip days"
ON public.trip_days FOR SELECT
USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_days.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can insert own trip days"
ON public.trip_days FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_days.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can update own trip days"
ON public.trip_days FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_days.trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can delete own trip days"
ON public.trip_days FOR DELETE
USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_days.trip_id AND t.user_id = auth.uid()));