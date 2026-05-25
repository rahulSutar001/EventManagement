
CREATE TYPE public.app_role AS ENUM ('organizer','volunteer','sponsor','participant');
CREATE TYPE public.event_status AS ENUM ('draft','published','completed');
CREATE TYPE public.app_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.task_status AS ENUM ('todo','in_progress','done');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, email TEXT, role public.app_role NOT NULL,
  avatar_url TEXT, bio TEXT, hashtags TEXT,
  xp INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_sel" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_ins" ON public.profiles FOR INSERT WITH CHECK (auth.uid()=id);
CREATE POLICY "profiles_upd" ON public.profiles FOR UPDATE USING (auth.uid()=id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=_user_id AND role=_role)
$$;

CREATE TABLE public.organizer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_name TEXT, org_type TEXT, past_events_count INT DEFAULT 0,
  target_audience JSONB DEFAULT '[]'::jsonb
);
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_sel" ON public.organizer_profiles FOR SELECT USING (true);
CREATE POLICY "op_mut" ON public.organizer_profiles FOR ALL USING (auth.uid()=profile_id) WITH CHECK (auth.uid()=profile_id);

CREATE TABLE public.volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  college TEXT, year TEXT, skills JSONB DEFAULT '[]'::jsonb, experience_level TEXT
);
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vp_sel" ON public.volunteer_profiles FOR SELECT USING (true);
CREATE POLICY "vp_mut" ON public.volunteer_profiles FOR ALL USING (auth.uid()=profile_id) WITH CHECK (auth.uid()=profile_id);

CREATE TABLE public.sponsor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT, industry TEXT, budget_range TEXT, primary_goal JSONB DEFAULT '[]'::jsonb
);
ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_sel" ON public.sponsor_profiles FOR SELECT USING (true);
CREATE POLICY "sp_mut" ON public.sponsor_profiles FOR ALL USING (auth.uid()=profile_id) WITH CHECK (auth.uid()=profile_id);

CREATE TABLE public.participant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  designation TEXT, interests JSONB DEFAULT '[]'::jsonb,
  github_url TEXT, linkedin_url TEXT
);
ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pp_sel" ON public.participant_profiles FOR SELECT USING (true);
CREATE POLICY "pp_mut" ON public.participant_profiles FOR ALL USING (auth.uid()=profile_id) WITH CHECK (auth.uid()=profile_id);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT,
  themes JSONB DEFAULT '[]'::jsonb,
  expected_footfall INT, total_budget NUMERIC,
  itemized_budget JSONB DEFAULT '{}'::jsonb,
  status public.event_status DEFAULT 'draft',
  sponsor_kanban_enabled BOOLEAN DEFAULT false,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_sel" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_ins" ON public.events FOR INSERT WITH CHECK (auth.uid()=organizer_id);
CREATE POLICY "events_upd" ON public.events FOR UPDATE USING (auth.uid()=organizer_id);
CREATE POLICY "events_del" ON public.events FOR DELETE USING (auth.uid()=organizer_id);

CREATE TABLE public.sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT, custom_package JSONB DEFAULT '{}'::jsonb,
  status public.app_status DEFAULT 'pending',
  signed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sps_sel" ON public.sponsorships FOR SELECT USING (
  auth.uid()=sponsor_id OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);
CREATE POLICY "sps_ins" ON public.sponsorships FOR INSERT WITH CHECK (auth.uid()=sponsor_id);
CREATE POLICY "sps_upd" ON public.sponsorships FOR UPDATE USING (
  auth.uid()=sponsor_id OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);

CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tshirt_size TEXT, dietary JSONB DEFAULT '[]'::jsonb,
  availability JSONB DEFAULT '[]'::jsonb,
  preferred_dept TEXT, role_type TEXT,
  why_volunteer TEXT, whatsapp TEXT,
  emergency_contact TEXT,
  status public.app_status DEFAULT 'pending',
  is_lead BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "va_sel" ON public.volunteer_applications FOR SELECT USING (
  auth.uid()=volunteer_id OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);
CREATE POLICY "va_ins" ON public.volunteer_applications FOR INSERT WITH CHECK (auth.uid()=volunteer_id);
CREATE POLICY "va_upd" ON public.volunteer_applications FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL, category TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.task_status DEFAULT 'todo',
  notes TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_sel" ON public.tasks FOR SELECT USING (
  auth.uid()=assigned_to
  OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
  OR EXISTS(SELECT 1 FROM public.events e JOIN public.sponsorships s ON s.event_id=e.id
            WHERE e.id=event_id AND e.sponsor_kanban_enabled=true AND s.sponsor_id=auth.uid())
);
CREATE POLICY "tasks_mut" ON public.tasks FOR ALL USING (
  auth.uid()=assigned_to OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
) WITH CHECK (
  auth.uid()=assigned_to OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);

CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  qr_code TEXT UNIQUE NOT NULL,
  checked_in BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, participant_id)
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reg_sel" ON public.registrations FOR SELECT USING (
  auth.uid()=participant_id OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);
CREATE POLICY "reg_ins" ON public.registrations FOR INSERT WITH CHECK (auth.uid()=participant_id);
CREATE POLICY "reg_upd" ON public.registrations FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_sel" ON public.messages FOR SELECT USING (auth.uid()=sender_id OR auth.uid()=receiver_id);
CREATE POLICY "msg_ins" ON public.messages FOR INSERT WITH CHECK (auth.uid()=sender_id);

CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  certificate_uid TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  performance_score NUMERIC
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert_sel" ON public.certificates FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "cert_ins" ON public.certificates FOR INSERT WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 10),
  rated_by UUID REFERENCES public.profiles(id),
  xp_awarded INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_sel" ON public.performance_scores FOR SELECT USING (
  auth.uid()=volunteer_id OR auth.uid()=rated_by
  OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);
CREATE POLICY "ps_ins" ON public.performance_scores FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.registrations REPLICA IDENTITY FULL;
