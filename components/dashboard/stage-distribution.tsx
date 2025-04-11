"use client";

import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function StageDistribution() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: stats, isLoading, error } = useDashboard();
  const { theme } = useTheme();

  useEffect(() => {
    if (isLoading || error || !stats) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stages = [1, 2, 3, 4, 5];
    const stageCounts = stages.map((stage) => {
      return (
        stats.stageDistribution.find((item) => item.stage === stage)?.count || 0
      );
    });

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let startAngle = -Math.PI / 2;

    const colors = ["#646cff", "#7479ff", "#8481ff", "#9489ff", "#a491ff"];

    const radius = Math.min(canvas.width, canvas.height) / 2.5;

    const textColor = theme === "dark" ? "white" : "black";

    for (let i = 0; i < stages.length; i++) {
      const sliceAngle = (stageCounts[i] / stats.totalPatients) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = colors[i];
      ctx.fill();

      const midAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + radius * 1.1 * Math.cos(midAngle);
      const labelY = centerY + radius * 1.1 * Math.sin(midAngle);

      // Draw label
      ctx.fillStyle = textColor;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Stade ${stages[i]}`, labelX, labelY);

      startAngle += sliceAngle;
    }
  }, [stats, isLoading, error, theme]);

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (error) {
    return <p className="text-red-500">Error: {error.message}</p>;
  }

  return (
    <CardContent className="p-0">
      <canvas ref={canvasRef} width={300} height={200} />
    </CardContent>
  );
}
