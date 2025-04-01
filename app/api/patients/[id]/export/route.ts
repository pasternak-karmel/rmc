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

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const rateLimitResult = await rateLimit(req, {
      limit: 10,
      window: 60,
    });

    if (rateLimitResult) return rateLimitResult;

    await getAuthenticatedUser(req);

    const params = await segmentData.params;
    const format = req.nextUrl.searchParams.get("format") || "pdf";

    // Get patient data
    const patient = await PatientService.getPatientById(params.id);

    // Get medical history
    const medicalHistory = await MedicalHistoryService.getMedicalHistory(
      params.id,
      {
        limit: 100,
        sortOrder: "desc",
      }
    );

    // Get lab results
    const labResults = await LabResultsService.getLabResults(params.id, {
      limit: 100,
      sortOrder: "desc",
    });

    // Get vital signs
    const vitalSigns = await VitalSignsService.getVitalSigns(params.id, {
      limit: 100,
      sortOrder: "desc",
    });

    // Get treatments
    const treatments = await TreatmentService.getTreatments(params.id, {
      limit: 100,
      sortOrder: "desc",
    });

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  treatments: any[]
) {
  let csv = "DONNÉES DU PATIENT\n";
  csv += `ID,Prénom,Nom,Date de naissance,Sexe,Email,Téléphone,Adresse\n`;
  csv += `${patient.id},${patient.firstname},${patient.lastname},${patient.birthdate},${patient.sex},${patient.email},${patient.phone},"${patient.address}"\n\n`;

  csv += "INFORMATIONS MÉDICALES\n";
  csv += `Stade MRC,Statut,DFG,Protéinurie,Médecin référent,Dernière visite,Prochain rendez-vous\n`;
  csv += `${patient.medicalInfo.stade},${patient.medicalInfo.status},${
    patient.medicalInfo.dfg
  },${patient.medicalInfo.proteinurie},${
    patient.medicalInfo.medecin
  },${new Date(patient.medicalInfo.lastvisite).toLocaleDateString()},${new Date(
    patient.medicalInfo.nextvisite
  ).toLocaleDateString()}\n\n`;

  csv += "HISTORIQUE MÉDICAL\n";
  csv += `Date,Type,Titre,Description,Médecin\n`;
  medicalHistory.forEach((record) => {
    csv += `${new Date(record.date).toLocaleDateString()},${record.type},"${
      record.title
    }","${record.description.replace(/"/g, '""')}",${record.medecin}\n`;
  });
  csv += "\n";

  csv += "RÉSULTATS D'ANALYSES\n";
  csv += `Date,Laboratoire,Notes\n`;
  labResults.forEach((result) => {
    csv += `${new Date(result.date).toLocaleDateString()},${
      result.labName || ""
    },${result.notes || ""}\n`;

    const parsedResults = JSON.parse(result.results);
    csv += `Paramètre,Valeur,Unité,Référence Min,Référence Max,Anormal\n`;
    parsedResults.forEach((r: any) => {
      csv += `${r.name},${r.value},${r.unit},${r.referenceMin || ""},${
        r.referenceMax || ""
      },${r.isAbnormal ? "Oui" : "Non"}\n`;
    });
    csv += "\n";
  });

  csv += "CONSTANTES VITALES\n";
  csv += `Date,Notes\n`;
  vitalSigns.forEach((sign) => {
    csv += `${new Date(sign.date).toLocaleDateString()},${sign.notes || ""}\n`;

    const parsedMeasurements = JSON.parse(sign.measurements);
    csv += `Type,Valeur,Unité\n`;
    parsedMeasurements.forEach((m: any) => {
      csv += `${m.type},${m.value},${m.unit}\n`;
    });
    csv += "\n";
  });

  csv += "TRAITEMENTS\n";
  csv += `Médicament,Catégorie,Posologie,Fréquence,Date de début,Date de fin,Statut,Médecin,Notes,Interactions\n`;
  // treatments.data.forEach((treatment) => {
  //   csv += `${treatment.medicament},${treatment.category},${
  //     treatment.posologie
  //   },${treatment.frequence},${new Date(treatment.date).toLocaleDateString()},${
  //     treatment.endDate ? new Date(treatment.endDate).toLocaleDateString() : ""
  //   },${treatment.status},${treatment.medecin},${treatment.notes || ""},${
  //     treatment.interactions ? "Oui" : "Non"
  //   }\n`;
  // });

  return csv;
}

