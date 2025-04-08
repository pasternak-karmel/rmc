"use client";
import { usePatient } from "@/hooks/patient/use-patient";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NotificationRulesEngineProps {
  patientId: string;
}

export function NotificationRulesEngine({
  patientId,
}: NotificationRulesEngineProps) {
  const { data: patient } = usePatient(patientId);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedRules, setProcessedRules] = useState<Record<string, boolean>>(
    {}
  );

  const sendNotification = async (notificationData: {
    patientId: string;
    title: string;
    message: string;
    type: string;
    category: string;
    priority: "low" | "normal" | "high" | "urgent";
    actionRequired?: boolean;
    actionType?: string;
    actionUrl?: string;
  }) => {
    try {
      setIsProcessing(true);
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Notification API error:", errorData);
        throw new Error(
          `Failed to send notification: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Échec de l'envoi de la notification");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!patient || isProcessing || !lastChecked) return;

    const checkRules = async () => {
      try {
        const ruleChecks = [];

        if (
          (patient.medicalInfo.status === "critical" ||
            patient.medicalInfo.status === "worsening") &&
          !processedRules[`status_${patient.medicalInfo.status}`]
        ) {
          ruleChecks.push(
            sendNotification({
              patientId,
              title: "Changement d'état du patient",
              message: `L'état de ${patient.firstname} ${patient.lastname} est maintenant ${
                patient.medicalInfo.status === "critical"
                  ? "critique"
                  : "en détérioration"
              }. Une attention particulière est requise.`,
              type:
                patient.medicalInfo.status === "critical"
                  ? "critical"
                  : "warning",
              category: "patient_status",
              priority:
                patient.medicalInfo.status === "critical" ? "urgent" : "high",
              actionRequired: true,
              actionType: "view",
              actionUrl: `/patients/${patientId}`,
            }).then(() => {
              setProcessedRules((prev) => ({
                ...prev,
                [`status_${patient.medicalInfo.status}`]: true,
              }));
            })
          );
        }

        if (
          patient.medicalInfo.previousDfg &&
          patient.medicalInfo.dfg < patient.medicalInfo.previousDfg * 0.9 &&
          !processedRules[`dfg_decrease_${patient.medicalInfo.dfg}`]
        ) {
          ruleChecks.push(
            sendNotification({
              patientId,
              title: "Baisse significative du DFG",
              message: `Le DFG de ${patient.firstname} ${patient.lastname} a diminué de plus de 10% (${patient.medicalInfo.previousDfg} → ${patient.medicalInfo.dfg}).`,
              type: "warning",
              category: "lab_results",
              priority: "high",
              actionRequired: true,
              actionType: "view",
              actionUrl: `/patients/${patientId}/analyse`,
            }).then(() => {
              setProcessedRules((prev) => ({
                ...prev,
                [`dfg_decrease_${patient.medicalInfo.dfg}`]: true,
              }));
            })
          );
        }

        if (
          patient.medicalInfo.previousProteinurie &&
          patient.medicalInfo.proteinurie >
            patient.medicalInfo.previousProteinurie * 1.5 &&
          patient.medicalInfo.proteinurie > 1 &&
          !processedRules[
            `proteinurie_increase_${patient.medicalInfo.proteinurie}`
          ]
        ) {
          ruleChecks.push(
            sendNotification({
              patientId,
              title: "Augmentation de la protéinurie",
              message: `La protéinurie de ${patient.firstname} ${patient.lastname} a augmenté significativement (${patient.medicalInfo.previousProteinurie} → ${patient.medicalInfo.proteinurie}).`,
              type: "warning",
              category: "lab_results",
              priority: "high",
              actionRequired: true,
              actionType: "view",
              actionUrl: `/patients/${patientId}/analyse`,
            }).then(() => {
              setProcessedRules((prev) => ({
                ...prev,
                [`proteinurie_increase_${patient.medicalInfo.proteinurie}`]:
                  true,
              }));
            })
          );
        }

        if (ruleChecks.length > 0) {
          await Promise.allSettled(ruleChecks);
        }
      } catch (error) {
        console.error("Error processing notification rules:", error);
      }
    };

    checkRules();
    setLastChecked(new Date());
  }, [patient, lastChecked, patientId, isProcessing, processedRules]);

  useEffect(() => {
    setLastChecked(new Date());
    return () => {
      setIsProcessing(false);
    };
  }, []);

  return null;
}
