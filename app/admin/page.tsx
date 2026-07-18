"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  Activity,
  BadgeCheck,
  CircleDollarSign,
  ArrowDownUp,
  ChevronDown,
  Copy,
  ExternalLink,
  FolderPlus,
  ImageUp,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Swords,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { isAdminWallet } from "@/app/lib/admin";
import { getUsers, type User } from "@/app/lib/users-service/users";
import {
  getChallenges,
  type Challenge,
} from "@/app/lib/challenges-service/challenges";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategoryImage,
  type Category,
} from "@/app/lib/category-service/category";
import {
  getAdminReferrals,
  resolveChallenge,
  withdrawChallengeFunds,
  updateRedemptionStatus,
  updateUserRole,
  uploadCategoryImage,
  type AdminRedemption,
  type AdminReferralUser,
} from "@/app/lib/admin-service";

type Tab = "stats" | "funds" | "status" | "challenges" | "resolution" | "users" | "categories" | "referrals";
type ChallengeAudit = {
  id: number;
  chainStatus: string;
  payoutKind: "automatic" | "individual" | "refund";
  creatorPaid: boolean | null;
  recipients: Array<{ wallet: string; claimed: boolean }>;
  paidCount: number | null;
  totalRecipients: number | null;
  complete: boolean;
  lockedUsdc: number;
  lockedSol: number;
  contractAddress: string | null;
  note: string;
};
type ContractBalances = { escrowUsdc: number; programSol: number };
type TrackedWallet = {
  label: string;
  address: string;
  balances: { sol: number; usdc: number; rekto: number };
};
type ServiceHealth = {
  id: string;
  name: string;
  status: "operational" | "degraded" | "down";
  message: string;
  responseTimeMs: number | null;
  checkedAt: string;
  details?: Record<string, string | boolean | number | null>;
};
type UserSort = "verified" | "followers" | "role";
type PriceFeedFilter = "due" | "resolved" | "completed" | "cancelled" | "expired";
const CATEGORY_PAGE_SIZE = 10;
const shortWallet = (wallet?: string | null) =>
  wallet ? `${wallet.slice(0, 5)}…${wallet.slice(-4)}` : "—";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
const challengeExpiryTime = (challenge: Challenge) => {
  const value = challenge.expiry || challenge.expire_time;
  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
};
const isPastChallengeExpiry = (challenge: Challenge, now = Date.now()) => {
  const expiry = challengeExpiryTime(challenge);
  return expiry !== null && expiry <= now;
};

