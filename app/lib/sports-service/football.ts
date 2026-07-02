import { getAuthHeaders } from "./txline-auth";

const TXLINE_BASE =
  process.env.TXLINE_NETWORK === "devnet"
    ? "https://txline-dev.txodds.com"
    : "https://txline.txodds.com";

// ── Soccer ────────────────────────────────────────────────────────────────────

export interface SoccerScore {
  Goals: number;
  YellowCards: number;
  RedCards: number;
  Corners: number;
}

export interface SoccerParticipantScore {
  H1?: SoccerScore;
  HT?: SoccerScore;
  H2?: SoccerScore;
  ET1?: SoccerScore;
  ET2?: SoccerScore;
  PE?: SoccerScore;
  ETTotal?: SoccerScore;
  Total?: SoccerScore;
}

export interface SoccerFixtureScore {
  Participant1: SoccerParticipantScore;
  Participant2: SoccerParticipantScore;
}

export interface SoccerActionClock {
  running: boolean;
  seconds: number;
}

export interface SoccerActionNew {
  Clock?: SoccerActionClock;
  FreeKickType?: unknown;
  GoalType?: unknown;
  Minutes?: number;
  Outcome?: string;
  PlayerId?: number;
  PlayerInId?: number;
  PlayerOutId?: number;
  ThrowInType?: unknown;
  Type?: string;
}

export interface DataSoccer {
  Action?: string;
  Color?: string;
  Conditions?: string[];
  New?: SoccerActionNew;
  Previous?: SoccerActionNew;
  Corner?: boolean;
  FreeKickType?: string;
  Goal?: boolean;
  GoalType?: unknown;
  Minutes?: number;
  Outcome?: string;
  Participant?: number;
  Penalty?: boolean;
  PlayerId?: number;
  PlayerInId?: number;
  PlayerOutId?: number;
  StatusId?: number;
  ThrowInType?: string;
  Type?: string;
  RedCard?: boolean;
  YellowCard?: boolean;
  VAR?: boolean;
  VenueType?: unknown;
}

export interface SoccerParticipantState {
  PossibleEvent?: {
    Goal?: boolean;
    Penalty?: boolean;
    Corner?: boolean;
  };
}

export interface PossibleEventSoccer {
  RedCard?: boolean;
  YellowCard?: boolean;
  VAR?: boolean;
}

// ── Basketball ────────────────────────────────────────────────────────────────

export interface BasketballPeriodScore {
  Score?: number;
  Fouls?: number;
  PersonalFouls?: number;
  Blocks?: number;
  Rebounds?: number;
  FreeThrows_made?: number;
  "2pts_made"?: number;
  "3pts_made"?: number;
  FreeThrows_missed?: number;
  "2pts_missed"?: number;
  "3pts_missed"?: number;
  FreeThrows_attempts?: number;
  "2pts_attempts"?: number;
  "3pts_attempts"?: number;
  Assists?: number;
  Turnovers?: number;
  Steals?: number;
  UsedTimeouts?: number;
}

export interface BasketballParticipantScore {
  Period?: Record<string, BasketballPeriodScore>;
  HT?: BasketballPeriodScore;
  OT?: Record<string, BasketballPeriodScore>;
  OTTotal?: BasketballPeriodScore;
  Total?: BasketballPeriodScore;
}

export interface BasketballFixtureScore {
  Participant1: BasketballParticipantScore;
  Participant2: BasketballParticipantScore;
}

export interface BasketballClock {
  running: boolean;
  seconds: number;
}

export interface BasketballActionDetail {
  AssistConfirmed?: boolean;
  AssistId?: number;
  BlockConfirmed?: boolean;
  BlockerId?: number;
  Clock?: BasketballClock;
  FouledId?: number;
  IsPlayerRebound?: boolean;
  IsTeam?: boolean;
  IsTeamRebound?: boolean;
  Outcome?: string;
  Participant?: number;
  PlayerId?: number;
  PlayerInId?: number;
  PlayerOutId?: number;
  TeamFoul?: boolean;
  TurnoverId?: number;
  Type?: string;
  UpdatePlayersOnCourt?: boolean;
}

export interface DataBasketball {
  Action?: string;
  Active?: boolean;
  AssistConfirmed?: boolean;
  AssistId?: number;
  BlockConfirmed?: boolean;
  BlockerId?: number;
  Clock?: BasketballClock;
  FouledId?: number;
  Id?: number;
  New?: BasketballActionDetail;
  Previous?: BasketballActionDetail;
  Outcome?: string;
  ReplaceId?: number;
  Type?: string;
}

