import { db } from "@/db";
import { historique, infoMedical, patient } from "@/db/schema";
import { ApiError } from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { deleteCache, withCache } from "@/lib/cache";
import { headers } from "next/headers";
import { and, asc, desc, eq, ilike, inArray, like, or, sql } from "drizzle-orm";

export class AlertService {
  static async getAlertById(id: string) {
    const cacheKey = `alerts:${id}`;

    return withCache(cacheKey, async () => {
      const [result] = await db
        .select()
        .from(historique)
        .where(eq(historique.id, id));

      if (!result) {
        throw ApiError.notFound(`Alert with ID ${id} not found`);
      }

      return result;
    });
  }

  static async resolve(id: string) {
    const now = new Date();

    try {
      const alert = await this.getAlertById(id);

      if (alert.isResolved) {
        return;
      }

      const user = await auth.api.getSession({
        headers: await headers(),
      });

      if (!user || !user.user) {
        throw ApiError.unauthorized(
          "Vous devez être connecté pour effectuer cette action"
        );
      }

      await db.transaction(async (tx) => {
        await tx
          .update(historique)
          .set({ isResolved: true, updatedAt: now })
          .where(eq(historique.id, id));
      });

      return this.getAlertById(id);
    } catch (error) {
      console.error("Erreur lors de la résolution:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internalServer("Erreur lors de la résolution de l'alerte");
    }
  }
}
