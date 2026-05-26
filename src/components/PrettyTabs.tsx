import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
export function PrettyTabs({ tabs, defaultValue, value, onValueChange }: { tabs: { value: string; label: string; content: React.ReactNode }[]; defaultValue?: string; value?: string; onValueChange?: (value: string) => void }) {
  return (
    <Tabs defaultValue={defaultValue || tabs[0].value} value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="glass mb-6 rounded-xl p-1 h-auto flex flex-wrap gap-1">
        {tabs.map(t => (
          <TabsTrigger key={t.value} value={t.value}
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-white/50 data-[state=active]:hover:bg-none rounded-lg px-4 py-2 text-sm transition-all">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(t => <TabsContent key={t.value} value={t.value} className="mt-0">{t.content}</TabsContent>)}
    </Tabs>
  );
}
