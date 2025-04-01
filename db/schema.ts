import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const patient = pgTable("patient", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  firstname: text("firstname").notNull(),
  lastname: text("lastname").notNull(),
  birthdate: text("birthdate").notNull(),
  email: text("email").notNull(),
  sex: text("sex").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const infoMedical = pgTable("information_medical", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  stade: integer("stade").notNull().default(1),
  status: text("status").notNull().default("stable"),
  medecin: text("medecin").notNull(),
  dfg: integer("dfg").notNull().default(0),
  previousDfg: integer("previous_dfg").notNull().default(0),
  proteinurie: integer("proteinurie").notNull().default(0),
  previousProteinurie: integer("previous_proteinurie").notNull().default(0),
  lastvisite: timestamp("last_visit", { withTimezone: true }).notNull(),
  nextvisite: timestamp("next_visit", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const historique = pgTable("historique", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  isResolved: boolean("isResolved").$default(() => false),
  description: text("description").notNull(),
  type: text("type").notNull(),
  medecin: text("medecin")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const patientTraitement = pgTable("patient_traitement", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  medicament: text("medicament").notNull(),
  category: text("category").notNull(),
  posologie: text("posologie").notNull(),
  frequence: text("frequence").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  medecin: text("medecin")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  interactions: boolean("interactions").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// New tables for lab results and vital signs
export const labResults = pgTable("lab_results", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  results: json("results").notNull(),
  labName: text("lab_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const vitalSigns = pgTable("vital_signs", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  measurements: json("measurements").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").references(() => patient.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'info', 'warning', 'critical'
  read: boolean("read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
