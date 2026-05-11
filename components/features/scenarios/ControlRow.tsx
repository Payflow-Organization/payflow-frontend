import { Badge } from "@/components/ui/badge";

export function ControlRow({ icon, title, description, active, children }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {active && <Badge className="bg-primary/10 text-primary border-0 text-xs py-0 h-5">Active</Badge>}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {children}
    </div>
  );
}
