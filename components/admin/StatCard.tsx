import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
}

export default function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && <p className="text-xs text-green-600">{trend}</p>}
        </div>
        <div className="rounded-lg bg-muted p-2">{icon}</div>
      </CardContent>
    </Card>
  );
}
