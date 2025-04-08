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
  medecin: text("medecin")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
  alertType: text("alertType"),
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
  status: text("status").notNull().default("active"), //discontinued
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
export const Notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").references(() => patient.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("pending"),
  read: boolean("read").default(false),
  actionRequired: boolean("action_required").default(false),
  actionType: text("action_type"),
  actionUrl: text("action_url"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workflow = pgTable("workflow", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workflowPatient = pgTable("workflow_patient", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  priority: text("priority").notNull(),
  completed: boolean("completed").default(false),
  assignedTo: text("assigned_to").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // 'patient_status', 'appointment', 'lab_result', 'medication', 'vital_sign', 'administrative'
  enabled: boolean("enabled").notNull().default(true),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  minPriority: text("min_priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  duration: integer("duration").notNull().default(30), // in minutes
  location: text("location"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'
  type: text("type").notNull().default("in_person"), // 'in_person', 'virtual', 'phone'
  reminderSent: boolean("reminder_sent").default(false),
  confirmationSent: boolean("confirmation_sent").default(false),
  confirmationStatus: text("confirmation_status").default("pending"), // 'pending', 'confirmed', 'declined'
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Reports table
export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
  doctorId: text("doctor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'medical_summary', 'lab_results', 'treatment_plan', 'progress_note', etc.
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'finalized', 'sent', 'archived'
  sentToPatient: boolean("sent_to_patient").default(false),
  sentDate: timestamp("sent_date", { withTimezone: true }),
  generatedAutomatically: boolean("generated_automatically").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Scheduled tasks table
export const scheduledTasks = pgTable("scheduled_tasks", {
  id: uuid("id").defaultRandom().primaryKey().$defaultFn(createId),
  type: text("type").notNull(), // 'appointment_reminder', 'report_generation', 'medication_reminder', etc.
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  data: json("data").notNull(), // Task-specific data
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  result: json("result"), // Result of the task execution
  error: text("error"), // Error message if the task failed
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
