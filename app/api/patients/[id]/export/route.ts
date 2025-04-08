/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleApiError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { LabResultsService } from "@/services/lab-results-service";
import { MedicalHistoryService } from "@/services/medical-history-service";
import { PatientService } from "@/services/patient-service";
import { TreatmentService } from "@/services/treatment-service";
import { VitalSignsService } from "@/services/vital-signs-service";
import type { NextRequest } from "next/server";
import PDFDocument from "pdfkit";

type Params = Promise<{ id: string }>;

interface LabResultItem {
  name: string;
  value: string | number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  isAbnormal: boolean;
}

interface VitalMeasurement {
  type: string;
  value: string | number;
  unit: string;
}

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 50,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    const format = req.nextUrl.searchParams.get("format") || "pdf";

    const params = await segmentData.params;

    const [patient, medicalHistory, labResults, vitalSigns, treatments] =
      await Promise.all([
        PatientService.getPatientById(params.id),
        MedicalHistoryService.getMedicalHistory(params.id, {
          limit: 100,
          sortOrder: "desc",
        }),
        LabResultsService.getLabResults(params.id, {
          limit: 100,
          sortOrder: "desc",
        }),
        VitalSignsService.getVitalSigns(params.id, {
          limit: 100,
          sortOrder: "desc",
        }),
        TreatmentService.getTreatments(params.id, {
          limit: 100,
          sortOrder: "desc",
        }),
      ]);

    if (format === "csv") {
      const csvData = generateCSV(
        patient,
        medicalHistory.data,
        labResults.data,
        vitalSigns.data,
        treatments.data
      );

      return new Response(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="patient_${params.id}_data.csv"`,
        },
      });
    } else {
      const pdfBuffer = await generatePDF(
        patient,
        medicalHistory.data,
        labResults.data,
        vitalSigns.data,
        treatments.data
      );

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="patient_${params.id}_data.pdf"`,
        },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

function generateCSV(
  patient: any,
  medicalHistory: any[],
  labResults: any[],
  vitalSigns: any[],
  treatments: any[]
): string {
  const escapeCsv = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes('"') || str.includes(",") || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const separator = ",";
  const lineBreak = "\n";
  const sectionSeparator = lineBreak + lineBreak;

  let csv = "";

  // 1. Informations patient
  csv += "INFORMATIONS PATIENT" + lineBreak;
  csv +=
    [
      "ID",
      "Prénom",
      "Nom",
      "Date de naissance",
      "Sexe",
      "Email",
      "Téléphone",
      "Adresse",
    ].join(separator) + lineBreak;
  csv +=
    [
      escapeCsv(patient.id),
      escapeCsv(patient.firstname),
      escapeCsv(patient.lastname),
      escapeCsv(patient.birthdate),
      escapeCsv(patient.sex === "M" ? "Homme" : "Femme"),
      escapeCsv(patient.email),
      escapeCsv(patient.phone),
      escapeCsv(patient.address),
    ].join(separator) + lineBreak;

  // 2. Informations médicales
  csv += sectionSeparator + "INFORMATIONS MÉDICALES" + lineBreak;
  csv +=
    [
      "Stade MRC",
      "Statut",
      "DFG (ml/min)",
      "Protéinurie (g/24h)",
      "Médecin référent",
      "Dernière visite",
      "Prochain rendez-vous",
    ].join(separator) + lineBreak;
  csv +=
    [
      escapeCsv(patient.medicalInfo.stade),
      escapeCsv(patient.medicalInfo.status),
      escapeCsv(patient.medicalInfo.dfg),
      escapeCsv(patient.medicalInfo.proteinurie),
      escapeCsv(patient.medicalInfo.medecin),
      escapeCsv(new Date(patient.medicalInfo.lastvisite).toLocaleDateString()),
      escapeCsv(new Date(patient.medicalInfo.nextvisite).toLocaleDateString()),
    ].join(separator) + lineBreak;

  // 3. Historique médical
  csv += sectionSeparator + "HISTORIQUE MÉDICAL" + lineBreak;
  if (medicalHistory.length > 0) {
    csv +=
      ["Date", "Type", "Titre", "Description", "Médecin"].join(separator) +
      lineBreak;
    medicalHistory.forEach((record) => {
      csv +=
        [
          escapeCsv(new Date(record.date).toLocaleDateString()),
          escapeCsv(record.type),
          escapeCsv(record.title),
          escapeCsv(record.description),
          escapeCsv(record.medecin),
        ].join(separator) + lineBreak;
    });
  } else {
    csv += "Aucun historique médical enregistré" + lineBreak;
  }

  // 4. Résultats d'analyses
  csv += sectionSeparator + "RÉSULTATS D'ANALYSES" + lineBreak;
  if (labResults.length > 0) {
    labResults.forEach((result, resultIndex) => {
      if (resultIndex > 0) csv += lineBreak;

      csv +=
        `Analyse du ${new Date(result.date).toLocaleDateString()}` + lineBreak;
      csv += ["Laboratoire", "Notes"].join(separator) + lineBreak;
      csv +=
        [
          escapeCsv(result.labName || "Non spécifié"),
          escapeCsv(result.notes || "Aucune note"),
        ].join(separator) +
        lineBreak +
        lineBreak;

      const parsedResults: LabResultItem[] =
        typeof result.results === "string"
          ? JSON.parse(result.results)
          : result.results;

      if (parsedResults.length > 0) {
        csv +=
          [
            "Paramètre",
            "Valeur",
            "Unité",
            "Valeurs de référence",
            "Statut",
          ].join(separator) + lineBreak;
        parsedResults.forEach((r) => {
          const referenceRange =
            r.referenceMin !== undefined && r.referenceMax !== undefined
              ? `${r.referenceMin} - ${r.referenceMax}`
              : "N/A";

          csv +=
            [
              escapeCsv(r.name),
              escapeCsv(r.value),
              escapeCsv(r.unit),
              escapeCsv(referenceRange),
              escapeCsv(r.isAbnormal ? "HORS NORME" : "Normal"),
            ].join(separator) + lineBreak;
        });
      } else {
        csv += "Aucun résultat d'analyse disponible" + lineBreak;
      }
    });
  } else {
    csv += "Aucun résultat d'analyse enregistré" + lineBreak;
  }

  // 5. Constantes vitales
  csv += sectionSeparator + "CONSTANTES VITALES" + lineBreak;
  if (vitalSigns.length > 0) {
    vitalSigns.forEach((sign, signIndex) => {
      if (signIndex > 0) csv += lineBreak;

      csv +=
        `Mesures du ${new Date(sign.date).toLocaleDateString()}` + lineBreak;
      csv += ["Notes"].join(separator) + lineBreak;
      csv += escapeCsv(sign.notes || "Aucune note") + lineBreak + lineBreak;

      const parsedMeasurements: VitalMeasurement[] =
        typeof sign.measurements === "string"
          ? JSON.parse(sign.measurements)
          : sign.measurements;

      if (parsedMeasurements.length > 0) {
        csv += ["Type", "Valeur", "Unité"].join(separator) + lineBreak;
        parsedMeasurements.forEach((m) => {
          csv +=
            [escapeCsv(m.type), escapeCsv(m.value), escapeCsv(m.unit)].join(
              separator
            ) + lineBreak;
        });
      } else {
        csv += "Aucune mesure disponible" + lineBreak;
      }
    });
  } else {
    csv += "Aucune constante vitale enregistrée" + lineBreak;
  }

  // 6. Traitements
  csv += sectionSeparator + "TRAITEMENTS" + lineBreak;
  if (treatments.length > 0) {
    csv +=
      [
        "Médicament",
        "Catégorie",
        "Posologie",
        "Fréquence",
        "Date de début",
        "Date de fin",
        "Statut",
        "Médecin",
        "Notes",
        "Interactions",
      ].join(separator) + lineBreak;

    treatments.forEach((treatment) => {
      csv +=
        [
          escapeCsv(treatment.medicament),
          escapeCsv(treatment.category),
          escapeCsv(treatment.posologie),
          escapeCsv(treatment.frequence),
          escapeCsv(new Date(treatment.date).toLocaleDateString()),
          escapeCsv(
            treatment.endDate
              ? new Date(treatment.endDate).toLocaleDateString()
              : "En cours"
          ),
          escapeCsv(treatment.status),
          escapeCsv(treatment.medecin),
          escapeCsv(treatment.notes || "Aucune note"),
          escapeCsv(treatment.interactions ? "OUI ⚠️" : "Non"),
        ].join(separator) + lineBreak;
    });
  } else {
    csv += "Aucun traitement enregistré" + lineBreak;
  }

  return csv;
}

async function generatePDF(
  patient: any,
  medicalHistory: any[],
  labResults: any[],
  vitalSigns: any[],
  treatments: any[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const addSection = (title: string, content: () => void) => {
        doc.addPage();
        doc.fontSize(16).text(title, { align: "center" });
        doc.moveDown();
        content();
      };

      doc.fontSize(20).text("Dossier Patient", { align: "center" });
      doc.moveDown();

      doc.fontSize(16).text("Informations personnelles");
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Nom: ${patient.lastname} ${patient.firstname}`);
      doc.text(
        `Date de naissance: ${patient.birthdate} (${
          patient.sex === "M" ? "Homme" : "Femme"
        })`
      );
      doc.text(`Email: ${patient.email}`);
      doc.text(`Téléphone: ${patient.phone}`);
      doc.text(`Adresse: ${patient.address}`);
      doc.moveDown();

      doc.fontSize(16).text("Informations médicales");
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Stade MRC: ${patient.medicalInfo.stade}`);
      doc.text(`Statut: ${patient.medicalInfo.status}`);
      doc.text(`DFG: ${patient.medicalInfo.dfg} ml/min`);
      doc.text(`Protéinurie: ${patient.medicalInfo.proteinurie} g/24h`);
      doc.text(`Médecin référent: ${patient.medicalInfo.medecin}`);
      doc.text(
        `Dernière visite: ${new Date(
          patient.medicalInfo.lastvisite
        ).toLocaleDateString()}`
      );
      doc.text(
        `Prochain rendez-vous: ${new Date(
          patient.medicalInfo.nextvisite
        ).toLocaleDateString()}`
      );

      addSection("Historique médical", () => {
        medicalHistory.forEach((record, index) => {
          if (index > 0) doc.moveDown(0.5);
          doc
            .fontSize(12)
            .text(`Date: ${new Date(record.date).toLocaleDateString()}`);
          doc.text(`Type: ${record.type}`);
          doc.text(`Titre: ${record.title}`);
          doc.text(`Description: ${record.description}`);
          doc.text(`Médecin: ${record.medecin}`);

          if (index < medicalHistory.length - 1) {
            doc.moveDown(0.5);
            doc
              .moveTo(50, doc.y)
              .lineTo(doc.page.width - 50, doc.y)
              .stroke();
          }
        });
      });

      addSection("Résultats d'analyses", () => {
        labResults.forEach((result, index) => {
          if (index > 0) doc.moveDown(0.5);
          doc
            .fontSize(12)
            .text(`Date: ${new Date(result.date).toLocaleDateString()}`);
          if (result.labName) doc.text(`Laboratoire: ${result.labName}`);
          if (result.notes) doc.text(`Notes: ${result.notes}`);
          doc.moveDown(0.5);

          const parsedResults: LabResultItem[] =
            typeof result.results === "string"
              ? JSON.parse(result.results)
              : result.results;

          const tableTop = doc.y;
          const tableLeft = 50;
          const colWidths = [120, 80, 80, 80, 80];
          const rowHeight = 20;

          doc.font("Helvetica-Bold");
          doc.text("Paramètre", tableLeft, tableTop);
          doc.text("Valeur", tableLeft + colWidths[0], tableTop);
          doc.text("Unité", tableLeft + colWidths[0] + colWidths[1], tableTop);
          doc.text(
            "Référence",
            tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
            tableTop
          );
          doc.text(
            "Anormal",
            tableLeft +
              colWidths[0] +
              colWidths[1] +
              colWidths[2] +
              colWidths[3],
            tableTop
          );

          doc.font("Helvetica");
          parsedResults.forEach((r, i) => {
            const rowY = tableTop + rowHeight + i * rowHeight;
            doc.text(r.name, tableLeft, rowY);
            doc.text(r.value.toString(), tableLeft + colWidths[0], rowY);
            doc.text(r.unit, tableLeft + colWidths[0] + colWidths[1], rowY);

            const refRange =
              r.referenceMin !== undefined && r.referenceMax !== undefined
                ? `${r.referenceMin} - ${r.referenceMax}`
                : "";
            doc.text(
              refRange,
              tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
              rowY
            );

            doc.text(
              r.isAbnormal ? "Oui" : "Non",
              tableLeft +
                colWidths[0] +
                colWidths[1] +
                colWidths[2] +
                colWidths[3],
              rowY
            );
          });

          doc.y = tableTop + rowHeight + parsedResults.length * rowHeight + 10;

          if (index < labResults.length - 1) {
            doc.moveDown(0.5);
            doc
              .moveTo(50, doc.y)
              .lineTo(doc.page.width - 50, doc.y)
              .stroke();
          }
        });
      });

      addSection("Traitements", () => {
        treatments.forEach((treatment, index) => {
          if (index > 0) doc.moveDown(0.5);
          doc
            .fontSize(12)
            .text(
              `Médicament: ${treatment.medicament} (${treatment.category})`
            );
          doc.text(`Posologie: ${treatment.posologie}`);
          doc.text(`Fréquence: ${treatment.frequence}`);
          doc.text(
            `Date de début: ${new Date(treatment.date).toLocaleDateString()}`
          );
          if (treatment.endDate)
            doc.text(
              `Date de fin: ${new Date(treatment.endDate).toLocaleDateString()}`
            );
          doc.text(`Statut: ${treatment.status}`);
          doc.text(`Médecin: ${treatment.medecin}`);
          if (treatment.notes) doc.text(`Notes: ${treatment.notes}`);
          if (treatment.interactions)
            doc
              .text(`Interactions potentielles: Oui`, { continued: true })
              .fillColor("red")
              .text(" ⚠️");
          doc.fillColor("black");

          if (index < treatments.length - 1) {
            doc.moveDown(0.5);
            doc
              .moveTo(50, doc.y)
              .lineTo(doc.page.width - 50, doc.y)
              .stroke();
          }
        });
      });

      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        doc
          .fontSize(8)
          .text(
            `Page ${i + 1} sur ${pages.count} • Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
            50,
            doc.page.height - 30,
            { width: doc.page.width - 100, align: "center" }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
