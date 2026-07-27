import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScenarioSummary } from '@/types';

interface ScenarioCardProps {
  scenario: ScenarioSummary;
  onSelect: (id: string) => void;
}

function humanizeDimension(dimension: string): string {
  return dimension
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function ScenarioCard({ scenario, onSelect }: ScenarioCardProps) {
  return (
    <Card className="flex flex-col gap-4 rounded-card bg-studio-surface p-5 transition-colors hover:bg-studio-warm hover:shadow-float">
      <CardHeader className="p-0">
        <CardTitle className="text-headline font-semibold text-ink">
          {scenario.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-0">
        <p className="line-clamp-3 text-body text-muted">{scenario.context}</p>
        <div className="flex flex-wrap gap-2">
          {scenario.dimensions.map((dimension) => (
            <Badge
              key={dimension}
              className="rounded-pip border-transparent bg-coaching-amber text-label font-medium text-ink hover:bg-coaching-amber"
            >
              {humanizeDimension(dimension)}
            </Badge>
          ))}
        </div>
        <Button
          onClick={() => onSelect(scenario.id)}
          className="mt-auto self-start"
        >
          Select
        </Button>
      </CardContent>
    </Card>
  );
}
