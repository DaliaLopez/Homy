import type { ItemStatus, Verification } from "@/types/verification";

export type CategoryDecision = {
  categoryId: string;
  name: string;
  status: ItemStatus;
  reasons: string[];
  comment: string | null;
  reviewedAt: string | null;
};

/**
 * Último estado de cada categoría que el trabajador ha enviado: si la pidió varias veces
 * (por ejemplo, la rechazaron y volvió a enviar evidencia), cuenta la solicitud más reciente.
 */
export function latestCategoryDecisions(verifications: Verification[]): CategoryDecision[] {
  const byCategory = new Map<string, CategoryDecision>();
  const oldestFirst = [...verifications].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  for (const verification of oldestFirst) {
    for (const category of verification.categories) {
      byCategory.set(category.categoryId, {
        categoryId: category.categoryId,
        name: category.name,
        status: category.status,
        reasons: category.reasons ?? [],
        comment: category.comment,
        reviewedAt: verification.reviewedAt,
      });
    }
  }
  return [...byCategory.values()];
}

/** "Motivo · Motivo — comentario" para mostrar la decisión del administrador. */
export function decisionMessage(decision: Pick<CategoryDecision, "reasons" | "comment">) {
  const reasons = decision.reasons.filter((reason) => reason !== "Otro").join(" · ");
  return [reasons, decision.comment].filter(Boolean).join(" — ");
}