export default function AdminPage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const allowed = isConnected && isAdminWallet(address);
  const [tab, setTab] = useState<Tab>("stats");
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [referralUsers, setReferralUsers] = useState<AdminReferralUser[]>([]);
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [fundsCheckedAt, setFundsCheckedAt] = useState("");
  const [fundsCluster, setFundsCluster] = useState<"devnet" | "mainnet">("devnet");
  const [healthCheckedAt, setHealthCheckedAt] = useState("");
  const [resolutionChallenges, setResolutionChallenges] = useState<Challenge[]>([]);
  const [auditedChallenges, setAuditedChallenges] = useState<Challenge[]>([]);
  const [challengeAudits, setChallengeAudits] = useState<Record<number, ChallengeAudit>>({});
  const [contractBalances, setContractBalances] = useState<ContractBalances>({ escrowUsdc: 0, programSol: 0 });
  const [auditCheckedAt, setAuditCheckedAt] = useState("");
  const [manualWinners, setManualWinners] = useState<Record<number, "creator" | "opponent">>({});
  const [manualPrices, setManualPrices] = useState<Record<number, string>>({});
  const [priceFeedFilter, setPriceFeedFilter] = useState<PriceFeedFilter>("due");
  const [stats, setStats] = useState({
    users: 0,
    challenges: 0,
    open: 0,
    volume: 0,
  });
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState<Record<Tab, boolean>>({
    stats: false,
    funds: false,
    status: false,
    challenges: false,
    resolution: false,
    users: false,
    categories: false,
    referrals: false,
  });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [challengePage, setChallengePage] = useState(1);
  const [userSort, setUserSort] = useState<UserSort>("followers");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [referralPage, setReferralPage] = useState(1);
  const [expandedReferrer, setExpandedReferrer] = useState<number | null>(null);

  useEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  const loadSection = useCallback(
    async (section: Tab, force = false) => {
      if (!allowed) return;
      if (loaded[section] && !force) return;
      setLoading(true);
      setError("");
      try {
        if (section === "funds") {
          const response = await fetch("/api/admin/funds", { cache: "no-store" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not load wallet funds.");
          setTrackedWallets(data.wallets || []);
          setFundsCheckedAt(data.checkedAt || "");
          setFundsCluster(data.cluster === "mainnet" ? "mainnet" : "devnet");
        } else if (section === "status") {
          const response = await fetch("/api/admin/status", { cache: "no-store" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not check services.");
          setServiceHealth(data.services || []);
          setHealthCheckedAt(data.checkedAt || "");
        } else if (section === "stats") {
          const [userData, challengeData] = await Promise.all([
            getUsers({ limit: 1, offset: 0 }),
            getChallenges({ limit: 1000, offset: 0 }, { bypassCache: true }),
          ]);
          const challenges = challengeData.challenges;
          setStats({
            users: userData.total,
            challenges: challengeData.total,
            open: challenges.filter((item) => item.status === "OPEN").length,
            volume: challenges.reduce(
              (sum, item) =>
                sum + Number(item.total_pool || item.pool_size || 0),
              0,
            ),
          });
        } else if (section === "challenges") {
          const challengeData = await getChallenges(
            { limit: 1000, offset: 0 },
            { bypassCache: true },
          );
          const now = Date.now();
          const terminal = challengeData.challenges.filter((challenge) =>
            ["EXPIRED", "CANCELLED", "RESOLVED"].includes(String(challenge.status).toUpperCase())
            || isPastChallengeExpiry(challenge, now),
          );
          const response = await fetch("/api/admin/challenges/audit", {
            method: "POST",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              challenges: challengeData.challenges.map((challenge) => ({
                id: challenge.id,
                status: challenge.status,
                mode: challenge.mode,
                result: challenge.result,
                challengePda: typeof challenge.metadata?.onchain?.challenge_pda === "string"
                  ? challenge.metadata.onchain.challenge_pda : undefined,
              })),
            }),
          });
          const auditData = await response.json();
          if (!response.ok) throw new Error(auditData.error || "Could not audit challenges.");
          setAuditedChallenges(terminal);
          setChallengePage(1);
          setChallengeAudits(Object.fromEntries((auditData.rows || []).map((row: ChallengeAudit) => [row.id, row])));
          setContractBalances(auditData.balances || { escrowUsdc: 0, programSol: 0 });
          setAuditCheckedAt(auditData.checkedAt || "");
        } else if (section === "resolution") {
          const challengeData = await getChallenges(
            { limit: 1000, offset: 0 },
            { bypassCache: true },
          );
          setResolutionChallenges(challengeData.challenges);
        } else if (section === "users") {
          const data = await getUsers({
            limit: 10,
            offset: (userPage - 1) * 10,
            search: debouncedQuery || undefined,
          });
          setUsers(data.users);
          setUserTotal(data.total);
        } else if (section === "categories") {
          setCategories(await getCategories());
        } else {
          const data = await getAdminReferrals();
          setReferralUsers(data.users);
          setRedemptions(data.redemptions);
        }
        setLoaded((current) => ({ ...current, [section]: true }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load admin data.",
        );
      } finally {
        setLoading(false);
      }
    },
    [allowed, loaded, userPage, debouncedQuery],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUserPage(1);
      setLoaded((current) => ({ ...current, users: false }));
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSection(tab), 0);
    return () => window.clearTimeout(timer);
  }, [loadSection, tab]);

  const filteredUsers = useMemo(() => {
    const rows = [...users];
    const score = (user: User) =>
      userSort === "verified"
        ? Number(Boolean(user.twitter_username))
        : userSort === "role"
          ? Number(user.user_type === "moderator")
          : user.followers?.length || 0;
    return rows.sort(
      (a, b) => (score(a) - score(b)) * (sortDirection === "asc" ? 1 : -1),
    );
  }, [users, userSort, sortDirection]);
  const referralUserByWallet = useMemo(
    () => new Map(referralUsers.map((user) => [user.pubkey, user])),
    [referralUsers],
  );
  const pendingRedemptions = redemptions.filter(
    (item) => item.status.toLowerCase() === "pending",
  );
  const referralLeaderboard = useMemo(
    () =>
      [...referralUsers].sort(
        (a, b) => (b.referrals?.length || 0) - (a.referrals?.length || 0),
      ),
    [referralUsers],
  );
  const referralPageRows = referralLeaderboard.slice(
    (referralPage - 1) * 10,
    referralPage * 10,
  );
  const userPages = Math.max(1, Math.ceil(userTotal / 10));
  const referralPages = Math.max(1, Math.ceil(referralLeaderboard.length / 10));
  const categoryPages = Math.max(1, Math.ceil(categories.length / CATEGORY_PAGE_SIZE));
  const categoryPageRows = categories.slice(
    (categoryPage - 1) * CATEGORY_PAGE_SIZE,
    categoryPage * CATEGORY_PAGE_SIZE,
  );
  const today = new Date().toISOString().slice(0, 10);
  const dueChallenges = resolutionChallenges
    .filter(
      (challenge) =>
        (challenge.status === "OPEN" || challenge.status === "RESOLVED")
        && Boolean(challenge.resolution_date)
        && challenge.resolution_date.slice(0, 10) <= today,
    )
    .sort((a, b) => a.resolution_date.localeCompare(b.resolution_date));
  const isPriceFeed = (challenge: Challenge) =>
    String(challenge.resolution_method || challenge.resolution_source || "").toUpperCase() === "PRICE_FEED";
  const hasOpponent = (challenge: Challenge) =>
    Number(challenge.bet_info?.team_count?.TEAM_B?.total_bets ?? 0) > 0
    || Number(challenge.total_opponents ?? 0) > 0
    || Boolean(challenge.bet_info?.highest_bet?.TEAM_B);
  const priceFeedChallenges = dueChallenges.filter(isPriceFeed);
  const allPriceFeedChallenges = resolutionChallenges.filter(isPriceFeed);
  const filteredPriceFeedChallenges = priceFeedFilter === "due"
    ? priceFeedChallenges
    : allPriceFeedChallenges.filter((challenge) => {
        const status = String(challenge.status || "").toLowerCase();
        const resolutionStatus = String(challenge.resolution_status || "").toLowerCase();
        return status === priceFeedFilter || resolutionStatus === priceFeedFilter;
      });
  const manualChallenges = dueChallenges.filter((challenge) => !isPriceFeed(challenge));
  const terminalChallengesByLockedFunds = [...auditedChallenges].sort(
    (a, b) =>
      ((challengeAudits[b.id]?.lockedUsdc || 0) + (challengeAudits[b.id]?.lockedSol || 0))
      - ((challengeAudits[a.id]?.lockedUsdc || 0) + (challengeAudits[a.id]?.lockedSol || 0)),
  );
  const terminalContractsWithFunds = terminalChallengesByLockedFunds.filter((challenge) => {
    const audit = challengeAudits[challenge.id];
    return Boolean(audit?.contractAddress) && ((audit?.lockedUsdc || 0) > 0 || (audit?.lockedSol || 0) > 0);
  });
  const lockedTerminalCount = terminalContractsWithFunds.length;
  const challengePages = Math.max(1, Math.ceil(terminalChallengesByLockedFunds.length / 10));
  const challengePageRows = terminalChallengesByLockedFunds.slice(
    (challengePage - 1) * 10,
    challengePage * 10,
  );

  const changeRole = async (user: User) => {
    const next = user.user_type === "moderator" ? "user" : "moderator";
    setBusyId(user.id);
    setError("");
    try {
      await updateUserRole(user.id, next);
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, user_type: next } : item,
        ),
      );
      setNotice(`${user.username} is now a ${next}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const resolveOne = async (
    challenge: Challenge,
    operation: "resolve_all" | "resolve_db" | "settle_onchain" = "resolve_all",
  ) => {
    if (!hasOpponent(challenge)) {
      setError("This challenge cannot be resolved because no opponent joined.");
      return;
    }
    const priceFeed = isPriceFeed(challenge);
    const winner = manualWinners[challenge.id];
    if (!priceFeed && !winner && operation !== "settle_onchain") {
      setError("Select the winning side before resolving a manual challenge.");
      return;
    }
    const actionLabel = operation === "resolve_db" ? "resolve in the database only"
      : operation === "settle_onchain" ? "settle on-chain only"
      : "resolve in the database and settle on-chain";
    if (!window.confirm(`Challenge #${challenge.id}: ${actionLabel}?`)) return;

    setBusyId(challenge.id);
    setError("");
    setNotice("");
    try {
      const manualPrice = Number(manualPrices[challenge.id]);
      const result = await resolveChallenge(challenge.id, priceFeed ? { operation } : {
        ...(winner ? { creator_wins: winner === "creator" } : {}),
        ...(Number.isFinite(manualPrice) && manualPrice > 0 ? { final_price: manualPrice } : {}),
        operation,
      });
      setNotice(
        result.settlement_succeeded
          ? `Challenge #${challenge.id} resolved and settled on-chain.`
          : `Challenge #${challenge.id} resolved in the database. ${result.settlement_note || "On-chain settlement was not completed."}`,
      );
      await loadSection("resolution", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Challenge resolution failed.");
    } finally {
      setBusyId(null);
    }
  };

  const emergencyWithdraw = async (challenge: Challenge) => {
    const recipient = window.prompt("Recipient wallet address for the emergency USDC withdrawal:");
    if (!recipient) return;
    const amountText = window.prompt("Amount in USDC (for example 1.25):");
    if (!amountText) return;
    const amount = Math.round(Number(amountText) * 1_000_000);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Enter a valid positive USDC amount.");
      return;
    }
    if (!window.confirm(`Emergency-withdraw ${amountText} USDC from challenge #${challenge.id} to ${recipient}? This bypasses normal payouts.`)) return;
    setBusyId(challenge.id);
    setError("");
    setNotice("");
    try {
      const result = await withdrawChallengeFunds(challenge.id, recipient.trim(), amount);
      setNotice(`Emergency withdrawal submitted. Transaction: ${result.signature}`);
      await loadSection("resolution", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Emergency withdrawal failed.");
    } finally {
      setBusyId(null);
    }
  };

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    setBusyId(-1);
    setError("");
    try {
      const imageUrl = categoryImage
        ? await uploadCategoryImage(categoryImage)
        : undefined;
      const created = await createCategory({
        category: categoryName.trim(),
        parent_category: parentCategory || null,
        metadata: imageUrl ? { image_url: imageUrl } : undefined,
      });
      setCategories((items) => [...items, created]);
      setCategoryPage(Math.ceil((categories.length + 1) / CATEGORY_PAGE_SIZE));
      setCategoryName("");
      setParentCategory("");
      setCategoryImage(null);
      setNotice(`Category “${created.category}” added.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Category creation failed.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const removeCategory = async (category: Category) => {
    if (
      !window.confirm(`Remove “${category.category}”? This cannot be undone.`)
    )
      return;
    setBusyId(category.id);
    setError("");
    try {
      await deleteCategory(category.id);
      setCategories((items) => items.filter((item) => item.id !== category.id));
      setCategoryPage((current) =>
        Math.min(current, Math.max(1, Math.ceil((categories.length - 1) / CATEGORY_PAGE_SIZE))),
      );
      setNotice(`Category “${category.category}” removed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category removal failed.");
    } finally {
      setBusyId(null);
    }
  };

  const replaceCategoryImage = async (category: Category, file?: File) => {
    if (!file) return;
    setBusyId(category.id);
    setError("");
    try {
      const imageUrl = await uploadCategoryImage(file);
      const updated = await updateCategoryImage(category.id, imageUrl);
      setCategories((items) =>
        items.map((item) => (item.id === category.id ? updated : item)),
      );
      setNotice(`Image for “${category.category}” updated.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Category image update failed.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const changeRedemption = async (
    item: AdminRedemption,
    status: "pending" | "paid" | "rejected",
  ) => {
    setBusyId(item.id);
    setError("");
    try {
      await updateRedemptionStatus(item.id, status);
      setRedemptions((rows) =>
        rows.map((row) => (row.id === item.id ? { ...row, status } : row)),
      );
      setNotice("Withdrawal status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const sortUsers = (field: UserSort) => {
    if (userSort === field)
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setUserSort(field);
      setSortDirection("desc");
    }
  };

  const goToUserPage = (page: number) => {
    if (page < 1 || page > userPages || page === userPage) return;
    setLoaded((current) => ({ ...current, users: false }));
    setUserPage(page);
  };

  if (!allowed)
    return (
      <div
        className="min-h-[70vh] bg-[#f3e1d7]"
        aria-label="Checking admin access"
      />
    );
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "stats", label: "Stats" },
    { id: "funds", label: "Funds" },
    { id: "status", label: "System status" },
    { id: "challenges", label: "Challenges" },
    { id: "resolution", label: "Resolution" },
    { id: "users", label: "Users" },
    { id: "categories", label: "Categories" },
    { id: "referrals", label: "Referrals" },
  ];

  return (
    <div className="min-h-screen bg-[#f3e1d7] px-4 py-10 text-[#151515] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border-2 border-black bg-[#a8d85b] px-3 py-1 text-xs font-black uppercase tracking-[.15em] shadow-[3px_3px_0_#111]">
              <ShieldCheck className="h-4 w-4" /> Restricted access
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Admin control room
            </h1>
          </div>
          <button
            onClick={() => void loadSection(tab, true)}
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2.5 font-black shadow-[3px_3px_0_#111] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{" "}
            Refresh {tab}
          </button>
        </header>
        <nav className="mb-7 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`cursor-pointer whitespace-nowrap border-2 border-black px-5 py-2.5 font-black shadow-[3px_3px_0_#111] ${tab === item.id ? "bg-black text-white" : "bg-white hover:bg-[#f5d547]"}`}
            >
              {item.label}
              {item.id === "referrals" && pendingRedemptions.length > 0
                ? ` (${pendingRedemptions.length})`
                : ""}
            </button>
          ))}
        </nav>
        {error && (
          <div className="mb-5 border-2 border-black bg-[#ff8c79] p-4 font-bold shadow-[3px_3px_0_#111]">
            {error}
          </div>
        )}
        {notice && (
          <button
            onClick={() => setNotice("")}
            className="mb-5 w-full cursor-pointer border-2 border-black bg-[#a8d85b] p-4 text-left font-bold shadow-[3px_3px_0_#111]"
          >
            {notice} <span className="float-right">×</span>
          </button>
        )}

        {tab === "stats" && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total users",
                value: stats.users,
                icon: Users,
                color: "bg-[#f5d547]",
              },
              {
                label: "Challenges",
                value: stats.challenges,
                icon: Swords,
                color: "bg-[#ff8c79]",
              },
              {
                label: "Open now",
                value: stats.open,
                icon: Activity,
                color: "bg-[#a8d85b]",
              },
              {
                label: "Total volume",
                value: money(stats.volume),
                icon: ShieldCheck,
                color: "bg-white",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className={`${color} border-2 border-black p-5 shadow-[4px_4px_0_#111]`}
              >
                <div className="mb-5 flex justify-between">
                  <span className="text-xs font-black uppercase tracking-[.12em] text-black/60">
                    {label}
                  </span>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black">{loading ? "—" : value}</p>
              </div>
            ))}
          </section>
        )}

        {tab === "funds" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-2 border-2 border-black bg-[#fffaf6] p-5 shadow-[4px_4px_0_#111] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black">
                  <WalletCards className="h-6 w-6" /> Wallet funds
                </h2>
                <p className="text-sm font-semibold text-black/55">
                  Live SOL and token balances on {fundsCluster}
                </p>
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-black/50">
                {fundsCheckedAt ? `Checked ${new Date(fundsCheckedAt).toLocaleString()}` : "Checking now…"}
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {trackedWallets.map((wallet, walletIndex) => (
                <article key={wallet.address} className="border-2 border-black bg-[#fffaf6] shadow-[5px_5px_0_#111]">
                  <div className={`${walletIndex === 0 ? "bg-[#f5d547]" : "bg-[#a8d85b]"} border-b-2 border-black p-5`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-xl font-black">{wallet.label}</h3>
                        <p className="mt-1 break-all font-mono text-xs font-bold text-black/60">{wallet.address}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard.writeText(wallet.address)}
                          className="cursor-pointer border-2 border-black bg-white p-2 shadow-[2px_2px_0_#111]"
                          aria-label={`Copy ${wallet.label} address`}
                          title="Copy address"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={`https://solscan.io/account/${wallet.address}${fundsCluster === "devnet" ? "?cluster=devnet" : ""}`}
                          target="_blank"
                          rel="noreferrer"
                          className="border-2 border-black bg-white p-2 shadow-[2px_2px_0_#111]"
                          aria-label={`View ${wallet.label} on Solscan`}
                          title="View on Solscan"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x-2 divide-black">
                    {([
                      ["SOL", wallet.balances.sol],
                      ["USDC", wallet.balances.usdc],
                      ["REKTO", wallet.balances.rekto],
                    ] as const).map(([symbol, balance]) => (
                      <div key={symbol} className="min-w-0 p-4 sm:p-5">
                        <p className="text-[10px] font-black uppercase tracking-[.14em] text-black/50">{symbol}</p>
                        <p className="mt-2 truncate text-xl font-black sm:text-2xl" title={balance.toLocaleString()}>
                          {loading ? "—" : balance.toLocaleString(undefined, { maximumFractionDigits: symbol === "SOL" ? 4 : 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
              {!loading && !trackedWallets.length && (
                <div className="border-2 border-black bg-[#ff8c79] p-5 font-bold shadow-[4px_4px_0_#111] lg:col-span-2">
                  No wallet balances were returned.
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "status" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-2 border-2 border-black bg-[#fffaf6] p-5 shadow-[4px_4px_0_#111] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Service health</h2>
                <p className="text-sm font-semibold text-black/55">
                  Live checks for the application and its APIs
                </p>
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-black/50">
                {healthCheckedAt ? `Checked ${new Date(healthCheckedAt).toLocaleString()}` : "Checking now…"}
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {serviceHealth.map((service) => {
                const color = service.status === "operational"
                  ? "bg-[#a8d85b]"
                  : service.status === "degraded" ? "bg-[#f5d547]" : "bg-[#ff8c79]";
                return (
                  <article key={service.id} className="border-2 border-black bg-[#fffaf6] shadow-[4px_4px_0_#111]">
                    <div className={`${color} flex items-center justify-between border-b-2 border-black p-4`}>
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        <h3 className="text-lg font-black">{service.name}</h3>
                      </div>
                      <span className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                        {service.status}
                      </span>
                    </div>
                    <div className="space-y-4 p-5">
                      <p className="font-bold">{service.message}</p>
                      <dl className="space-y-2 border-t-2 border-black/10 pt-4 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="font-bold text-black/50">Response time</dt>
                          <dd className="font-black">{service.responseTimeMs === null ? "—" : `${service.responseTimeMs} ms`}</dd>
                        </div>
                        {Object.entries(service.details || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-3">
                            <dt className="font-bold capitalize text-black/50">{key === "url" ? "URL" : key.replace(/([A-Z])/g, " $1")}</dt>
                            <dd className="max-w-[65%] break-all text-right font-mono text-xs font-bold" title={String(value)}>{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </article>
                );
              })}
              {!loading && !serviceHealth.length && (
                <div className="border-2 border-black bg-[#ff8c79] p-5 font-bold shadow-[4px_4px_0_#111] lg:col-span-3">
                  No service health results were returned.
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "challenges" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-4 border-2 border-black bg-[#fffaf6] p-5 shadow-[4px_4px_0_#111] lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black">
                  <Swords className="h-6 w-6" /> Challenge payouts
                </h2>
                <p className="mt-1 text-sm font-semibold text-black/55">
                  Refund and winnings status verified against on-chain claim records.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-[360px]">
                <div className="border-2 border-black bg-[#f5d547] px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[.13em] text-black/55">Escrow USDC</p>
                  <p className="mt-1 text-xl font-black">{loading ? "—" : contractBalances.escrowUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="border-2 border-black bg-[#a8d85b] px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[.13em] text-black/55">Program SOL</p>
                  <p className="mt-1 text-xl font-black">{loading ? "—" : contractBalances.programSol.toLocaleString(undefined, { maximumFractionDigits: 3 })}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-black/50">
              <div className="flex flex-wrap items-center gap-2">
                <p>{auditedChallenges.length} past-expiry, cancelled or resolved challenges</p>
                {lockedTerminalCount > 0 && (
                  <span className="border-2 border-black bg-[#ff8c79] px-2 py-1 font-black text-black">
                    {lockedTerminalCount} still holding funds
                  </span>
                )}
              </div>
              <p>{auditCheckedAt ? `Chain checked ${new Date(auditCheckedAt).toLocaleString()}` : "Checking chain…"}</p>
            </div>

            <div className="overflow-hidden border-2 border-black bg-[#fffaf6] shadow-[5px_5px_0_#111]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="border-b-2 border-black bg-black text-white">
                    <tr>
                      {["Challenge", "Lifecycle", "Mode", "Creator", "Funds locked", "Payout progress", "On-chain status"].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-[11px] font-black uppercase tracking-[.08em]">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {challengePageRows.map((challenge) => {
                      const audit = challengeAudits[challenge.id];
                      const status = String(challenge.status).toUpperCase();
                      const expiredByTime = isPastChallengeExpiry(challenge);
                      const isResolved = status === "RESOLVED";
                      const creator = challenge.creator_details || (typeof challenge.creator === "object" ? challenge.creator : null);
                      const payoutLabel = !audit
                        ? "Not verified"
                        : audit.payoutKind === "automatic"
                          ? "Winner paid"
                          : audit.totalRecipients === null
                            ? audit.complete ? "Distribution complete" : "Pending"
                            : `${audit.paidCount || 0} of ${audit.totalRecipients || 0} claimed`;
                      return (
                        <tr key={challenge.id} className="align-top transition-colors hover:bg-white">
                          <td className="max-w-[300px] px-4 py-4">
                            <p className="truncate font-black" title={challenge.statement || challenge.title}>
                              {challenge.statement || challenge.title || `Challenge #${challenge.id}`}
                            </p>
                            <p className="mt-1 text-xs font-bold text-black/40">
                              #{challenge.id} · {challenge.trading_pair || challenge.ticker || "General"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex border-2 border-black px-2 py-1 text-[10px] font-black uppercase ${
                              isResolved ? "bg-[#a8d85b]" : status === "CANCELLED" ? "bg-[#ffb59f]" : "bg-[#f5d547]"
                            }`}>
                              {status}
                            </span>
                            {expiredByTime && status !== "EXPIRED" && (
                              <span className="mt-1.5 block w-fit border border-black bg-[#f5d547] px-1.5 py-0.5 text-[9px] font-black uppercase">
                                Time expired
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-black">{String(challenge.mode).toUpperCase()}</p>
                            <p className="mt-1 text-xs font-bold text-black/45">
                              {isResolved ? `${challenge.result === "TEAM_A" ? "Creator side" : "Opponent side"} won` : "Refund flow"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-black">{creator?.username || "Unknown"}</p>
                            <p className="mt-1 font-mono text-xs font-bold text-black/45">{shortWallet(creator?.pubkey)}</p>
                            {!isResolved && audit?.creatorPaid !== null && (
                              <span className={`mt-2 inline-flex items-center gap-1 text-[11px] font-black ${audit?.creatorPaid ? "text-emerald-700" : "text-[#b44324]"}`}>
                                {audit?.creatorPaid ? <BadgeCheck className="h-3.5 w-3.5" /> : <CircleDollarSign className="h-3.5 w-3.5" />}
                                {audit?.creatorPaid ? "Creator refunded" : "Creator refund pending"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 border-2 border-black px-2.5 py-1.5 text-sm font-black ${
                              (audit?.lockedUsdc || 0) > 0 ? "bg-[#ff8c79]" : "bg-white text-black/45"
                            }`}>
                              <CircleDollarSign className="h-4 w-4" />
                              {(audit?.lockedUsdc || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC
                            </span>
                            <p className="mt-1 text-[10px] font-black text-black/50">
                              {(audit?.lockedSol || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL in challenge PDA
                            </p>
                            {((audit?.lockedUsdc || 0) > 0 || (audit?.lockedSol || 0) > 0) && (
                              <p className="mt-1.5 text-[10px] font-black uppercase tracking-wide text-[#a6381d]">Still in contract</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${audit?.complete ? "bg-emerald-600" : "bg-amber-500"}`} />
                              <span className="font-black">{payoutLabel}</span>
                            </div>
                            <p className="mt-1 max-w-[300px] text-xs font-semibold leading-relaxed text-black/50">{audit?.note || "On-chain audit unavailable."}</p>
                            {audit?.recipients?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {audit.recipients.map((recipient) => (
                                  <span
                                    key={recipient.wallet}
                                    title={recipient.wallet}
                                    className={`border px-1.5 py-0.5 font-mono text-[9px] font-bold ${recipient.claimed ? "border-emerald-600/30 bg-emerald-50 text-emerald-700" : "border-amber-600/30 bg-amber-50 text-amber-800"}`}
                                  >
                                    {shortWallet(recipient.wallet)} · {recipient.claimed ? "paid" : "pending"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-black">{audit?.chainStatus || "Unknown"}</p>
                            <p className="mt-1 text-xs font-bold text-black/45">
                              Pool {Number(challenge.total_pool || challenge.pool_size || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                            </p>
                            {audit?.contractAddress && (
                              <a
                                href={`https://solscan.io/account/${audit.contractAddress}${fundsCluster === "devnet" ? "?cluster=devnet" : ""}`}
                                target="_blank"
                                rel="noreferrer"
                                title={audit.contractAddress}
                                className="mt-2 inline-flex max-w-[180px] items-center gap-1 font-mono text-[10px] font-black text-blue-700 underline underline-offset-2"
                              >
                                <span className="truncate">{audit.contractAddress}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && auditedChallenges.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <BadgeCheck className="mx-auto mb-3 h-8 w-8 text-black/25" />
                          <p className="font-black">No completed challenge lifecycles yet.</p>
                          <p className="mt-1 text-sm font-semibold text-black/45">Past-expiry, cancelled and resolved challenges will appear here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {terminalChallengesByLockedFunds.length > 0 && (
                <div className="flex flex-col gap-3 border-t-2 border-black bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-bold text-black/50">
                    Showing {(challengePage - 1) * 10 + 1}–{Math.min(challengePage * 10, terminalChallengesByLockedFunds.length)} of {terminalChallengesByLockedFunds.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChallengePage((page) => Math.max(1, page - 1))}
                      disabled={challengePage === 1}
                      className="cursor-pointer border-2 border-black bg-white px-3 py-1.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Previous
                    </button>
                    <span className="min-w-20 text-center text-xs font-black">
                      Page {challengePage} of {challengePages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChallengePage((page) => Math.min(challengePages, page + 1))}
                      disabled={challengePage === challengePages}
                      className="cursor-pointer border-2 border-black bg-[#f5d547] px-3 py-1.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "resolution" && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Due now", value: dueChallenges.length, color: "bg-[#f5d547]" },
                { label: "Price feed", value: priceFeedChallenges.length, color: "bg-[#ff8c79]" },
                { label: "Manual", value: manualChallenges.length, color: "bg-[#a8d85b]" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`${item.color} border-2 border-black p-5 shadow-[4px_4px_0_#111]`}
                >
                  <p className="text-xs font-black uppercase tracking-[.12em] text-black/60">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-black">{loading ? "—" : item.value}</p>
                </div>
              ))}
            </section>

            {[
              {
                key: "price",
                title: "Price feed resolution",
                description: "The backend fetches the current Binance price and calculates the winner automatically.",
                rows: filteredPriceFeedChallenges,
                headingColor: "bg-[#f5d547]",
              },
              {
                key: "manual",
                title: "Manual resolution",
                description: "Choose the winning side explicitly. A final value is optional for non-price challenges.",
                rows: manualChallenges,
                headingColor: "bg-[#ff8c79]",
              },
            ].map((section) => (
              <section key={section.key} className="border-2 border-black bg-[#fffaf6] shadow-[5px_5px_0_#111]">
                <div className="border-b-2 border-black p-5">
                  <h2 className="text-xl font-black">{section.title} ({section.rows.length})</h2>
                  <p className="text-sm font-semibold text-black/50">{section.description}</p>
                  {section.key === "price" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(["due", "resolved", "completed", "cancelled", "expired"] as PriceFeedFilter[]).map((filter) => {
                        const count = filter === "due"
                          ? priceFeedChallenges.length
                          : allPriceFeedChallenges.filter((challenge) =>
                              String(challenge.status || "").toLowerCase() === filter
                              || String(challenge.resolution_status || "").toLowerCase() === filter,
                            ).length;
                        return (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setPriceFeedFilter(filter)}
                            className={`cursor-pointer border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_#111] ${priceFeedFilter === filter ? "bg-black text-white" : "bg-white text-black"}`}
                          >
                            {filter === "due" ? "Due now" : filter} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead className={section.headingColor}>
                      <tr>
                        {["Challenge", "Market", "Mode", "Target", "Due", "Status", "Winner / value", "Action"].map((heading) => (
                          <th key={heading} className="px-4 py-3 text-xs font-black uppercase">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black/10">
                      {section.rows.map((challenge) => {
                        const opponentJoined = hasOpponent(challenge);
                        const contractAddress = typeof challenge.metadata?.onchain?.challenge_pda === "string"
                          ? challenge.metadata.onchain.challenge_pda : "";
                        const canResolve = (challenge.status === "OPEN" || challenge.status === "RESOLVED")
                          && Boolean(challenge.resolution_date)
                          && challenge.resolution_date.slice(0, 10) <= today;
                        return (
                        <tr key={challenge.id} className="hover:bg-white">
                          <td className="max-w-[260px] px-4 py-3">
                            <p className="truncate font-black" title={challenge.statement || challenge.title}>
                              {challenge.statement || challenge.title || `Challenge #${challenge.id}`}
                            </p>
                            <p className="text-xs font-bold text-black/40">#{challenge.id}</p>
                            {contractAddress && (
                              <a
                                href={`https://solscan.io/account/${contractAddress}${fundsCluster === "devnet" ? "?cluster=devnet" : ""}`}
                                target="_blank"
                                rel="noreferrer"
                                title={contractAddress}
                                className="mt-1 inline-flex max-w-[220px] items-center gap-1 font-mono text-[10px] font-black text-blue-700 underline underline-offset-2"
                              >
                                <span className="truncate">{contractAddress}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3 font-black">{challenge.trading_pair || challenge.ticker || "—"}</td>
                          <td className="px-4 py-3 font-bold">{challenge.mode}</td>
                          <td className="px-4 py-3 font-bold">{challenge.direction || "—"} {challenge.target ? money(challenge.target) : "—"}</td>
                          <td className="px-4 py-3 font-bold">{date(challenge.resolution_date)}</td>
                          <td className="px-4 py-3">
                            <span className={`border-2 border-black px-2 py-1 text-xs font-black ${challenge.status === "OPEN" ? "bg-[#ff8c79]" : "bg-[#a8d85b]"}`}>{challenge.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {section.key === "price" ? (
                              <span className="text-sm font-bold">Calculated automatically</span>
                            ) : (
                              <div className="flex min-w-[230px] gap-2">
                                <select
                                  value={manualWinners[challenge.id] || ""}
                                  onChange={(event) => setManualWinners((current) => ({ ...current, [challenge.id]: event.target.value as "creator" | "opponent" }))}
                                  disabled={!opponentJoined}
                                  className="border-2 border-black bg-white px-2 py-1.5 text-sm font-black"
                                >
                                  <option value="">Select winner</option>
                                  <option value="creator">Creator / Team A</option>
                                  <option value="opponent">Opponent / Team B</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={manualPrices[challenge.id] || ""}
                                  onChange={(event) => setManualPrices((current) => ({ ...current, [challenge.id]: event.target.value }))}
                                  disabled={!opponentJoined}
                                  placeholder="Final value"
                                  className="w-28 border-2 border-black bg-white px-2 py-1.5 text-sm font-bold"
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex min-w-[190px] flex-col gap-2">
                              <button
                                onClick={() => void resolveOne(challenge, "resolve_all")}
                                disabled={!canResolve || !opponentJoined || busyId === challenge.id || (section.key === "manual" && challenge.status === "OPEN" && !manualWinners[challenge.id])}
                                className="cursor-pointer border-2 border-black bg-[#a8d85b] px-3 py-2 text-sm font-black shadow-[2px_2px_0_#111] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {busyId === challenge.id ? "Working…" : "Resolve DB + chain"}
                              </button>
                              <div className="flex gap-2">
                                <button onClick={() => void resolveOne(challenge, "resolve_db")} disabled={challenge.status !== "OPEN" || !opponentJoined || busyId === challenge.id || (section.key === "manual" && !manualWinners[challenge.id])} className="flex-1 cursor-pointer border-2 border-black bg-white px-2 py-1 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40">DB only</button>
                                <button onClick={() => void resolveOne(challenge, "settle_onchain")} disabled={challenge.status !== "RESOLVED" || !opponentJoined || busyId === challenge.id} className="flex-1 cursor-pointer border-2 border-black bg-[#f5d547] px-2 py-1 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40">Chain only</button>
                              </div>
                              <button onClick={() => void emergencyWithdraw(challenge)} disabled={busyId === challenge.id || !challenge.metadata?.onchain?.challenge_pda} className="cursor-pointer border-2 border-black bg-[#ff8c79] px-2 py-1 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40">Emergency withdraw</button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                      {!section.rows.length && (
                        <tr><td colSpan={8} className="p-10 text-center font-bold text-black/45">{section.key === "price" && priceFeedFilter !== "due" ? `No ${priceFeedFilter} price-feed challenges.` : "No due challenges in this section."}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === "users" && (
          <section className="border-2 border-black bg-[#fffaf6] shadow-[5px_5px_0_#111]">
            <div className="flex flex-col gap-4 border-b-2 border-black p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">All users</h2>
                <p className="text-sm font-semibold text-black/50">
                  Verification, login and community details
                </p>
              </div>
              <label className="group flex h-12 min-w-0 items-center gap-3 rounded-md border-2 border-black bg-white px-4 shadow-[3px_3px_0_#111] transition focus-within:-translate-y-0.5 focus-within:bg-[#fffbea] focus-within:shadow-[4px_4px_0_#111] md:w-96">
                <Search
                  className="h-5 w-5 shrink-0 text-black/65"
                  strokeWidth={2.5}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, wallet or X…"
                  className="admin-user-search-input min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm font-bold shadow-none outline-none ring-0 placeholder:text-black/35 focus:border-0 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm bg-transparent text-lg font-black text-black/55 transition hover:bg-black hover:text-white"
                  >
                    ×
                  </button>
                )}
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left">
                <thead className="border-b-2 border-black bg-[#f5d547]">
                  <tr>
                    <th className="px-4 py-3 text-xs font-black uppercase">
                      User
                    </th>
                    <th className="px-4 py-3">
                      <button
                        onClick={() => sortUsers("verified")}
                        className="flex cursor-pointer items-center gap-1 text-xs font-black uppercase"
                      >
                        Verified X <ArrowDownUp className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase">
                      Login
                    </th>
                    <th className="px-4 py-3">
                      <button
                        onClick={() => sortUsers("followers")}
                        className="flex cursor-pointer items-center gap-1 text-xs font-black uppercase"
                      >
                        Followers <ArrowDownUp className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase">
                      Wallet address
                    </th>
                    <th className="px-4 py-3">
                      <button
                        onClick={() => sortUsers("role")}
                        className="flex cursor-pointer items-center gap-1 text-xs font-black uppercase"
                      >
                        Role <ArrowDownUp className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white">
                      <td className="px-4 py-3">
                        <Link
                          href={`/profile/${user.wallet_address}`}
                          target="_blank"
                          className="font-black hover:underline"
                        >
                          {user.username || "Unnamed"}
                        </Link>
                        <p className="font-mono text-xs text-black/45">
                          {shortWallet(user.wallet_address)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {user.twitter_username ? (
                          <a
                            href={`https://x.com/${user.twitter_username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[#378FDB] hover:underline"
                          >
                            @{user.twitter_username} ↗
                          </a>
                        ) : (
                          <span className="text-black/35">Not verified</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {user.twitter_username
                          ? "X"
                          : user.email
                            ? "Email"
                            : "Wallet"}
                      </td>
                      <td className="px-4 py-3 font-black">
                        {user.followers?.length || 0}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          title={user.wallet_address}
                          onClick={() =>
                            void navigator.clipboard
                              .writeText(user.wallet_address)
                              .then(() => setNotice("Wallet copied."))
                          }
                          className="inline-flex cursor-pointer items-center gap-2 rounded border border-black/20 bg-white px-2.5 py-1.5 font-mono text-xs font-bold transition hover:border-black hover:bg-[#f5d547]"
                        >
                          {shortWallet(user.wallet_address)}
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`border border-black px-2 py-1 text-xs font-black uppercase ${user.user_type === "moderator" ? "bg-[#f5d547]" : "bg-white"}`}
                        >
                          {user.user_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void changeRole(user)}
                          disabled={busyId === user.id}
                          className={`cursor-pointer border-2 border-black px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_#111] disabled:opacity-50 ${user.user_type === "moderator" ? "bg-white" : "bg-[#a8d85b]"}`}
                        >
                          {user.user_type === "moderator"
                            ? "Remove moderator"
                            : "Promote"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers.length && !loading && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center font-bold text-black/45">
                        {debouncedQuery ? "No users match this search." : "No users found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t-2 border-black bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-black/55">
                {userTotal > 0
                  ? `Showing ${(userPage - 1) * 10 + 1}–${Math.min(userPage * 10, userTotal)} of ${userTotal} ${debouncedQuery ? "matching " : ""}users`
                  : `0 ${debouncedQuery ? "matching " : ""}users`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToUserPage(userPage - 1)}
                  disabled={userPage === 1 || loading}
                  className="cursor-pointer border-2 border-black bg-white px-3 py-1.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Previous
                </button>
                <span className="border-2 border-black bg-[#f5d547] px-3 py-1.5 text-sm font-black">
                  {userPage} / {userPages}
                </span>
                <button
                  onClick={() => goToUserPage(userPage + 1)}
                  disabled={userPage === userPages || loading}
                  className="cursor-pointer border-2 border-black bg-white px-3 py-1.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === "categories" && (
          <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
            <form
              onSubmit={addCategory}
              className="h-fit border-2 border-black bg-[#fffaf6] p-5 shadow-[5px_5px_0_#111]"
            >
              <div className="mb-5 flex items-center gap-2">
                <FolderPlus />
                <h2 className="text-xl font-black">Add category</h2>
              </div>
              <label className="mb-4 block text-xs font-black uppercase tracking-wider">
                Category name
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  placeholder="e.g. Esports"
                  className="mt-2 w-full border-2 border-black bg-white px-3 py-2.5 text-base font-bold outline-none focus:bg-[#f5d547]/20"
                />
              </label>
              <label className="mb-4 block text-xs font-black uppercase tracking-wider">
                Category image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCategoryImage(e.target.files?.[0] || null)
                  }
                  className="mt-2 block w-full cursor-pointer border-2 border-dashed border-black bg-white p-3 text-sm normal-case"
                />
                <span className="mt-1 block text-[10px] text-black/45">
                  PNG, JPG or WebP · max 5 MB
                </span>
              </label>
              <label className="mb-5 block text-xs font-black uppercase tracking-wider">
                Parent category (optional)
                <select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="mt-2 w-full border-2 border-black bg-white px-3 py-2.5 text-base font-bold"
                >
                  <option value="">None — top level</option>
                  {categories
                    .filter((item) => !item.parent_category)
                    .map((item) => (
                      <option key={item.id} value={item.category}>
                        {item.category}
                      </option>
                    ))}
                </select>
              </label>
              <button
                disabled={busyId === -1}
                className="w-full cursor-pointer border-2 border-black bg-[#a8d85b] px-4 py-2.5 font-black shadow-[3px_3px_0_#111] disabled:opacity-50"
              >
                {busyId === -1 ? "Uploading…" : "Add to database"}
              </button>
            </form>
            <section className="border-2 border-black bg-[#fffaf6] shadow-[5px_5px_0_#111]">
              <div className="border-b-2 border-black p-5">
                <h2 className="text-xl font-black">Database categories</h2>
                <p className="text-sm font-semibold text-black/50">
                  {categories.length} categories
                </p>
              </div>
              <div className="divide-y-2 divide-black/10">
                {categoryPageRows.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 p-4"
                  >
                    <div className="flex items-center gap-3">
                      {item.metadata?.image_url ? (
                        <Image
                          src={item.metadata.image_url}
                          alt=""
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 border-2 border-black object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center border-2 border-dashed border-black/40 bg-white text-black/35">
                          <ImageUp className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-black">{item.category}</p>
                        <p className="text-xs font-bold text-black/45">
                          {item.parent_category
                            ? `Under ${item.parent_category}`
                            : "Top-level category"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="border border-black bg-white px-2 py-1 text-xs font-black">
                        {item.challenges_count || 0} challenges
                      </span>
                      <label
                        className={`inline-flex cursor-pointer items-center gap-1.5 border-2 border-black bg-[#f5d547] px-2.5 py-2 text-xs font-black transition hover:bg-white ${busyId === item.id ? "pointer-events-none opacity-50" : ""}`}
                        title="Upload a new category image"
                      >
                        <ImageUp className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {item.metadata?.image_url
                            ? "Replace image"
                            : "Add image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={busyId === item.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            void replaceCategoryImage(item, file);
                          }}
                        />
                      </label>
                      <button
                        onClick={() => void removeCategory(item)}
                        disabled={busyId === item.id}
                        className="cursor-pointer border-2 border-black bg-[#ff8c79] p-2 disabled:opacity-50"
                        title="Remove category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {!categoryPageRows.length && !loading && (
                  <div className="p-8 text-center font-bold text-black/45">
                    No categories found.
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 border-t-2 border-black bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-black/55">
                  {categories.length > 0
                    ? `Showing ${(categoryPage - 1) * CATEGORY_PAGE_SIZE + 1}–${Math.min(categoryPage * CATEGORY_PAGE_SIZE, categories.length)} of ${categories.length} categories`
                    : "0 categories"}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryPage((page) => Math.max(1, page - 1))}
                    disabled={categoryPage === 1 || loading}
                    className="cursor-pointer border-2 border-black bg-white px-3 py-1.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Previous
                  </button>
                  <span className="border-2 border-black bg-[#f5d547] px-3 py-1.5 text-sm font-black">
                    {categoryPage} / {categoryPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategoryPage((page) => Math.min(categoryPages, page + 1))}
                    disabled={categoryPage === categoryPages || loading}
                    className="cursor-pointer border-2 border-black bg-white px-3 py-1.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === "referrals" && (
          <div className="space-y-6">
            <section className="border-2 border-black bg-[#fffaf6] shadow-[5px_5px_0_#111]">
              <div className="border-b-2 border-black p-5">
                <h2 className="text-xl font-black">Withdrawal requests</h2>
                <p className="text-sm font-semibold text-black/50">
                  Review and update referral redemption payments
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-[#ff8c79]">
                    <tr>
                      {["User", "Wallet", "Amount", "Requested", "Status"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-xs font-black uppercase"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {redemptions.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <Link
                            href={`/profile/${item.wallet_address}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 font-black hover:underline"
                          >
                            {item.username || "Unknown"}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              if (item.wallet_address)
                                void navigator.clipboard
                                  .writeText(item.wallet_address)
                                  .then(() => setNotice("Wallet copied."));
                            }}
                            className="inline-flex cursor-pointer items-center gap-2 font-mono text-xs hover:underline"
                            title={item.wallet_address || ""}
                          >
                            {shortWallet(item.wallet_address)}
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </td>
                        <td className="px-4 py-3 font-black">
                          {money(item.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {date(item.requested_at)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.status}
                            disabled={busyId === item.id}
                            onChange={(e) =>
                              void changeRedemption(
                                item,
                                e.target.value as
                                  "pending" | "paid" | "rejected",
                              )
                            }
                            className={`cursor-pointer border-2 border-black px-2 py-1 text-xs font-black uppercase ${item.status === "paid" ? "bg-[#a8d85b]" : item.status === "rejected" ? "bg-[#ff8c79]" : "bg-[#f5d547]"}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {!redemptions.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center font-bold text-black/45"
                        >
                          No withdrawal requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="border-2 border-black bg-[#fffaf6] shadow-[5px_5px_0_#111]">
              <div className="border-b-2 border-black p-5">
                <h2 className="text-xl font-black">Referral leaderboard</h2>
                <p className="text-sm font-semibold text-black/50">
                  Ranked by total successful referrals
                </p>
              </div>
              <div className="divide-y-2 divide-black/10">
                {referralPageRows.map((user, index) => {
                  const rank = (referralPage - 1) * 10 + index + 1;
                  const isExpanded = expandedReferrer === user.id;
                  const referrals = (user.referrals || [])
                    .map((wallet) => referralUserByWallet.get(wallet))
                    .filter((item): item is AdminReferralUser => Boolean(item));
                  return (
                    <div key={user.id}>
                      <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 p-4 hover:bg-[#f5d547]/15">
                        <span
                          className={`flex h-9 w-9 items-center justify-center border-2 border-black font-black ${rank <= 3 ? "bg-[#f5d547]" : "bg-white"}`}
                        >
                          #{rank}
                        </span>
                        <Link
                          href={`/profile/${user.pubkey}`}
                          target="_blank"
                          className="group min-w-0"
                        >
                          <p className="inline-flex items-center gap-1 font-black group-hover:underline">
                            {user.username || "Unnamed"}
                            <ExternalLink className="h-3 w-3" />
                          </p>
                          <p className="font-mono text-xs text-black/45">
                            {shortWallet(user.pubkey)}
                          </p>
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedReferrer(isExpanded ? null : user.id)
                          }
                          className="flex cursor-pointer items-center gap-3 border-2 border-black bg-white px-3 py-2 text-left hover:bg-[#f5d547]"
                        >
                          <span>
                            <strong className="block text-lg leading-none">
                              {user.referrals?.length || 0}
                            </strong>
                            <small className="text-[9px] font-black uppercase">
                              referrals
                            </small>
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="border-t-2 border-black/10 bg-[#f7efe9] px-4 py-3 sm:pl-16">
                          {referrals.length ? (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {referrals.map((referred) => (
                                <Link
                                  key={referred.id}
                                  href={`/profile/${referred.pubkey}`}
                                  target="_blank"
                                  className="flex items-center justify-between border-2 border-black bg-white px-3 py-2 hover:bg-[#f5d547]"
                                >
                                  <span>
                                    <strong className="block text-sm">
                                      {referred.username || "Unnamed"}
                                    </strong>
                                    <small className="font-mono text-black/45">
                                      {shortWallet(referred.pubkey)}
                                    </small>
                                  </span>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-black/45">
                              No referral profiles found.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!referralLeaderboard.length && (
                  <p className="p-8 text-center font-bold text-black/45">
                    No referral data yet.
                  </p>
                )}
              </div>
              {referralPages > 1 && (
                <div className="flex items-center justify-between border-t-2 border-black bg-white p-4">
                  <span className="text-sm font-bold text-black/55">
                    Page {referralPage} of {referralPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setExpandedReferrer(null);
                        setReferralPage((page) => Math.max(1, page - 1));
                      }}
                      disabled={referralPage === 1}
                      className="cursor-pointer border-2 border-black px-3 py-1.5 text-sm font-black disabled:opacity-35"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        setExpandedReferrer(null);
                        setReferralPage((page) =>
                          Math.min(referralPages, page + 1),
                        );
                      }}
                      disabled={referralPage === referralPages}
                      className="cursor-pointer border-2 border-black px-3 py-1.5 text-sm font-black disabled:opacity-35"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
