export type Gender = "male" | "female" | "other";

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  birthYear: number | null;
  deathYear: number | null;
  birthPlace: string;
  occupation: string;
  biography: string;
  fatherId: string | null;
  motherId: string | null;
  spouseIds: string[];
  ownerEmail: string | null;
  avatarUrl: string | null;
}

export interface FamilyData {
  members: Member[];
}

export interface AuthUser {
  email: string;
  passwordHash: string;
  memberId: string | null;
  role: "admin" | "user";
}

export interface AuthData {
  users: AuthUser[];
}

export interface SessionPayload {
  email: string;
  memberId: string | null;
  role: "admin" | "user";
}
