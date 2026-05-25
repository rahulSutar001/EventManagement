import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
export function PrettyTabs({ tabs, defaultValue }: { tabs: { value: string; label: string; content: React.ReactNode }[]; defaultValue?: string }) {
  return (
    <Tabs defaultValue={defaultValue || tabs[0].value} className="w-full">
      <TabsList className="glass mb-6 rounded-xl p-1 h-auto flex flex-wrap gap-1">
        {tabs.map(t => (
          <TabsTrigger key={t.value} value={t.value}
            className="data-[state=active]:gradient-cta data-[state=active]:text-white rounded-lg px-4 py-2 text-sm">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(t => <TabsContent key={t.value} value={t.value} className="mt-0">{t.content}</TabsContent>)}
    </Tabs>
  );
}
