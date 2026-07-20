import "server-only";

import {
  siteSettingsFromRow,
  type SiteSettingKey,
  type SiteSettings,
  type SiteSettingsRow,
} from "@/app/lib/site-settings";
import { backendApiBase, internalApiHeaders } from "@/app/lib/server-api";

const columnByKey: Record<SiteSettingKey, keyof SiteSettingsRow> = {
  siteMaintenance: "site_maintenance",
  cryptoCreationLocked: "crypto_creation_locked",
  sportsCreationLocked: "sports_creation_locked",
  priceChallengesLocked: "price_challenges_locked",
  statementChallengesLocked: "statement_challenges_locked",
  pvpChallengesLocked: "pvp_challenges_locked",
  teamChallengesLocked: "team_challenges_locked",
};

export async function readSiteSettings(): Promise<SiteSettings> {
  const response = await fetch(`${backendApiBase()}/site-settings`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not read site settings (${response.status})`);
  return siteSettingsFromRow(await response.json() as SiteSettingsRow);
}

export async function writeSiteSettings(patch: unknown): Promise<SiteSettings> {
  const source = patch && typeof patch === "object"
    ? patch as Record<string, unknown>
    : {};
  const dbPatch: Record<string, boolean> = {};
  for (const [key, column] of Object.entries(columnByKey) as [SiteSettingKey, keyof SiteSettingsRow][]) {
    if (key in source) {
      if (typeof source[key] !== "boolean") {
        throw new Error(`${key} must be a boolean`);
      }
      dbPatch[column] = source[key];
    }
  }
  const response = await fetch(`${backendApiBase()}/admin/site-settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...internalApiHeaders(),
    },
    cache: "no-store",
    body: JSON.stringify(dbPatch),
  });
  if (!response.ok) throw new Error(`Could not update site settings (${response.status})`);
  return siteSettingsFromRow(await response.json() as SiteSettingsRow);
}
