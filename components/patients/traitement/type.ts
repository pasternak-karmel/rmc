import { z } from "zod";

const categoryTraitementEnum = z.enum([
  "antihypertenseur",
  "antiparkinsonien",
  "antipsychotique",
  "antithrombotique",
  "antiviral",
  "cardiologique",
  "chélateur du phosphore",
  "diurétique",
  "enzyme de conversion",
  "hépatite",
  "inhibiteur de l'enzyme de conversion",
  "médicament de réadaptation",
  "médicament de traitement de la maladie",
  "médicament de traitement des troubles du foie",
  "médicament du foie",
  "médicament du système nerveux",
  "parasitologique",
  "prévention des troubles du foie",
  "prévention du diabète",
  "prévention du cancer",
  "prévention du diarrhée",
  "prévention du pneumocoque",
  "prévention du syndrome de l'artère carotide",
  "prévention du syndrome de l'artère du petit doigt",
  "prévention du syndrome de l'artère du pouce",
  "prévention du syndrome du poumon",
  "protéine",
  "réadaptation",
  "régulation de la pression sanguine",
  "régulation du rythme cardiaque",
  "régulation du rythme respiratoire",
  "régulation du rythme systémique",
  "traitement des troubles du foie",
  "traitement du diabète",
  "traitement du cancer",
  "traitement du diarrhée",
  "traitement du pneumocoque",
  "traitement du syndrome de l'artère carotide",
  "traitement du syndrome de l'artère du petit doigt",
  "traitement du syndrome de l'artère du pouce",
  "traitement du syndrome du poumon",
  "traitement général",
]);

const frequenceTraitementEnum = z.enum([
  "1 fois par jour",
  "1 fois par semaine",
  "1 fois par mois",
]);

export const TraitementSchema = z.object({
  medicament: z.string().min(2, { message: "Le nom du médicament est requis" }),
  category: categoryTraitementEnum,
  posologie: z.string().min(2, { message: "La posologie est requise" }),
  frequence: frequenceTraitementEnum,
  startDate: z.string().min(1, { message: "La date de début est requise" }),
});

export type TraitementFormValues = z.infer<typeof TraitementSchema>;
