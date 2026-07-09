import raw from "@/data/demo.json";
import type { DemoData, Msme } from "./types";

export const demo = raw as unknown as DemoData;

export function allMsmes(): Msme[] {
  return demo.msmes;
}

export function msmeById(id: string): Msme | undefined {
  return demo.msmes.find((m) => m.id === id);
}
