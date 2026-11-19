import "server-only";
import { cache } from "react";
import type { Category } from "@/types/category";
import type { Report } from "@/types/report";
import type { ServiceRequest } from "@/types/request";
import type { Service } from "@/types/service";
import type { AppUser } from "@/types/user";
import type { Verification } from "@/types/verification";
import type { Availability, Review, Worker } from "@/types/worker";
import { homyGet, publicGet } from "./homy-api";

// Lecturas compartidas entre el layout y la página de una misma petición:
// cache() evita pedir dos veces lo mismo a NestJS.

export const getCategories = cache(() => publicGet<Category[]>("/categories", []));
/** Profesionales verificados; con la ubicación del cliente, solo los de su misma ciudad. */
export const getWorkers = cache((city?: string | null) =>
  publicGet<Worker[]>(`/workers?verificationStatus=verified&limit=100${city ? `&city=${encodeURIComponent(city)}` : ""}`, []),
);
export const getWorker = cache((id: string) => publicGet<Worker | null>(`/workers/${id}`, null));
export const getWorkerReviews = cache((id: string) => publicGet<Review[]>(`/reviews/worker/${id}`, []));
export const getWorkerAvailability = cache((id: string) => publicGet<Availability[]>(`/availability/worker/${id}`, []));

// Cliente
export const getMyRequests = cache(() => homyGet<ServiceRequest[]>("/requests", []));

// Trabajador
export const getMyWorker = cache(() => homyGet<Worker | null>("/workers/me", null));
export const getReceivedRequests = cache(() => homyGet<ServiceRequest[]>("/requests/received", []));
export const getMyVerifications = cache(() => homyGet<Verification[]>("/verifications/me", []));
export const getMyServices = cache(() => homyGet<Service[]>("/services/mine", []));
export const getMyAvailability = cache(() => homyGet<Availability[]>("/availability/mine", []));
export const getMyReviews = cache(() => homyGet<Review[]>("/reviews/received", []));

// Reportes (cliente y trabajador)
export const getReportsMade = cache(() => homyGet<Report[]>("/reports", []));
export const getReportsReceived = cache(() => homyGet<Report[]>("/reports/received", []));

// Administración
export const getAdminVerifications = cache(() => homyGet<Verification[]>("/verifications", []));
export const getServicesForReview = cache(() => homyGet<Service[]>("/services/review", []));
export const getAllReports = cache(() => homyGet<Report[]>("/reports/all", []));
export const getUsers = cache(() => homyGet<AppUser[]>("/users", []));
export const getAdminCategories = cache(() => homyGet<Category[]>("/categories/all", []));
