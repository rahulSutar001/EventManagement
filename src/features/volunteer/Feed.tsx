import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const inputCls = "w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm";

export function VolunteerFeed() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<string[]>([]);
  const [openFor, setOpenFor] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("events").select("*").eq("status","published").order("created_at", {ascending:false})
      .then(({data})=>setEvents(data||[]));
    supabase.from("volunteer_applications").select("event_id").eq("volunteer_id", user.id)
      .then(({data})=>setApplied(new Set((data||[]).map(a=>a.event_id))));
    supabase.from("volunteer_profiles").select("skills").eq("profile_id", user.id).maybeSingle()
      .then(({data})=>setSkills((data?.skills as string[])||[]));
  }, [user]);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map(e => {
        const themes: string[] = Array.isArray(e.themes) ? e.themes : [];
        const matchTag = themes.find(t => skills.some(s => s.toLowerCase().includes(t.toLowerCase()))) || skills[0] || "your profile";
        return (
          <div key={e.id} className="glass rounded-2xl p-5 flex flex-col">
            <div className="h-32 rounded-xl bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 mb-3 grid place-items-center text-white text-2xl font-bold opacity-90">{e.title.slice(0,2).toUpperCase()}</div>
            <h3 className="font-semibold">{e.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{e.event_date || "Date TBA"} • {e.expected_footfall || "—"} attendees</p>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-medium"><Sparkles className="h-3 w-3"/> Matches #{matchTag}</div>
            <button disabled={applied.has(e.id)} onClick={()=>setOpenFor(e)} className="mt-4 w-full rounded-lg gradient-cta py-2 text-sm disabled:opacity-50">
              {applied.has(e.id) ? "Applied ✓" : "Apply to Help"}
            </button>
          </div>
        );
      })}
      {openFor && <ApplyModal event={openFor} onClose={()=>setOpenFor(null)} onDone={()=>{setApplied(new Set([...applied, openFor.id])); setOpenFor(null);}}/>}
      {!events.length && <div className="col-span-full glass rounded-2xl p-8 text-center text-muted-foreground">No published events yet.</div>}
    </div>
  );
}

function ApplyModal({ event, onClose, onDone }: { event: any; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>({});
  const [form, setForm] = useState<any>({ tshirt_size: "M", dietary: [], availability: [], preferred_dept: "Logistics & Crowd Management", role_type: "Volunteer", why_volunteer: "", whatsapp: "", emergency_contact: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({data})=>setProfile(data));
  }, [user]);

  const toggle = (k: string, v: string) => setForm({ ...form, [k]: form[k].includes(v) ? form[k].filter((x:string)=>x!==v) : [...form[k], v] });

  const submit = async () => {
    if (!user || !form.why_volunteer || !form.whatsapp) { toast.error("Fill all required fields"); return; }
    const { error } = await supabase.from("volunteer_applications").insert({ event_id: event.id, volunteer_id: user.id, ...form });
    if (error) { toast.error(error.message); return; }
    toast.success("Application submitted!");
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4 overflow-auto" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 max-w-2xl w-full my-8" onClick={(e)=>e.stopPropagation()}>
        <h3 className="font-semibold text-lg">Apply to volunteer — {event.title}</h3>
        <div className="mt-3 rounded-lg bg-accent p-3 text-xs">Auto-filled from your profile: <b>{profile.full_name}</b> • {profile.email}</div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs">T-Shirt size</label>
            <select className={inputCls} value={form.tshirt_size} onChange={(e)=>setForm({...form, tshirt_size:e.target.value})}>
              {["S","M","L","XL","XXL"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs">Preferred department</label>
            <select className={inputCls} value={form.preferred_dept} onChange={(e)=>setForm({...form, preferred_dept:e.target.value})}>
              {["Technical Support","Logistics & Crowd Management","Hospitality & Food","Media & Social","Registration & Helpdesk"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs">Dietary</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {["Veg","Non-Veg","Jain","Vegan","Allergies"].map(d => (
              <button key={d} type="button" onClick={()=>toggle("dietary", d)} className={`px-3 py-1 text-xs rounded-full border ${form.dietary.includes(d)?"gradient-cta text-white border-transparent":"border-input bg-white/70"}`}>{d}</button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs">Availability</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {["Day 1 Morning","Day 1 Night Shift","Day 2 Full Day"].map(d => (
              <button key={d} type="button" onClick={()=>toggle("availability", d)} className={`px-3 py-1 text-xs rounded-full border ${form.availability.includes(d)?"gradient-cta text-white border-transparent":"border-input bg-white/70"}`}>{d}</button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          {["Volunteer","Lead Volunteer"].map(r => (
            <label key={r} className="flex items-center gap-2">
              <input type="radio" name="role_type" checked={form.role_type===r} onChange={()=>setForm({...form, role_type:r})}/> {r}
            </label>
          ))}
        </div>

        <div className="mt-3">
          <label className="text-xs">Why do you want to volunteer? (50 words)</label>
          <textarea rows={3} maxLength={400} className={inputCls} value={form.why_volunteer} onChange={(e)=>setForm({...form, why_volunteer:e.target.value})}/>
        </div>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div><label className="text-xs">WhatsApp number</label><input className={inputCls} value={form.whatsapp} onChange={(e)=>setForm({...form, whatsapp:e.target.value})}/></div>
          <div><label className="text-xs">Emergency contact</label><input placeholder="Name + number" className={inputCls} value={form.emergency_contact} onChange={(e)=>setForm({...form, emergency_contact:e.target.value})}/></div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm">Cancel</button>
          <button onClick={submit} className="rounded-lg gradient-cta px-4 py-2 text-sm">Submit application</button>
        </div>
      </div>
    </div>
  );
}
