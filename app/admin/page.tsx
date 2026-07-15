"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  Activity,
  ArrowDownUp,
  ChevronDown,
  Copy,
  ExternalLink,
  FolderPlus,
  ImageUp,
  RefreshCw,
  Search,
  ShieldCheck,
  Swords,
  Trash2,
  Users,
} from "lucide-react";
import { isAdminWallet } from "@/app/lib/admin";
import { getUsers, type User } from "@/app/lib/users-service/users";
import { getChallenges } from "@/app/lib/challenges-service/challenges";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategoryImage,
  type Category,
} from "@/app/lib/category-service/category";
import {
  getAdminReferrals,
  updateRedemptionStatus,
  updateUserRole,
  uploadCategoryImage,
  type AdminRedemption,
  type AdminReferralUser,
} from "@/app/lib/admin-service";

type Tab = "stats" | "users" | "categories" | "referrals";
type UserSort = "verified" | "followers" | "role";
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

export default function AdminPage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const allowed = isConnected && isAdminWallet(address);
  const [tab, setTab] = useState<Tab>("stats");
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [referralUsers, setReferralUsers] = useState<AdminReferralUser[]>([]);
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    challenges: 0,
    open: 0,
    volume: 0,
  });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState<Record<Tab, boolean>>({
    stats: false,
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
        if (section === "stats") {
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
        } else if (section === "users") {
          const data = await getUsers({
            limit: 10,
            offset: (userPage - 1) * 10,
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
    [allowed, loaded, userPage],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSection(tab), 0);
    return () => window.clearTimeout(timer);
  }, [loadSection, tab]);

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    const rows = users.filter(
      (user) =>
        !value ||
        `${user.username} ${user.wallet_address} ${user.twitter_username || ""}`
          .toLowerCase()
          .includes(value),
    );
    const score = (user: User) =>
      userSort === "verified"
        ? Number(Boolean(user.twitter_username))
        : userSort === "role"
          ? Number(user.user_type === "moderator")
          : user.followers?.length || 0;
    return rows.sort(
      (a, b) => (score(a) - score(b)) * (sortDirection === "asc" ? 1 : -1),
    );
  }, [query, users, userSort, sortDirection]);
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
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, wallet or X…"
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-black/35"
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
                </tbody>
              </table>
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
                {categories.map((item) => (
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
              <div className="flex flex-col gap-3 border-t-2 border-black bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-black/55">
                  Showing {(userPage - 1) * 10 + 1}–
                  {Math.min(userPage * 10, userTotal)} of {userTotal} users
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
