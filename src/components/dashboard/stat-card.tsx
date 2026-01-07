import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  className?: string;
  onClick?: () => void;
};

export default function StatCard({ title, value, icon: Icon, description, className, onClick }: StatCardProps) {
  const CardComponent = (
    <Card className={cn("shadow-md hover:shadow-lg transition-shadow", onClick && "cursor-pointer", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return <button onClick={onClick} className="text-left w-full h-full">{CardComponent}</button>;
  }

  return CardComponent;
}
