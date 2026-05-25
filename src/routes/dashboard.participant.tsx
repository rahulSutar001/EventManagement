import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PrettyTabs } from "@/components/PrettyTabs";
import { ParticipantDiscover } from "@/features/participant/Discover";
import { ParticipantMyEvents } from "@/features/participant/MyEvents";
import { ParticipantActive } from "@/features/participant/Active";

export const Route = createFileRoute("/dashboard/participant")({ component: ParticipantDashboard });

function ParticipantDashboard() {
  return (
    <DashboardShell role="participant" title="Discover & Attend">
      <PrettyTabs tabs={[
        { value: "discover", label: "Discover", content: <ParticipantDiscover/> },
        { value: "my", label: "My Events", content: <ParticipantMyEvents/> },
        { value: "active", label: "Active Event", content: <ParticipantActive/> },
      ]}/>
    </DashboardShell>
  );
}
