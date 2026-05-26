import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PrettyTabs } from "@/components/PrettyTabs";
import { SponsorMarketplace } from "@/features/sponsor/Marketplace";
import { SponsorPackages } from "@/features/sponsor/Packages";
import { SponsorWorkspace } from "@/features/sponsor/Workspace";
import { SponsorAnalytics } from "@/features/sponsor/Analytics";
import { UserProfile } from "@/components/UserProfile";

export const Route = createFileRoute("/dashboard/sponsor")({ component: SponsorDashboard });

function SponsorDashboard() {
  const [tab, setTab] = useState("market");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  return (
    <DashboardShell role="sponsor" title="Sponsor Console">
      <PrettyTabs value={tab} onValueChange={setTab} tabs={[
        { value: "market", label: "Marketplace", content: <SponsorMarketplace onSelectEvent={(id) => { setSelectedEventId(id); setTab("pkg"); }}/> },
        { value: "pkg", label: "Packages", content: <SponsorPackages preselectedEventId={selectedEventId}/> },
        { value: "analytics", label: "Analytics & ROI", content: <SponsorAnalytics/> },
        { value: "ws", label: "Active Workspace", content: <SponsorWorkspace/> },
        { value: "profile", label: "Profile", content: <UserProfile/> },
      ]}/>
    </DashboardShell>
  );
}
