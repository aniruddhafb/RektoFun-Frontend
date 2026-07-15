"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Link2, Share2, Sparkles, X } from "lucide-react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Challenge, getChallengeCategoryImage } from "@/app/lib/challenges-service/challenges";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useUserStore } from "@/app/store/useUserStore";
import { stripUsdcQuote } from "@/app/lib/format-market-label";

type ShareChallengeModalProps = { challenge: Challenge; isOpen: boolean; onClose: () => void };
type Side = "TEAM_A" | "TEAM_B";
type Theme = "arena" | "poster";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) line = next;
    else { if (line) lines.push(line); line = word; if (lines.length === maxLines - 1) break; }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.join(" ").length < text.trim().length && lines.length) {
    while (ctx.measureText(`${lines.at(-1)}…`).width > maxWidth) lines[lines.length - 1] = lines.at(-1)!.slice(0, -1);
    lines[lines.length - 1] += "…";
  }
  return lines;
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new window.Image(); image.crossOrigin = "anonymous"; image.onload = () => resolve(image); image.onerror = () => resolve(image); image.src = src;
  });
}

function getShareStats(challenge: Challenge) {
  const a = challenge.bet_info?.team_count?.TEAM_A;
  const b = challenge.bet_info?.team_count?.TEAM_B;
  return {
    pool: (a?.total_amount ?? 0) + (b?.total_amount ?? 0) || challenge.total_pool || challenge.pool_size || challenge.initial_bet || 0,
    participants: (a?.total_bets ?? 0) + (b?.total_bets ?? 0) || challenge.participants || challenge.total_challengers + challenge.total_opponents || 1,
  };
}

function getWinnerMeta(challenge: Challenge) {
  if (challenge.status !== "RESOLVED" || !["TEAM_A", "TEAM_B"].includes(challenge.result)) return null;
  const winningSide = challenge.result as Side;
  const teamA = challenge.bet_info?.team_count?.TEAM_A;
  const teamB = challenge.bet_info?.team_count?.TEAM_B;
  const hasOpponent = Number(teamB?.total_bets ?? 0) > 0 || Number(challenge.participants ?? 0) > 1;
  if (!hasOpponent) return null;

  const entry = challenge.bet_info?.highest_bet?.[winningSide];
  const winnerName = entry?.username || (winningSide === "TEAM_A" ? challenge.creator_details?.username : "Opponent") || "Winner";
  const winnerAvatar = entry?.profile_image || (winningSide === "TEAM_A" ? challenge.creator_details?.profile_image : null) || getChallengeCategoryImage(challenge);
  const winningStake = winningSide === "TEAM_A" ? Number(teamA?.total_amount ?? challenge.initial_bet ?? 0) : Number(teamB?.total_amount ?? 0);
  const winnerStake = Number(entry?.bet ?? (winningSide === "TEAM_A" ? challenge.initial_bet : winningStake) ?? 0);
  const pool = Number(teamA?.total_amount ?? 0) + Number(teamB?.total_amount ?? 0)
    || Number(challenge.total_pool || challenge.pool_size || challenge.initial_bet || 0);
  // Current on-chain defaults deduct 2% platform + 2% creator revenue.
  const settledPool = pool * 0.96;
  const payout = challenge.mode === "TEAM" && winningStake > 0
    ? settledPool * (winnerStake / winningStake)
    : settledPool;

  return { winningSide, winnerName, winnerAvatar, payout, isTeam: challenge.mode === "TEAM" };
}

function getPredictionLine(challenge: Challenge) {
  const value = challenge.resolution_date || challenge.resolve_time;
  const date = value ? new Date(value) : null;
  const dateText = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  const prediction = stripUsdcQuote(challenge.statement || challenge.title) || `${challenge.ticker} ${challenge.direction.toLowerCase()} ${challenge.target}`;
  return dateText ? `${prediction} by ${dateText}` : prediction;
}

