"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAvailableVitalSignTypes,
  useVitalSignTrends,
} from "@/hooks/patient/use-vital-signs";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";

interface VitalSignsChartProps {
  patientId: string;
}

export function VitalSignsChart({ patientId }: VitalSignsChartProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const { data: vitalTypes, isLoading: isLoadingTypes } =
    useAvailableVitalSignTypes(patientId);
  const { data: trends, isLoading: isLoadingTrends } = useVitalSignTrends(
    patientId,
    selectedType
  );
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Set the first type as default when vital sign types are loaded
  useEffect(() => {
    if (vitalTypes && vitalTypes.length > 0 && !selectedType) {
      setSelectedType(vitalTypes[0]);
    }
  }, [vitalTypes, selectedType]);

  // Draw chart when trends data changes
  useEffect(() => {
    if (isLoadingTrends || !trends || trends.length === 0 || !chartRef.current)
      return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);

    // Prepare data
    const dates = trends.map((item) =>
      format(parseISO(item.date), "dd/MM/yy", { locale: fr })
    );
    const values = trends.map((item) => item.value);
    const unit = trends[0]?.unit || "";

    // Chart dimensions
    const chartWidth = chartRef.current.width - 60;
    const chartHeight = chartRef.current.height - 60;

    // Find min and max values for scaling
    let minValue = Math.min(...values);
    let maxValue = Math.max(...values);

    // Add some padding
    const range = maxValue - minValue;
    minValue = Math.max(0, minValue - range * 0.1);
    maxValue = maxValue + range * 0.1;

    const scale = chartHeight / (maxValue - minValue || 1);

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(40, chartHeight + 30);
    ctx.lineTo(chartWidth + 50, chartHeight + 30);
    ctx.strokeStyle = "#d1d5db";
    ctx.stroke();

    // Draw line chart
    if (values.length > 1) {
      const pointSpacing = chartWidth / (values.length - 1);

      // Draw line
      ctx.beginPath();
      values.forEach((value, i) => {
        const x = 40 + i * pointSpacing;
        const y = chartHeight + 30 - (value - minValue) * scale;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = "#10b981"; // Emerald
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw points
      values.forEach((value, i) => {
        const x = 40 + i * pointSpacing;
        const y = chartHeight + 30 - (value - minValue) * scale;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#10b981";
        ctx.fill();

        // Draw value above point
        ctx.fillStyle = "#000000";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(value.toString(), x, y - 10);
      });
    } else if (values.length === 1) {
      // Draw single point
      const x = chartWidth / 2 + 40;
      const y = chartHeight + 30 - (values[0] - minValue) * scale;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#10b981";
      ctx.fill();

      // Draw value above point
      ctx.fillStyle = "#000000";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(values[0].toString(), x, y - 10);
    }

    // Draw x-axis labels (dates)
    dates.forEach((date, i) => {
      const x =
        i === 0
          ? 40
          : i === dates.length - 1
          ? chartWidth + 40
          : 40 + i * (chartWidth / (dates.length - 1));

      ctx.fillStyle = "#6b7280";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(date, x, chartHeight + 45);
    });

    // Draw y-axis labels
    const yAxisSteps = 5;
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = minValue + ((maxValue - minValue) / yAxisSteps) * i;
      const y = chartHeight + 30 - (value - minValue) * scale;

      ctx.fillStyle = "#6b7280";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(value.toFixed(1), 35, y + 3);

      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(chartWidth + 50, y);
      ctx.strokeStyle = "#e5e7eb";
      ctx.stroke();
    }

    // Draw unit
    if (unit) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Unité: ${unit}`, 40, 15);
    }
  }, [trends, isLoadingTrends]);

  if (isLoadingTypes) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!vitalTypes || vitalTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] border rounded-md">
        <p className="text-muted-foreground">
          Aucune constante vitale disponible
        </p>
      </div>
    );
  }

  // Map vital sign types to French labels
  const vitalSignLabels: Record<string, string> = {
    bloodPressureSystolic: "Pression artérielle systolique",
    bloodPressureDiastolic: "Pression artérielle diastolique",
    heartRate: "Fréquence cardiaque",
    temperature: "Température",
    weight: "Poids",
    height: "Taille",
    respiratoryRate: "Fréquence respiratoire",
    oxygenSaturation: "Saturation en oxygène",
    bloodGlucose: "Glycémie",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des constantes vitales</CardTitle>
        <CardDescription>
          Suivi des paramètres vitaux dans le temps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une constante" />
            </SelectTrigger>
            <SelectContent>
              {vitalTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {vitalSignLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoadingTrends ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !trends || trends.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] border rounded-md">
            <p className="text-muted-foreground">
              Aucune donnée disponible pour cette constante
            </p>
          </div>
        ) : (
          <div className="h-[300px]">
            <canvas
              ref={chartRef}
              width={500}
              height={300}
              className="w-full h-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
