export type SiteSettings = {
  siteMaintenance: boolean;
  cryptoCreationLocked: boolean;
  sportsCreationLocked: boolean;
  priceChallengesLocked: boolean;
  statementChallengesLocked: boolean;
  pvpChallengesLocked: boolean;
  teamChallengesLocked: boolean;
  updatedAt: string | null;
};

export type SiteSettingsRow = {
  id: string;
  site_maintenance: boolean;
  crypto_creation_locked: boolean;
  sports_creation_locked: boolean;
  price_challenges_locked: boolean;
  statement_challenges_locked: boolean;
  pvp_challenges_locked: boolean;
  team_challenges_locked: boolean;
  updated_at: string | null;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteMaintenance: false,
  cryptoCreationLocked: false,
  sportsCreationLocked: true,
  priceChallengesLocked: false,
  statementChallengesLocked: true,
  pvpChallengesLocked: false,
  teamChallengesLocked: false,
  updatedAt: null,
};

export const SITE_SETTING_KEYS = [
  "siteMaintenance",
  "cryptoCreationLocked",
  "sportsCreationLocked",
  "priceChallengesLocked",
  "statementChallengesLocked",
  "pvpChallengesLocked",
  "teamChallengesLocked",
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export function siteSettingsFromRow(row: SiteSettingsRow): SiteSettings {
  return {
    siteMaintenance: row.site_maintenance,
    cryptoCreationLocked: row.crypto_creation_locked,
    sportsCreationLocked: row.sports_creation_locked,
    priceChallengesLocked: row.price_challenges_locked,
    statementChallengesLocked: row.statement_challenges_locked,
    pvpChallengesLocked: row.pvp_challenges_locked,
    teamChallengesLocked: row.team_challenges_locked,
    updatedAt: row.updated_at,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const response = await fetch("/api/site-settings", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load site controls.");
  return response.json();
}
