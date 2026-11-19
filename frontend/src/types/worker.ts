export type VerificationState = "pending" | "verified" | "rejected" | "changes_requested";

export type PublicService = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: { id: string; name: string };
};

export type Worker = {
  id: string;
  description: string;
  experience: string;
  verificationStatus: VerificationState;
  averageRating: number;
  approvedCategories: { id: string; name: string }[];
  createdAt: string;
  user: { id: string; name: string; location: string | null; avatarUrl: string | null; phone?: string | null };
  services: PublicService[];
  minPrice: number | null;
  completedCount: number;
};

export type Availability = { id: string; day: Weekday; startTime: string; endTime: string };

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export const weekdays: { key: Weekday; label: string; short: string }[] = [
  { key: "MONDAY", label: "Lunes", short: "Lun" },
  { key: "TUESDAY", label: "Martes", short: "Mar" },
  { key: "WEDNESDAY", label: "Miércoles", short: "Mié" },
  { key: "THURSDAY", label: "Jueves", short: "Jue" },
  { key: "FRIDAY", label: "Viernes", short: "Vie" },
  { key: "SATURDAY", label: "Sábado", short: "Sáb" },
  { key: "SUNDAY", label: "Domingo", short: "Dom" },
];

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string };
};