export interface BasketballParticipantState {
  AttackingBasket?: boolean;
  ActiveTimeout?: boolean;
  Challenges?: number;
}

// ── American Football ─────────────────────────────────────────────────────────

export interface AmericanFootballPeriodScore {
  Score?: number;
  Touchdown?: number;
  Safety?: number;
  "1ptSafety"?: number;
  "1ptConversion"?: number;
  "2ptConversion"?: number;
  FieldGoal?: number;
  Defensive2ptConversion?: number;
}

export interface AmericanFootballParticipantScore {
  Q1?: AmericanFootballPeriodScore;
  Q2?: AmericanFootballPeriodScore;
  HT?: AmericanFootballPeriodScore;
  Q3?: AmericanFootballPeriodScore;
  Q4?: AmericanFootballPeriodScore;
  OT?: Record<string, AmericanFootballPeriodScore>;
  OTTotal?: AmericanFootballPeriodScore;
  Total?: AmericanFootballPeriodScore;
}

export interface AmericanFootballFixtureScore {
  Participant1: AmericanFootballParticipantScore;
  Participant2: AmericanFootballParticipantScore;
}

export interface GameClock {
  running: boolean;
  seconds: number;
}

export interface DownInfo {
  number?: number;
  yardsToGo?: number;
  scrimmageLine?: number;
  possession?: unknown;
  side?: unknown;
}

export interface InPlayInfo {
  BallSnapped?: boolean;
  PlayersLiningUp?: boolean;
  TimeoutParti1?: boolean;
  TimeoutParti2?: boolean;
  TVTimeout?: boolean;
  Outcome?: unknown;
  NewSetOfDowns?: boolean;
  PenaltyIncreasedDown?: boolean;
  PreviousDown?: DownInfo;
}

export interface KickoffInfo {
  Team?: unknown;
  Type?: unknown;
  Outcome?: unknown;
  KickoffPreviousAction?: unknown;
  PenaltyYards?: number;
}

export interface AmericanFootballActionDetail {
  Clock?: GameClock;
  IsTeam?: boolean;
  Outcome?: unknown;
  PlayerId?: number;
  ReceiverId?: number;
  RusherId?: number;
  SackedPlayerId?: number;
  Yards?: number;
  YardsToGo?: number;
}

export interface DataAmericanFootball {
  Action?: string;
  Active?: boolean;
  BigPlay?: boolean;
  Challenge?: boolean;
  Clock?: GameClock;
  Down?: string;
  FieldGoal?: boolean;
  Id?: number;
  IsTeam?: boolean;
  New?: AmericanFootballActionDetail;
  NewSetOfDowns?: boolean;
  Origin?: string;
  Outcome?: string;
  Participant?: number;
  Participants?: number[];
  PasserId?: number;
  Penalty?: boolean;
  PlayerId?: number;
  Posession?: number;
  Previous?: AmericanFootballActionDetail;
  ReceiverId?: number;
  ReplaceId?: number;
  ReviewType?: string;
  RusherId?: number;
  SackedPlayerId?: number;
  Safety?: boolean;
  ScrimmageLine?: number;
  Side?: string;
  Touchdown?: boolean;
  Turnover?: boolean;
  Type?: string;
  Yards?: number;
  YardsToGo?: number;
  YardsToEndzone?: number;
}

export interface AmericanFootballParticipantState {
  Timeouts?: number;
  Challenges?: number;
  PossibleEvent?: {
    touchdown?: boolean;
    fieldGoal?: boolean;
    safety?: boolean;
    "4thDownConversion"?: boolean;
    "2ptConversionAttempt"?: boolean;
    "1stDown"?: boolean;
    bigPlay?: boolean;
    punt?: boolean;
  };
}

export interface PossibleEventAmericanFootball {
  penalty?: boolean;
  turnover?: boolean;
  challenge?: boolean;
}

// ── Lineups ───────────────────────────────────────────────────────────────────

export interface LineupPlayer {
  id?: string;
  normativeId?: number;
  country?: string;
  team?: string;
  dateOfBirth?: string;
  gender?: string;
  preferredName?: string;
  updateDateMillis?: number;
}

export interface LineupEntry {
  fixturePlayerId?: number;
  statusId?: number;
  positionId?: number;
  unitId?: number;
  rosterNumber?: string;
  starter?: boolean;
  starred?: boolean;
  player?: LineupPlayer;
}

