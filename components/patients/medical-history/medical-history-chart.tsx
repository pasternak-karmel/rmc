"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMedicalHistoryStats } from "@/hooks/patient/use-medical-history";
import { useEffect, useRef, useState } from "react";

interface MedicalHistoryChartProps {
  patientId: string;
}

export function MedicalHistoryChart({ patientId }: MedicalHistoryChartProps) {
  const { data: stats, isLoading, error } = useMedicalHistoryStats(patientId);
  const typeChartRef = useRef<HTMLCanvasElement>(null);
  const monthlyChartRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState("type");

  useEffect(() => {
    if (isLoading || error || !stats) return;

    // Draw type distribution chart
    if (activeTab === "type" && typeChartRef.current) {
      const ctx = typeChartRef.current.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(
        0,
        0,
        typeChartRef.current.width,
        typeChartRef.current.height
      );

      const typeData = stats.typeDistribution;
      if (!typeData || typeData.length === 0) return;

      const totalRecords = stats.totalRecords;
      const colors = [
        "#4f46e5", // consultation - indigo
        "#f59e0b", // lab - amber
        "#10b981", // medication - emerald
        "#8b5cf6", // document - violet
        "#ef4444", // alert - red
      ];

      const typeColors: Record<string, string> = {
        consultation: "#4f46e5",
        lab: "#f59e0b",
        medication: "#10b981",
        document: "#8b5cf6",
        alert: "#ef4444",
      };

      // Draw pie chart
      const centerX = typeChartRef.current.width / 2;
      const centerY = typeChartRef.current.height / 2;
      const radius = Math.min(centerX, centerY) * 0.7;

      let startAngle = 0;
      typeData.forEach((item, index) => {
        const sliceAngle = (2 * Math.PI * Number(item.count)) / totalRecords;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();

        // Fill with color
        ctx.fillStyle = typeColors[item.type] || colors[index % colors.length];
        ctx.fill();

        // Draw label
        const labelAngle = startAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Only draw label if slice is big enough
        if (sliceAngle > 0.2) {
          ctx.fillText(item.type, labelX, labelY);
        }

        startAngle += sliceAngle;
      });

      // Draw legend
      const legendX = 10;
      let legendY = typeChartRef.current.height - 10 - typeData.length * 20;

      typeData.forEach((item, index) => {
        const color = typeColors[item.type] || colors[index % colors.length];

        // Draw color box
        ctx.fillStyle = color;
        ctx.fillRect(legendX, legendY, 15, 15);

        // Draw text
        ctx.fillStyle = "#000000";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${item.type} (${item.count})`,
          legendX + 20,
          legendY + 7.5
        );

        legendY += 20;
      });
    }

    // Draw monthly distribution chart
    if (activeTab === "monthly" && monthlyChartRef.current) {
      const ctx = monthlyChartRef.current.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(
        0,
        0,
        monthlyChartRef.current.width,
        monthlyChartRef.current.height
      );

      const monthlyData = stats.monthlyDistribution;
      if (!monthlyData || monthlyData.length === 0) return;

      // Prepare data
      const months = monthlyData.map((item) => {
        const [year, month] = item.month.split("-");
        return `${month}/${year.slice(2)}`;
      });
      const counts = monthlyData.map((item) => Number(item.count));

      // Chart dimensions
      const chartWidth = monthlyChartRef.current.width - 60;
      const chartHeight = monthlyChartRef.current.height - 60;
      const barWidth = (chartWidth / months.length) * 0.7;
      const barSpacing = (chartWidth / months.length) * 0.3;

      // Find max count for scaling
      const maxCount = Math.max(...counts);
      const scale = chartHeight / (maxCount || 1);

      // Draw axes
      ctx.beginPath();
      ctx.moveTo(40, 20);
      ctx.lineTo(40, chartHeight + 30);
      ctx.lineTo(chartWidth + 50, chartHeight + 30);
      ctx.strokeStyle = "#d1d5db";
      ctx.stroke();

      // Draw bars
      months.forEach((month, i) => {
        const barHeight = counts[i] * scale;
        const x = 50 + i * (barWidth + barSpacing);
        const y = chartHeight + 30 - barHeight;

        // Draw bar
        ctx.fillStyle = "#4f46e5";
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw month label
        ctx.fillStyle = "#000000";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(month, x + barWidth / 2, chartHeight + 45);

        // Draw count on top of bar
        if (counts[i] > 0) {
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          ctx.fillText(counts[i].toString(), x + barWidth / 2, y - 5);
        }
      });

      // Draw y-axis labels
      const yAxisSteps = 5;
      for (let i = 0; i <= yAxisSteps; i++) {
        const value = Math.round((maxCount / yAxisSteps) * i);
        const y = chartHeight + 30 - value * scale;

        ctx.fillStyle = "#6b7280";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(value.toString(), 35, y + 3);

        // Draw grid line
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(chartWidth + 50, y);
        ctx.strokeStyle = "#e5e7eb";
        ctx.stroke();
      }
    }
  }, [stats, isLoading, error, activeTab]);

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
    !stats.typeDistribution ||
    stats.typeDistribution.length === 0
  ) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-md">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse de l&apos;historique médical</CardTitle>
        <CardDescription>
          Visualisation des événements médicaux du patient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="type">Par type</TabsTrigger>
            <TabsTrigger value="monthly">Par mois</TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="h-[300px]">
            <canvas
              ref={typeChartRef}
              width={500}
              height={300}
              className="w-full h-full"
            />
          </TabsContent>

          <TabsContent value="monthly" className="h-[300px]">
            <canvas
              ref={monthlyChartRef}
              width={500}
              height={300}
              className="w-full h-full"
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium text-muted-foreground">
              Total des événements
            </div>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium text-muted-foreground">
              Dernier événement
            </div>
            <div className="text-lg font-medium truncate">
              {stats.latestRecord?.title || "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.latestRecord
                ? new Date(stats.latestRecord.date).toLocaleDateString()
                : ""}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
