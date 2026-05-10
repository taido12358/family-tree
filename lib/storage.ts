import "server-only";
import fs from "fs/promises";
import path from "path";
import type { FamilyData, AuthData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FAMILY_FILE = path.join(DATA_DIR, "family.json");
const AUTH_FILE = path.join(DATA_DIR, "auth.json");

export async function readFamily(): Promise<FamilyData> {
  const raw = await fs.readFile(FAMILY_FILE, "utf-8");
  return JSON.parse(raw) as FamilyData;
}

export async function writeFamily(data: FamilyData): Promise<void> {
  await fs.writeFile(FAMILY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function readAuth(): Promise<AuthData> {
  const raw = await fs.readFile(AUTH_FILE, "utf-8");
  return JSON.parse(raw) as AuthData;
}