function getSocialPredictionLine(challenge: Challenge) {
  const prediction = stripUsdcQuote(challenge.statement || challenge.title)
    || `${challenge.ticker} ${challenge.direction.toLowerCase()} ${challenge.target}`;
  const value = challenge.resolution_date || challenge.resolve_time;
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime()) || /\bby\b/i.test(prediction)) return prediction;
  const dateText = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toLowerCase();
  return `${prediction} by ${dateText}`;
}

export function ShareChallengeModal({ challenge, isOpen, onClose }: ShareChallengeModalProps) {
  const username = useUserStore(state => state.user?.username?.trim() || "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState("");
  const [feedback, setFeedback] = useState<"link" | "image" | "share" | null>(null);
  const [side, setSide] = useState<Side>("TEAM_A");
  const [theme] = useState<Theme>("arena");
  useBodyScrollLock(isOpen);
  const shareUrl = useMemo(() => typeof window === "undefined" ? "" : `${window.location.origin}/challenges?challengeId=${encodeURIComponent(challenge.id)}`, [challenge.id]);
  const stats = getShareStats(challenge);
  const winner = useMemo(() => getWinnerMeta(challenge), [challenge]);
  const statement = getPredictionLine(challenge);

  const drawCard = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = 1200; canvas.height = 1200;
    const [mascot, logo, winnerAvatar] = await Promise.all([
      loadImage("/welcome/rekto-mascot-arena.jpg"),
      loadImage("/rektologo.png"),
      winner ? loadImage(winner.winnerAvatar) : Promise.resolve(null),
    ]);

    if (winner) {
      const amount = winner.payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const background = ctx.createLinearGradient(0, 0, 1200, 1200);
      background.addColorStop(0, "#111814"); background.addColorStop(.58, "#163d2d"); background.addColorStop(1, "#0b6a46");
      ctx.fillStyle = background; ctx.fillRect(0, 0, 1200, 1200);
      ctx.fillStyle = "rgba(245,213,71,.14)"; ctx.beginPath(); ctx.arc(1080, 70, 360, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.beginPath(); ctx.arc(30, 1140, 390, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "#fffaf6"; ctx.beginPath(); ctx.roundRect(54, 48, 1092, 1104, 42); ctx.fill();
      ctx.fillStyle = "#11895a"; ctx.fillRect(54, 48, 16, 1104);
      if (logo.naturalWidth) ctx.drawImage(logo, 106, 88, 302, 60);
      pill(ctx, 824, 88, 270, 58, "#f5d547");
      ctx.fillStyle = "#181513"; ctx.font = "900 22px Arial"; ctx.textAlign = "center"; ctx.fillText("✓ RESULT CONFIRMED", 959, 125);

      ctx.fillStyle = "#11895a"; ctx.font = "900 25px Arial"; ctx.textAlign = "left";
      ctx.fillText(winner.isTeam ? `${winner.winningSide.replace("_", " ")}  •  TOP WINNING SHARE` : "PVP WINNER", 106, 245);
      ctx.fillStyle = "#171412"; ctx.font = "900 70px Arial"; ctx.fillText("THE CALL PAID OFF.", 106, 330);

      ctx.save(); ctx.beginPath(); ctx.arc(214, 478, 92, 0, Math.PI * 2); ctx.clip();
      if (winnerAvatar?.naturalWidth) ctx.drawImage(winnerAvatar, 122, 386, 184, 184);
      else { ctx.fillStyle = "#f5d547"; ctx.fillRect(122, 386, 184, 184); }
      ctx.restore(); ctx.strokeStyle = "#171412"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(214, 478, 96, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#171412"; ctx.font = "900 46px Arial"; ctx.fillText(winner.winnerName, 344, 458);
      ctx.fillStyle = "#75665e"; ctx.font = "800 24px Arial"; ctx.fillText("WON", 344, 505);
      ctx.fillStyle = "#11895a"; ctx.font = "900 76px Arial"; ctx.fillText(`${amount} USDC`, 344, 574);

      ctx.fillStyle = "#171412"; ctx.beginPath(); ctx.roundRect(106, 660, 988, 280, 28); ctx.fill();
      ctx.fillStyle = "#f5d547"; ctx.font = "900 22px Arial"; ctx.fillText(`CHALLENGE #${challenge.id}  •  ${challenge.mode}`, 154, 722);
      ctx.fillStyle = "#fffaf6"; ctx.font = "900 38px Arial";
      wrapText(ctx, statement, 890, 3).forEach((line, index) => ctx.fillText(line, 154, 790 + index * 49));
      ctx.fillStyle = "#171412"; ctx.font = "900 31px Arial"; ctx.fillText("PICK A SIDE. OWN THE RESULT.", 106, 1030);
      ctx.fillStyle = "#806f65"; ctx.font = "700 23px Arial"; ctx.fillText("rekto.fun  •  Conviction looks good on-chain.", 106, 1082);
      ctx.textAlign = "left";
      setPreview(canvas.toDataURL("image/png"));
      return;
    }

    // Preserve the illustration's cinematic composition instead of square-cropping it.
    ctx.fillStyle = "#171119"; ctx.fillRect(0, 0, 1200, 1200);
    if (mascot.naturalWidth) ctx.drawImage(mascot, 0, 0, mascot.naturalWidth, mascot.naturalHeight, 0, 0, 1200, 752);
    const imageShade = ctx.createLinearGradient(0, 0, 0, 752);
    imageShade.addColorStop(0, "rgba(20,10,28,.08)"); imageShade.addColorStop(.68, "rgba(20,10,28,0)"); imageShade.addColorStop(1, "rgba(20,10,28,.82)");
    ctx.fillStyle = imageShade; ctx.fillRect(0, 0, 1200, 752);

    // Top identity and live-arena signal.
    ctx.fillStyle = "rgba(255,248,238,.92)"; ctx.beginPath(); ctx.roundRect(54, 46, 1092, 102, 28); ctx.fill();
    if (logo.naturalWidth) ctx.drawImage(logo, 84, 68, 282, 56);
    ctx.fillStyle = "#251a29"; ctx.font = "900 22px Arial"; ctx.textAlign = "right";
    ctx.fillText(username ? `@${username}` : "LIVE CHALLENGE", 1108, 105); ctx.textAlign = "left";
    ctx.fillStyle = "#ff5b46"; ctx.beginPath(); ctx.arc(1082, 98, 7, 0, Math.PI * 2); ctx.fill();

    // The social hook sits in the illustration's intentional negative space.
    pill(ctx, 648, 204, 296, 54, side === "TEAM_A" ? "#f5d547" : "#b98cff");
    ctx.fillStyle = "#1b1420"; ctx.font = "900 23px Arial";
    ctx.fillText(side === "TEAM_A" ? "I'M BACKING THIS ↑" : "THIS GETS REKTO ↓", 680, 239);
    ctx.fillStyle = "#251a29"; ctx.font = "900 49px Arial";
    wrapText(ctx, statement, 468, 5).forEach((line, index) => ctx.fillText(line, 648, 333 + index * 59));

    // Editorial lower panel: readable even as a small feed thumbnail.
    ctx.fillStyle = theme === "arena" ? "#211529" : (side === "TEAM_A" ? "#f5d547" : "#b98cff");
    ctx.beginPath(); ctx.moveTo(0, 704); ctx.lineTo(1200, 656); ctx.lineTo(1200, 1200); ctx.lineTo(0, 1200); ctx.closePath(); ctx.fill();
    ctx.fillStyle = theme === "arena" ? "#f5d547" : "#211529"; ctx.beginPath(); ctx.moveTo(0, 704); ctx.lineTo(1200, 656); ctx.lineTo(1200, 675); ctx.lineTo(0, 723); ctx.closePath(); ctx.fill();

    const lightText = theme === "arena";
    ctx.fillStyle = lightText ? "#bcaec1" : "#4a354f"; ctx.font = "900 20px Arial"; ctx.fillText("THERE'S REAL MONEY ON THIS", 66, 786);
    ctx.fillStyle = lightText ? "#fff" : "#201526"; ctx.font = "900 70px Arial";
    ctx.fillText(`${Number(stats.pool).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`, 62, 863);
    ctx.fillStyle = lightText ? "#f5d547" : "#fff8f4"; ctx.font = "900 27px Arial"; ctx.fillText(`${stats.participants} PEOPLE HAVE PICKED A SIDE`, 66, 916);

    ctx.strokeStyle = lightText ? "#513c5a" : "rgba(32,21,38,.25)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(66, 960); ctx.lineTo(1134, 960); ctx.stroke();
    ctx.fillStyle = lightText ? "#fff" : "#201526"; ctx.font = "900 43px Arial"; ctx.fillText("WHAT'S YOUR CALL?", 66, 1034);
    pill(ctx, 735, 985, 399, 76, lightText ? "#f5d547" : "#211529");
    ctx.fillStyle = lightText ? "#201526" : "#fff"; ctx.font = "900 24px Arial"; ctx.fillText("ENTER THE ARENA  →", 786, 1033);
    ctx.fillStyle = lightText ? "#a895ae" : "#4a354f"; ctx.font = "800 20px Arial";
    ctx.fillText(`${challenge.mode.toUpperCase()}  /  CHALLENGE #${challenge.id}  /  REKTO.FUN`, 66, 1130);
    setPreview(canvas.toDataURL("image/png"));
  }, [challenge, side, statement, stats.participants, stats.pool, theme, username, winner]);

  useEffect(() => { if (isOpen) requestAnimationFrame(drawCard); }, [drawCard, isOpen]);
  useEffect(() => { if (!isOpen) return; const close = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [isOpen, onClose]);

  const canvasBlob = () => new Promise<Blob>((resolve, reject) => canvasRef.current?.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image unavailable")), "image/png"));
  const flash = (value: typeof feedback) => { setFeedback(value); window.setTimeout(() => setFeedback(null), 1600); };
  const copyLink = async () => { await navigator.clipboard.writeText(shareUrl); flash("link"); };
  const copyImage = async () => { try { const blob = await canvasBlob(); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); flash("image"); } catch { setFeedback(null); } };
  const downloadImage = async () => { const blob = await canvasBlob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `rektofun-${winner ? "win" : "challenge"}-${challenge.id}.png`; link.click(); URL.revokeObjectURL(url); };
  const share = async () => {
    const text = winner
      ? `${winner.winnerName} won ${winner.payout.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC on RektoFun.`
      : `${side === "TEAM_A" ? "I back this call" : "I’m calling rekto"}: ${stripUsdcQuote(challenge.statement || challenge.title)}`;
    try {
      const blob = await canvasBlob(); const file = new File([blob], `rektofun-challenge-${challenge.id}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: "RektoFun challenge", text, url: shareUrl, files: [file] });
      else if (navigator.share) await navigator.share({ title: "RektoFun challenge", text, url: shareUrl });
      else { await navigator.clipboard.writeText(`${text} ${shareUrl}`); }
      flash("share");
    } catch (error) { if ((error as DOMException).name !== "AbortError") setFeedback(null); }
  };
  const shareOnX = () => {
    if (winner) {
      const text = `The call paid off 🏆\n\n${winner.winnerName} won ${winner.payout.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC on @Rektofun.\n\n${getSocialPredictionLine(challenge)}\n\n${shareUrl}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer,width=720,height=620");
      return;
    }
    const stance = side === "TEAM_A" ? "I'm backing this call" : "I'm calling rekto on this";
    const text = `${stance} 👀\non @Rektofun\n\n${getSocialPredictionLine(challenge)}\n\nWhat's your take?\n\njoin here:\n${shareUrl}`;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer,width=720,height=620");
  };

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[10100] flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="share-challenge-title">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} aria-label="Close share card" />
      <div className="relative z-10 max-h-[96vh] w-full max-w-5xl overflow-y-auto border-2 border-black bg-[#fff8f4] p-4 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><div className="mb-1 flex items-center gap-2 text-[#7b3dc1]"><Sparkles className="h-4 w-4" /><span className="text-[11px] font-black uppercase tracking-[.18em]">{winner ? "Victory studio" : "Share studio"}</span></div><h2 id="share-challenge-title" className="text-2xl font-black text-gray-950">{winner ? "Share the winning call." : "Make your call loud."}</h2><p className="text-sm font-semibold text-[#786a61]">{winner ? "The result is confirmed. Send the victory card into the arena." : "Choose your stance, style the card, then send it into the arena."}</p></div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white transition hover:-translate-y-0.5 hover:bg-[#f5d547]" aria-label="Close"><X className="h-4 w-4" strokeWidth={3} /></button>
        </div>
        <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1.12fr)_minmax(250px,.88fr)]">
          <div className="group relative overflow-hidden border-2 border-black bg-[#211825]"><canvas ref={canvasRef} className="hidden" />{preview ? <Image src={preview} alt={winner ? `Winning card for ${winner.winnerName}` : `Share card: ${side === "TEAM_A" ? "backing" : "opposing"} this challenge`} width={1200} height={1200} unoptimized className="aspect-square w-full transition duration-500 group-hover:scale-[1.015]" /> : <div className="aspect-square animate-pulse bg-[#e4d2c8]" />}<div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" /></div>
          <div className="space-y-5">
            {!winner && <fieldset><legend className="mb-2 text-xs font-black uppercase tracking-[.14em] text-[#5f5048]">1. Choose your stance</legend><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setSide("TEAM_A")} aria-pressed={side === "TEAM_A"} className={`cursor-pointer border-2 border-black px-3 py-3 text-sm font-black transition ${side === "TEAM_A" ? "-translate-y-0.5 bg-[#f5d547]" : "bg-white hover:bg-[#fff2b6]"}`}>Back it ↑</button><button type="button" onClick={() => setSide("TEAM_B")} aria-pressed={side === "TEAM_B"} className={`cursor-pointer border-2 border-black px-3 py-3 text-sm font-black transition ${side === "TEAM_B" ? "-translate-y-0.5 bg-[#b58cff]" : "bg-white hover:bg-[#eadcff]"}`}>Call rekto ↓</button></div></fieldset>}
            <div className={`${winner ? "" : "border-t-2 border-dashed border-[#cfbdb3] pt-5"}`}><p className="mb-2 text-xs font-black uppercase tracking-[.14em] text-[#5f5048]">{winner ? "Share the result" : "3. Drop it"}</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={shareOnX} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-black px-3 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#211529]"><span className="text-base leading-none">𝕏</span>Share on X</button><button type="button" onClick={share} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-[#e85a2d] px-3 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#c94821]"><Share2 className="h-4 w-4" />{feedback === "share" ? "Ready" : "More"}</button></div><div className="mt-3 grid grid-cols-3 gap-2"><button type="button" onClick={copyLink} className="flex cursor-pointer flex-col items-center gap-1 border-2 border-black bg-white p-2 text-[11px] font-black hover:bg-[#fdf1e9]">{feedback === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}{feedback === "link" ? "Copied" : "Link"}</button><button type="button" onClick={copyImage} className="flex cursor-pointer flex-col items-center gap-1 border-2 border-black bg-white p-2 text-[11px] font-black hover:bg-[#fdf1e9]">{feedback === "image" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{feedback === "image" ? "Copied" : "Image"}</button><button type="button" onClick={downloadImage} className="flex cursor-pointer flex-col items-center gap-1 border-2 border-black bg-white p-2 text-[11px] font-black hover:bg-[#fdf1e9]"><Download className="h-4 w-4" />Save</button></div></div>
          </div>
        </div>
      </div>
    </div>, document.body,
  );
}