// Function to generate PDF
async function generatePDF(
  patient: any,
  medicalHistory: any[],
  labResults: any[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  vitalSigns: any[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  treatments: any[]
) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      // Collect PDF data chunks
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Add patient information
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
      doc.moveDown();

      // Add medical history
      doc.addPage();
      doc.fontSize(16).text("Historique médical", { align: "center" });
      doc.moveDown();

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
            .lineTo(50, doc.y)
            .lineTo(doc.page.width - 50, doc.y)
            .stroke();
        }
      });

      // Add lab results
      doc.addPage();
      doc.fontSize(16).text("Résultats d'analyses", { align: "center" });
      doc.moveDown();

      labResults.forEach((result, index) => {
        if (index > 0) doc.moveDown(0.5);
        doc
          .fontSize(12)
          .text(`Date: ${new Date(result.date).toLocaleDateString()}`);
        if (result.labName) doc.text(`Laboratoire: ${result.labName}`);
        if (result.notes) doc.text(`Notes: ${result.notes}`);
        doc.moveDown(0.5);

        // Parse results JSON
        const parsedResults = JSON.parse(result.results);

        // Create a table for results
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [120, 80, 80, 80, 80];
        const rowHeight = 20;

        // Draw table header
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
          tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          tableTop
        );

        // Draw table rows
        doc.font("Helvetica");
        parsedResults.forEach((r: any, i: number) => {
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
            .lineTo(50, doc.y)
            .lineTo(doc.page.width - 50, doc.y)
            .stroke();
        }
      });

      // Add treatments
      doc.addPage();
      doc.fontSize(16).text("Traitements", { align: "center" });
      doc.moveDown();

      // treatments.data.forEach((treatment, index) => {
      //   if (index > 0) doc.moveDown(0.5);
      //   doc
      //     .fontSize(12)
      //     .text(`Médicament: ${treatment.medicament} (${treatment.category})`);
      //   doc.text(`Posologie: ${treatment.posologie}`);
      //   doc.text(`Fréquence: ${treatment.frequence}`);
      //   doc.text(
      //     `Date de début: ${new Date(treatment.date).toLocaleDateString()}`
      //   );
      //   if (treatment.endDate)
      //     doc.text(
      //       `Date de fin: ${new Date(treatment.endDate).toLocaleDateString()}`
      //     );
      //   doc.text(`Statut: ${treatment.status}`);
      //   doc.text(`Médecin: ${treatment.medecin}`);
      //   if (treatment.notes) doc.text(`Notes: ${treatment.notes}`);
      //   if (treatment.interactions)
      //     doc
      //       .text(`Interactions potentielles: Oui`, { continued: true })
      //       .fillColor("red")
      //       .text(" ⚠️");
      //   doc.fillColor("black");

      //   if (index < treatments.data.length - 1) {
      //     doc.moveDown(0.5);
      //     doc
      //       .lineTo(50, doc.y)
      //       .lineTo(doc.page.width - 50, doc.y)
      //       .stroke();
      //   }
      // });

      // Add footer with date
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        // Add page number
        doc
          .fontSize(8)
          .text(`Page ${i + 1} sur ${pages.count}`, 50, doc.page.height - 50, {
            align: "center",
          });

        // Add generation date
        doc
          .fontSize(8)
          .text(
            `Document généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}`,
            50,
            doc.page.height - 40,
            { align: "center" }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
