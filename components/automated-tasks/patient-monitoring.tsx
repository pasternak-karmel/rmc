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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { usePatient } from "@/hooks/patient/use-patient";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  Clock,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PatientMonitoringProps {
  patientId: string;
}

export function PatientMonitoring({ patientId }: PatientMonitoringProps) {
  const { data: patient } = usePatient(patientId);

  const [monitoringSettings, setMonitoringSettings] = useState({
    statusChanges: true,
    labResults: true,
    medicationReminders: true,
    appointmentReminders: true,
    criticalAlerts: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggleMonitoring = (setting: keyof typeof monitoringSettings) => {
    setMonitoringSettings({
      ...monitoringSettings,
      [setting]: !monitoringSettings[setting],
    });
    setHasChanges(true);

    toast.success(
      `Surveillance ${monitoringSettings[setting] ? "désactivée" : "activée"} pour ${getSettingLabel(setting)}`
    );
  };

  // Save monitoring settings to the server
  const saveMonitoringSettings = async () => {
    try {
      setIsSaving(true);

      // In a real implementation, this would save to the server
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      toast.success("Paramètres de surveillance enregistrés");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving monitoring settings:", error);
      toast.error("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingLabel = (
    setting: keyof typeof monitoringSettings
  ): string => {
    switch (setting) {
      case "statusChanges":
        return "les changements d'état";
      case "labResults":
        return "les résultats d'analyses";
      case "medicationReminders":
        return "les rappels de médicaments";
      case "appointmentReminders":
        return "les rappels de rendez-vous";
      case "criticalAlerts":
        return "les alertes critiques";
    }
  };

  // Calculate monitoring health score (0-100)
  const calculateHealthScore = (): number => {
    if (!patient) return 0;

    let score = 50; // Base score

    // Adjust based on patient status
    if (patient.medicalInfo.status === "critical") score -= 30;
    if (patient.medicalInfo.status === "worsening") score -= 15;
    if (patient.medicalInfo.status === "improving") score += 15;
    if (patient.medicalInfo.status === "stable") score += 10;

    // Adjust based on DFG
    if (patient.medicalInfo.dfg < 15) score -= 20;
    else if (patient.medicalInfo.dfg < 30) score -= 10;
    else if (patient.medicalInfo.dfg > 60) score += 10;

    // Adjust based on proteinurie
    if (patient.medicalInfo.proteinurie > 3) score -= 15;
    else if (patient.medicalInfo.proteinurie < 0.5) score += 5;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();

  const getHealthScoreColor = (score: number): string => {
    if (score < 30) return "bg-red-500";
    if (score < 60) return "bg-amber-500";
    return "bg-green-500";
  };

  if (!patient) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Surveillance du patient</CardTitle>
        <CardDescription>
          Paramètres de surveillance et alertes pour {patient.firstname}{" "}
          {patient.lastname}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Score de santé</span>
            <span className="text-sm font-medium">{healthScore}%</span>
          </div>
          <Progress
            value={healthScore}
            className={getHealthScoreColor(healthScore)}
          />
          <p className="text-xs text-muted-foreground">
            Score basé sur l&apos;état actuel du patient, les résultats
            d&apos;analyses et l&apos;historique médical
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Paramètres de surveillance</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Changements d&apos;état</span>
            </div>
            <Switch
              checked={monitoringSettings.statusChanges}
              onCheckedChange={() => handleToggleMonitoring("statusChanges")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Résultats d&apos;analyses</span>
            </div>
            <Switch
              checked={monitoringSettings.labResults}
              onCheckedChange={() => handleToggleMonitoring("labResults")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Rappels de médicaments</span>
            </div>
            <Switch
              checked={monitoringSettings.medicationReminders}
              onCheckedChange={() =>
                handleToggleMonitoring("medicationReminders")
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Rappels de rendez-vous</span>
            </div>
            <Switch
              checked={monitoringSettings.appointmentReminders}
              onCheckedChange={() =>
                handleToggleMonitoring("appointmentReminders")
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Alertes critiques</span>
            </div>
            <Switch
              checked={monitoringSettings.criticalAlerts}
              onCheckedChange={() => handleToggleMonitoring("criticalAlerts")}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={saveMonitoringSettings}
          disabled={!hasChanges || isSaving}
        >
          <Check className="mr-2 h-4 w-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer les paramètres"}
        </Button>
      </CardFooter>
    </Card>
  );
}
