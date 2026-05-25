import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { PrettyTabs } from "@/components/PrettyTabs";
import { SponsorMarketplace } from "@/features/sponsor/Marketplace";
import { SponsorPackages } from "@/features/sponsor/Packages";
import { SponsorWorkspace } from "@/features/sponsor/Workspace";

export const Route = createFileRoute("/dashboard/sponsor")({ component: SponsorDashboard });

function SponsorDashboard() {
  return (
    <DashboardShell role="sponsor" title="Sponsor Console">
      <PrettyTabs tabs={[
        { value: "market", label: "Marketplace", content: <SponsorMarketplace/> },
        { value: "pkg", label: "Packages", content: <SponsorPackages/> },
        { value: "ws", label: "Active Workspace", content: <SponsorWorkspace/> },
      ]}/>
    </DashboardShell>
  );
}
