"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportPatientDataProps {
  patientId: string;
}

export function ExportPatientData({ patientId }: ExportPatientDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | null>(null);

  const handleExport = async (format: "pdf" | "csv") => {
    setExportFormat(format);
    setIsExporting(true);

    try {
      const response = await fetch(
        `/api/patients/${patientId}/export?format=${format}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de l'export: ${response.statusText}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Set the file name
      const fileName =
        format === "pdf"
          ? `patient_${patientId}_data.pdf`
          : `patient_${patientId}_data.csv`;
      a.download = fileName;

      // Append to the document
      document.body.appendChild(a);

      // Trigger the download
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        `Données exportées avec succès au format ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        `Erreur lors de l'export: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exporter les données
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isExporting}
          className="cursor-pointer"
        >
          {isExporting && exportFormat === "pdf" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          <span>Exporter en PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={isExporting}
          className="cursor-pointer"
        >
          {isExporting && exportFormat === "csv" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          <span>Exporter en CSV</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
