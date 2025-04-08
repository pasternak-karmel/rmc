"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePatient } from "@/hooks/patient/use-patient";
import { FileText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReportGeneratorProps {
  patientId: string;
}

export function ReportGenerator({ patientId }: ReportGeneratorProps) {
  const { data: patient } = usePatient(patientId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportData, setReportData] = useState({
    type: "medical_summary",
    title: "",
    content: "",
    sendToPatient: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: "medical_summary", label: "Résumé médical" },
    { value: "lab_results", label: "Résultats d'analyses" },
    { value: "treatment_plan", label: "Plan de traitement" },
    { value: "progress_note", label: "Note de suivi" },
  ];

  const handleGenerateReport = async () => {
    try {
      if (!reportData.type) {
        toast.error("Veuillez sélectionner un type de rapport");
        return;
      }

      setIsGenerating(true);
      toast.loading("Génération du rapport en cours...");

      // Call the API to generate a report
      const response = await fetch(
        `/api/patients/${patientId}/reports/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: reportData.type,
          }),
        }
      );

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error generating report:", errorData);
        throw new Error(errorData.error || "Failed to generate report");
      }

      const data = await response.json();

      // Update the form with the generated report
      setReportData({
        ...reportData,
        title:
          data.title ||
          `${getReportTypeLabel(reportData.type)} - ${patient?.firstname} ${patient?.lastname}`,
        content: data.content || "",
      });

      toast.success("Rapport généré avec succès");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la génération du rapport"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      if (!reportData.type || !reportData.content) {
        toast.error("Le type et le contenu du rapport sont requis");
        return;
      }

      toast.loading("Création du rapport en cours...");

      const response = await fetch(`/api/patients/${patientId}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          title:
            reportData.title ||
            `${getReportTypeLabel(reportData.type)} - ${patient?.firstname} ${patient?.lastname}`,
          type: reportData.type,
          content: reportData.content,
          status: "finalized",
          sendToPatient: reportData.sendToPatient,
        }),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error creating report:", errorData);
        throw new Error(errorData.error || "Failed to create report");
      }

      toast.success("Rapport créé avec succès");
      setIsDialogOpen(false);

      // Reset form
      setReportData({
        type: "medical_summary",
        title: "",
        content: "",
        sendToPatient: false,
      });
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du rapport"
      );
    }
  };

  // Helper function to get report type label
  const getReportTypeLabel = (type: string): string => {
    const reportType = reportTypes.find((t) => t.value === type);
    return reportType ? reportType.label : "Rapport";
  };

  if (!patient) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Génération de rapports</CardTitle>
        <CardDescription>
          Générez automatiquement des rapports médicaux pour {patient.firstname}{" "}
          {patient.lastname}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Générez rapidement différents types de rapports médicaux basés sur les
          données du patient. Les rapports peuvent être personnalisés avant
          d&apos;être finalisés.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {reportTypes.map((type) => (
            <Card key={type.value} className="border border-muted">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">{type.label}</CardTitle>
              </CardHeader>
              <CardFooter className="p-3 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setReportData({
                      ...reportData,
                      type: type.value,
                      title: `${type.label} - ${patient.firstname} ${patient.lastname}`,
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Générer
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Générer un rapport</DialogTitle>
            <DialogDescription>
              Créez un rapport pour {patient.firstname} {patient.lastname}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Type de rapport</Label>
              <Select
                value={reportData.type}
                onValueChange={(value) =>
                  setReportData({ ...reportData, type: value })
                }
              >
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="reportContent">Contenu du rapport</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Génération..." : "Générer automatiquement"}
                </Button>
              </div>
              <Textarea
                id="reportContent"
                value={reportData.content}
                onChange={(e) =>
                  setReportData({ ...reportData, content: e.target.value })
                }
                placeholder="Le contenu du rapport sera généré automatiquement ou peut être saisi manuellement"
                className="min-h-[300px] font-mono"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sendToPatient"
                checked={reportData.sendToPatient}
                onCheckedChange={(checked) =>
                  setReportData({ ...reportData, sendToPatient: checked })
                }
              />
              <Label htmlFor="sendToPatient">Envoyer au patient</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateReport}>
              <Send className="mr-2 h-4 w-4" />
              Créer le rapport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
