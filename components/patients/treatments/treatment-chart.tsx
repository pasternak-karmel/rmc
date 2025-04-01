"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTreatmentStats } from "@/hooks/patient/use-treatments";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

interface TreatmentChartProps {
  patientId: string;
}

export function TreatmentChart({ patientId }: TreatmentChartProps) {
  const { data: stats, isLoading, error } = useTreatmentStats(patientId);
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isLoading || error || !stats || !chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);

    const categoryData = stats.categoryDistribution;
    if (!categoryData || categoryData.length === 0) return;

    // Sort categories by count
    const sortedCategories = [...categoryData].sort(
      (a, b) => Number(b.count) - Number(a.count)
    );

    // Chart dimensions
    const chartWidth = chartRef.current.width - 160; // Leave space for labels
    const chartHeight = chartRef.current.height - 40;
    const barHeight = Math.min(
      30,
      (chartHeight / sortedCategories.length) * 0.7
    );
    const barSpacing = Math.min(
      10,
      (chartHeight / sortedCategories.length) * 0.3
    );

    // Find max count for scaling
    const maxCount = Math.max(
      ...sortedCategories.map((item) => Number(item.count))
    );
    const scale = chartWidth / (maxCount || 1);

    // Draw bars
    sortedCategories.forEach((item, i) => {
      const barWidth = Number(item.count) * scale;
      const y = 20 + i * (barHeight + barSpacing);

      // Draw category label
      ctx.fillStyle = "#000000";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(
        item.category.length > 15
          ? item.category.substring(0, 15) + "..."
          : item.category,
        140,
        y + barHeight / 2 + 4
      );

      // Draw bar
      ctx.fillStyle = "#8b5cf6"; // Violet
      ctx.fillRect(150, y, barWidth, barHeight);

      // Draw count at end of bar
      ctx.fillStyle = "#000000";
      ctx.textAlign = "left";
      ctx.fillText(
        item.count.toString(),
        155 + barWidth,
        y + barHeight / 2 + 4
      );
    });
  }, [stats, isLoading, error]);

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-md">
        <p className="text-destructive">
          Erreur lors du chargement des statistiques: {error.message}
        </p>
      </div>
    );
  }

  if (
    !stats ||
    !stats.categoryDistribution ||
    stats.categoryDistribution.length === 0
  ) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-md">
        <p className="text-muted-foreground">Aucun traitement disponible</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse des traitements</CardTitle>
        <CardDescription>
          Répartition des médicaments par catégorie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium text-muted-foreground">
              Traitements actifs
            </div>
            <div className="text-2xl font-bold">{stats.activeTreatments}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium text-muted-foreground">
              Traitements arrêtés
            </div>
            <div className="text-2xl font-bold">
              {stats.discontinuedTreatments}
            </div>
          </div>
        </div>

        {stats.interactionsCount > 0 && (
          <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-800">
                Interactions médicamenteuses potentielles
              </p>
              <p className="text-sm text-amber-700">
                {stats.interactionsCount} médicament(s) avec des interactions
                potentielles
              </p>
            </div>
          </div>
        )}

        <div className="h-[300px]">
          <canvas
            ref={chartRef}
            width={500}
            height={300}
            className="w-full h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
