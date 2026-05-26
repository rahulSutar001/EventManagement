import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Shield, Calendar, Globe, Edit3, Save, Linkedin, Github } from "lucide-react";
import { toast } from "sonner";

export function UserProfile() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      setFullName(data?.full_name || "");
      setBio(data?.bio || "");
      setLinkedin(data?.linkedin_url || "");
      setGithub(data?.github_url || "");
    } catch (err: any) {
      toast.error("Failed to load profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio: bio,
          linkedin_url: linkedin,
          github_url: github
        })
        .eq("id", user.id);

      if (profileErr) throw profileErr;

      toast.success("✨ Social connections updated successfully!");
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      toast.error("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading profile...</div>;
  }

  const roleColors: Record<string, string> = {
    organizer: "bg-pink-100 text-pink-700 border-pink-200",
    sponsor: "bg-purple-100 text-purple-700 border-purple-200",
    volunteer: "bg-amber-100 text-amber-700 border-amber-200",
    participant: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const createdDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-strong rounded-2xl p-8 shadow-md border border-white/20 bg-white/40 backdrop-blur-md relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 pb-6 border-b border-border/40">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="h-16 w-16 rounded-full gradient-cta grid place-items-center text-white text-2xl font-bold shadow-md">
                {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <div className="flex flex-col md:flex-row items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="rounded-lg border border-input bg-white/70 px-3 py-1.5 text-base font-semibold outline-none focus:ring-2 focus:ring-primary text-center md:text-left"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-foreground">{fullName || "Add your name"}</h2>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${roleColors[role || "participant"]}`}>
                    {role || "Participant"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-1">
                  <Mail className="h-3.5 w-3.5" /> {profile?.email || user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={saving}
              className="rounded-lg border border-input bg-white/70 px-4 py-2 text-xs font-semibold hover:bg-accent flex items-center gap-1.5 shadow-sm transition"
            >
              {isEditing ? (
                <>
                  <Save className="h-3.5 w-3.5 text-primary" /> {saving ? "Saving..." : "Save Changes"}
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Profile details grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Account Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Account Role</p>
                    <p className="font-medium capitalize">{role || "Participant"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="font-medium">{createdDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Linked Social Profiles</h3>
              <div className="space-y-3">
                {/* LinkedIn Section */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-5 w-5 text-blue-600 shrink-0" />
                        <input
                          type="url"
                          className="w-full rounded-lg border border-input bg-white/70 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                          placeholder="https://linkedin.com/in/yourusername"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                        />
                      </div>
                    ) : (
                      linkedin ? (
                        <a
                          href={linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-purple-600 hover:text-purple-800 font-semibold hover:underline transition"
                        >
                          <Linkedin className="h-5 w-5 text-purple-600 shrink-0" /> LinkedIn Profile
                        </a>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-2 text-xs border border-dashed border-gray-300 text-gray-500 rounded-full px-3.5 py-1.5 cursor-pointer hover:bg-gray-50 transition font-semibold bg-white/50"
                        >
                          <Linkedin className="h-4 w-4 text-gray-400 shrink-0" /> ➕ Connect LinkedIn
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* GitHub Section */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Github className="h-5 w-5 text-foreground shrink-0" />
                        <input
                          type="url"
                          className="w-full rounded-lg border border-input bg-white/70 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                          placeholder="https://github.com/yourusername"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                        />
                      </div>
                    ) : (
                      github ? (
                        <a
                          href={github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-purple-600 hover:text-purple-800 font-semibold hover:underline transition"
                        >
                          <Github className="h-5 w-5 text-purple-600 shrink-0" /> GitHub Profile
                        </a>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-2 text-xs border border-dashed border-gray-300 text-gray-500 rounded-full px-3.5 py-1.5 cursor-pointer hover:bg-gray-50 transition font-semibold bg-white/50"
                        >
                          <Github className="h-4 w-4 text-gray-400 shrink-0" /> ➕ Connect GitHub
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="pt-4 border-t border-border/40 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Biography</h3>
            {isEditing ? (
              <textarea
                className="w-full rounded-lg border border-input bg-white/70 p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed bg-white/30 p-3 rounded-xl border border-border/20">
                {bio || <span className="text-muted-foreground italic">No biography added yet. Click edit to write one!</span>}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
