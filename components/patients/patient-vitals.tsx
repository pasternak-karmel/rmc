"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";

interface PatientVitalsProps {
  patientId: string;
}

export function PatientVitals({ patientId }: PatientVitalsProps) {
  const bpCanvasRef = useRef<HTMLCanvasElement>(null);
  const weightCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Données pour la pression artérielle
    const bpData = {
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
      systolic: [145, 150, 155, 160, 155, 160],
      diastolic: [85, 90, 90, 95, 90, 95],
    };

    // Données pour le poids
    const weightData = {
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
      values: [72, 71.5, 71, 70.5, 70, 69.5],
    };

    // Dessiner le graphique de pression artérielle
    const bpCanvas = bpCanvasRef.current;
    if (bpCanvas) {
      const ctx = bpCanvas.getContext("2d");
      if (ctx) {
        // Définir les dimensions et marges
        const width = bpCanvas.width;
        const height = bpCanvas.height;
        const margin = 40;
        const graphWidth = width - 2 * margin;
        const graphHeight = height - 2 * margin;

        // Effacer le canvas
        ctx.clearRect(0, 0, width, height);

        // Dessiner les axes
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, height - margin);
        ctx.lineTo(width - margin, height - margin);
        ctx.strokeStyle = "#d1d5db";
        ctx.stroke();

        // Dessiner les lignes de grille horizontales
        const numHLines = 5;
        ctx.beginPath();
        for (let i = 0; i <= numHLines; i++) {
          const y = margin + i * (graphHeight / numHLines);
          ctx.moveTo(margin, y);
          ctx.lineTo(width - margin, y);
        }
        ctx.strokeStyle = "#e5e7eb";
        ctx.stroke();

        // Dessiner les valeurs systoliques
        const xStep = graphWidth / (bpData.labels.length - 1);
        const yScaleSys = graphHeight / (180 - 80);

        ctx.beginPath();
        bpData.systolic.forEach((value, index) => {
          const x = margin + index * xStep;
          const y = height - margin - (value - 80) * yScaleSys;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Dessiner les points
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dessiner les valeurs diastoliques
        ctx.beginPath();
        bpData.diastolic.forEach((value, index) => {
          const x = margin + index * xStep;
          const y = height - margin - (value - 80) * yScaleSys;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Dessiner les points
          ctx.fillStyle = "#3b82f6";
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dessiner les étiquettes des axes
        ctx.fillStyle = "#000";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";

        bpData.labels.forEach((label, index) => {
          const x = margin + index * xStep;
          ctx.fillText(label, x, height - margin + 20);
        });

        // Légende
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(width - margin - 100, margin, 12, 12);
        ctx.fillStyle = "#000";
        ctx.textAlign = "left";
        ctx.fillText("Systolique", width - margin - 80, margin + 10);

        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(width - margin - 100, margin + 20, 12, 12);
        ctx.fillStyle = "#000";
        ctx.fillText("Diastolique", width - margin - 80, margin + 30);
      }
    }

    // Dessiner le graphique de poids
    const weightCanvas = weightCanvasRef.current;
    if (weightCanvas) {
      const ctx = weightCanvas.getContext("2d");
      if (ctx) {
        // Définir les dimensions et marges
        const width = weightCanvas.width;
        const height = weightCanvas.height;
        const margin = 40;
        const graphWidth = width - 2 * margin;
        const graphHeight = height - 2 * margin;

        // Effacer le canvas
        ctx.clearRect(0, 0, width, height);

        // Dessiner les axes
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, height - margin);
        ctx.lineTo(width - margin, height - margin);
        ctx.strokeStyle = "#d1d5db";
        ctx.stroke();

        // Dessiner les lignes de grille horizontales
        const numHLines = 5;
        ctx.beginPath();
        for (let i = 0; i <= numHLines; i++) {
          const y = margin + i * (graphHeight / numHLines);
          ctx.moveTo(margin, y);
          ctx.lineTo(width - margin, y);
        }
        ctx.strokeStyle = "#e5e7eb";
        ctx.stroke();

        // Dessiner les valeurs de poids
        const xStep = graphWidth / (weightData.labels.length - 1);
        const yScale = graphHeight / (75 - 65);

        ctx.beginPath();
        weightData.values.forEach((value, index) => {
          const x = margin + index * xStep;
          const y = height - margin - (value - 65) * yScale;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Dessiner les points
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dessiner les étiquettes des axes
        ctx.fillStyle = "#000";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";

        weightData.labels.forEach((label, index) => {
          const x = margin + index * xStep;
          ctx.fillText(label, x, height - margin + 20);
        });
      }
    }
  }, [patientId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Constantes vitales récentes</h3>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une mesure
        </Button>
      </div>

      <Tabs defaultValue="bp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bp">Pression artérielle</TabsTrigger>
          <TabsTrigger value="weight">Poids</TabsTrigger>
          <TabsTrigger value="other">Autres constantes</TabsTrigger>
        </TabsList>

        <TabsContent value="bp" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="w-full h-[300px] flex items-center justify-center">
                <canvas
                  ref={bpCanvasRef}
                  width={600}
                  height={300}
                  className="max-w-full"
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      Dernière mesure
                    </div>
                    <div className="text-lg font-medium">160/95 mmHg</div>
                    <div className="text-xs text-muted-foreground">
                      05/04/2023
                    </div>
                  </div>
                  <div className="p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      Moyenne (3 mois)
                    </div>
                    <div className="text-lg font-medium">155/90 mmHg</div>
                  </div>
                  <div className="p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">Cible</div>
                    <div className="text-lg font-medium">140/90 mmHg</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weight" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="w-full h-[300px] flex items-center justify-center">
                <canvas
                  ref={weightCanvasRef}
                  width={600}
                  height={300}
                  className="max-w-full"
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      Dernière mesure
                    </div>
                    <div className="text-lg font-medium">69.5 kg</div>
                    <div className="text-xs text-muted-foreground">
                      05/04/2023
                    </div>
                  </div>
                  <div className="p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      Variation (6 mois)
                    </div>
                    <div className="text-lg font-medium">-2.5 kg</div>
                  </div>
                  <div className="p-3 border rounded-md">
                    <div className="text-sm text-muted-foreground">IMC</div>
                    <div className="text-lg font-medium">24.2 kg/m²</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Température
                  </div>
                  <div className="text-xl font-medium">36.8 °C</div>
                  <div className="text-xs text-muted-foreground">
                    05/04/2023
                  </div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Fréquence cardiaque
                  </div>
                  <div className="text-xl font-medium">78 bpm</div>
                  <div className="text-xs text-muted-foreground">
                    05/04/2023
                  </div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Saturation O₂
                  </div>
                  <div className="text-xl font-medium">97 %</div>
                  <div className="text-xs text-muted-foreground">
                    05/04/2023
                  </div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Glycémie à jeun
                  </div>
                  <div className="text-xl font-medium">5.8 mmol/L</div>
                  <div className="text-xs text-muted-foreground">
                    01/03/2023
                  </div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Fréquence respiratoire
                  </div>
                  <div className="text-xl font-medium">16 /min</div>
                  <div className="text-xs text-muted-foreground">
                    05/04/2023
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
