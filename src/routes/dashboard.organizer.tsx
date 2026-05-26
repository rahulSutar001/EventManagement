import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PrettyTabs } from "@/components/PrettyTabs";
import { OrganizerHome } from "@/features/organizer/Home";
import { OrganizerCreateEvent } from "@/features/organizer/CreateEvent";
import { OrganizerWorkspace } from "@/features/organizer/Workspace";
import { UserProfile } from "@/components/UserProfile";

export const Route = createFileRoute("/dashboard/organizer")({ component: OrganizerDashboard });

function OrganizerDashboard() {
  return (
    <DashboardShell role="organizer" title="Organizer Command Center">
      <PrettyTabs tabs={[
        { value: "home", label: "Market Insights", content: <OrganizerHome/> },
        { value: "create", label: "Create Event", content: <OrganizerCreateEvent/> },
        { value: "workspace", label: "Event Workspace", content: <OrganizerWorkspace/> },
        { value: "profile", label: "Profile", content: <UserProfile/> },
      ]}/>
    </DashboardShell>
  );
}
