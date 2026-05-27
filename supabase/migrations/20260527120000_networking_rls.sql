-- Drop the existing registration select policy
DROP POLICY IF EXISTS "reg_sel" ON public.registrations;

-- Create the new policy that allows:
-- 1. A participant to view their own registration
-- 2. A participant to view other registrations of an event they are registered for (for networking)
-- 3. An organizer to view registrations for their own event
CREATE POLICY "reg_sel" ON public.registrations FOR SELECT USING (
  auth.uid() = participant_id 
  OR EXISTS (
    SELECT 1 FROM public.registrations r 
    WHERE r.event_id = registrations.event_id 
    AND r.participant_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id 
    AND e.organizer_id = auth.uid()
  )
);
