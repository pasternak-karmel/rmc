import { db } from "@/db";
import { tasks } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { CreateTaskInput } from "@/schemas/task";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export class TaskService {
  static async getTaskById(id: string) {
    const cacheKey = `task-${id}`;

    return withCache(cacheKey, async () => {
      const task = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);

      if (!task) {
        throw ApiError.notFound("Tâche non trouvée");
      }
      return task[0];
    });
  }

  static async createTask(data: CreateTaskInput) {
    const { title, priority, completed, dueDate, assignedTo, patientId } = data;
    const taskId = uuidv4();

    try {
      const medecin = await auth.api.getSession({
        headers: await headers(),
      });

      if (!medecin || !medecin.user) {
        throw ApiError.unauthorized(
          "Vous devez être connecté pour créer un workflow"
        );
      }

      await db.insert(tasks).values({
        id: taskId,
        title,
        priority,
        completed,
        dueDate: new Date(dueDate),
        assignedTo,
        patientId,
      });

      return this.getTaskById(taskId);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Erreur lors de la création du workflow");
    }
  }

  static async complete(id: string) {
    const now = new Date();

    try {
      const task = await this.getTaskById(id);

      if (task.completed) {
        return;
      }

      const medecin = await auth.api.getSession({
        headers: await headers(),
      });

      if (!medecin || !medecin.user) {
        throw ApiError.unauthorized(
          "Vous devez être connecté pour effectuer cette action"
        );
      }

      await db
        .update(tasks)
        .set({ completed: true, updatedAt: now })
        .where(eq(tasks.id, id));
      // await deleteCache(`task-${id}`);

      return this.getTaskById(id);
    } catch (error) {
      console.error("Erreur lors de la résolution:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Erreur lors de la résolution de l'alerte");
    }
  }
}
