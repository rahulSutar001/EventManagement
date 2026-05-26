import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PrettyTabs } from "@/components/PrettyTabs";
import { VolunteerProfile } from "@/features/volunteer/Profile";
import { VolunteerFeed } from "@/features/volunteer/Feed";
import { VolunteerOps } from "@/features/volunteer/Ops";
import { UserProfile } from "@/components/UserProfile";

export const Route = createFileRoute("/dashboard/volunteer")({ component: VolunteerDashboard });

function VolunteerDashboard() {
  return (
    <DashboardShell role="volunteer" title="Volunteer Hub">
      <PrettyTabs tabs={[
        { value: "profile", label: "Profile", content: <UserProfile/> },
        { value: "skills", label: "Volunteer Skills", content: <VolunteerProfile/> },
        { value: "feed", label: "Opportunity Feed", content: <VolunteerFeed/> },
        { value: "ops", label: "Live Event Ops", content: <VolunteerOps/> },
      ]}/>
    </DashboardShell>
  );
}