export interface LineupTeam {
  id?: string;
  normativeId?: number;
  preferredName?: string;
  gender?: string;
  updateDateMillis?: number;
  lineups?: LineupEntry[];
}

// ── SSE Envelope & LiveScoreUpdate ────────────────────────────────────────────

export interface LiveScoreData {
  fixtureId: number;
  gameState: string;
  startTime: number;
  isTeam?: boolean;
  fixtureGroupId?: number;
  competitionId?: number;
  countryId?: number;
  sportId?: number;
  participant1IsHome?: boolean;
  participant1Id?: number;
  participant2Id?: number;
  action?: string;
  id?: number;
  ts?: number;
  connectionId?: number;
  seq?: number;
  coverageSecondaryData?: boolean;
  coverageType?: string;
  statusId?: unknown;
  statusBasketballId?: unknown;
  statusSoccerId?: unknown;
  type?: unknown;
  confirmed?: boolean;

  clock?: GameClock;
  down?: DownInfo;
  inPlayInfo?: InPlayInfo;
  kickoffInfo?: KickoffInfo;

  score?: AmericanFootballFixtureScore;
  data?: DataAmericanFootball;

  scoreBasketball?: BasketballFixtureScore;
  dataBasketball?: DataBasketball;

  scoreSoccer?: SoccerFixtureScore;
  dataSoccer?: DataSoccer;

  stats?: unknown;
  participant?: number;
  kickoff?: { Team?: unknown };
  lineups?: LineupTeam[];
  possession?: number;
  possessionType?: unknown;

  parti1StateSoccer?: SoccerParticipantState;
  parti2StateSoccer?: SoccerParticipantState;
  parti1StateUsFootball?: AmericanFootballParticipantState;
  parti2StateUsFootball?: AmericanFootballParticipantState;
  parti1StateBasketball?: BasketballParticipantState;
  parti2StateBasketball?: BasketballParticipantState;

  possibleEventSoccer?: PossibleEventSoccer;
  possibleEventUsFootball?: PossibleEventAmericanFootball;
}

export interface LiveScoreEnvelope {
  id?: string;
  event?: string;
  data: LiveScoreData;
}

/** @deprecated Use LiveScoreData for typed access to score fields */
export type LiveScoreUpdate = LiveScoreData;

export interface Fixture {
  Ts: number;
  StartTime: number;
  Competition: string;
  CompetitionId: number;
  FixtureGroupId: number;
  Participant1Id: number;
  Participant1: string;
  Participant2Id: number;
  Participant2: string;
  FixtureId: number;
  Participant1IsHome: boolean;
}

export async function getWorldCupFixtures(competitionId?: number): Promise<Fixture[]> {
  const headers = await getAuthHeaders();
  const today = Math.floor(Date.now() / 86400000); // epoch day
  const params = new URLSearchParams({ startEpochDay: String(today) });
  if (competitionId !== undefined) params.set("competitionId", String(competitionId));

  const res = await fetch(`${TXLINE_BASE}/api/fixtures/snapshot?${params}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch fixtures: ${res.status}`);
  return res.json() as Promise<Fixture[]>;
}

export async function getLiveScore(fixtureId: number): Promise<LiveScoreUpdate[]> {
  const headers = await getAuthHeaders();
  // Omitting `asOf` returns live data
  const res = await fetch(`${TXLINE_BASE}/api/scores/snapshot/${fixtureId}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch score for fixture ${fixtureId}: ${res.status}`);
  return res.json() as Promise<LiveScoreUpdate[]>;
}

export function streamLiveScores(
  fixtureId: number,
  authHeaders: Record<string, string>,
  onUpdate: (update: LiveScoreUpdate) => void,
  onError?: (err: Error) => void
): () => void {
  // EventSource doesn't support custom headers, so we use fetch + ReadableStream
  let active = true;
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(
        `${TXLINE_BASE}/api/scores/stream?fixtureId=${fixtureId}`,
        { headers: authHeaders, signal: controller.signal }
      );
      if (!res.ok || !res.body) throw new Error(`SSE connect failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (active) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const raw = line.slice(5).trim();
            if (!raw || raw === "{}") continue;
            try {
              const parsed: LiveScoreUpdate = JSON.parse(raw);
              onUpdate(parsed);
            } catch {
              // skip malformed SSE data lines
            }
          }
        }
      }
    } catch (err) {
      if (active) onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    active = false;
    controller.abort();
  };
}
