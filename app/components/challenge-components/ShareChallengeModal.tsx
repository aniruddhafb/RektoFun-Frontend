"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Link2, X } from "lucide-react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Challenge } from "@/app/lib/challenges-service/challenges";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useUserStore } from "@/app/store/useUserStore";
import { stripUsdcQuote } from "@/app/lib/format-market-label";

type ShareChallengeModalProps = { challenge: Challenge; isOpen: boolean; onClose: () => void };

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  const consumed = lines.join(" ").length;
  if (consumed < text.trim().length && lines.length) {
    while (ctx.measureText(`${lines.at(-1)}…`).width > maxWidth) lines[lines.length - 1] = lines.at(-1)!.slice(0, -1);
    lines[lines.length - 1] += "…";
  }
  return lines;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function getShareStats(challenge: Challenge) {
  const a = challenge.bet_info?.team_count?.TEAM_A;
  const b = challenge.bet_info?.team_count?.TEAM_B;
  const recordedPool = (a?.total_amount ?? 0) + (b?.total_amount ?? 0);
  const recordedParticipants = (a?.total_bets ?? 0) + (b?.total_bets ?? 0);
  return {
    pool: recordedPool || challenge.total_pool || challenge.pool_size || challenge.initial_bet || 0,
    participants: recordedParticipants || challenge.participants || challenge.total_challengers + challenge.total_opponents || 1,
  };
}

function getPredictionLine(challenge: Challenge) {
  const resolutionValue = challenge.resolution_date || challenge.resolve_time;
  const resolutionDate = resolutionValue ? new Date(resolutionValue) : null;
  const dateText = resolutionDate && !Number.isNaN(resolutionDate.getTime())
    ? resolutionDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const prediction = stripUsdcQuote(challenge.statement || challenge.title) || `${challenge.ticker} ${challenge.direction.toLowerCase()} ${challenge.target}`;
  return dateText ? `${prediction} by ${dateText}` : prediction;
}

export function ShareChallengeModal({ challenge, isOpen, onClose }: ShareChallengeModalProps) {
  const sharingUsername = useUserStore(state => state.user?.username?.trim() || "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState("");
  const [feedback, setFeedback] = useState<"link" | "image" | null>(null);
  useBodyScrollLock(isOpen);
  const shareUrl = useMemo(() => typeof window === "undefined" ? "" : `${window.location.origin}/challenges?challengeId=${encodeURIComponent(challenge.id)}`, [challenge.id]);
  const stats = getShareStats(challenge);

  const drawCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 1200;
    canvas.width = W;
    canvas.height = W;

    const gradient = ctx.createLinearGradient(0, 0, W, W);
    gradient.addColorStop(0, "#171311");
    gradient.addColorStop(1, "#30221c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, W);
    ctx.fillStyle = "rgba(232,90,45,.16)";
    ctx.beginPath(); ctx.arc(1070, 160, 270, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(245,213,71,.08)";
    ctx.beginPath(); ctx.arc(80, 1110, 250, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff8f4";
    roundedRect(ctx, 55, 48, 1090, 1104, 48);
    ctx.fillStyle = "#e85a2d";
    roundedRect(ctx, 55, 48, 18, 1104, 9);

    const logo = new window.Image();
    logo.src = "/rektologo.png";
    await new Promise<void>(resolve => { logo.onload = () => resolve(); logo.onerror = () => resolve(); });
    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, 105, 88, 330, 66);
    if (sharingUsername) {
      ctx.font = "800 27px Arial, sans-serif";
      ctx.fillStyle = "#6f5c52";
      ctx.textAlign = "right";
      ctx.fillText(`@${sharingUsername}`, 1080, 130);
      ctx.textAlign = "left";
    }
    ctx.strokeStyle = "#ead7cc";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(105, 190); ctx.lineTo(1090, 190); ctx.stroke();

    ctx.fillStyle = "#181513";
    roundedRect(ctx, 105, 230, 230, 58, 29);
    ctx.fillStyle = "#fff";
    ctx.font = "800 25px Arial, sans-serif";
    ctx.fillText((challenge.mode.toUpperCase() === "TEAM" ? "TEAM MODE" : "PVP MODE"), 143, 268);
    ctx.fillStyle = "#f5d547";
    ctx.beginPath(); ctx.arc(111, 259, 9, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#181513";
    ctx.font = "900 62px Arial, sans-serif";
    const lines = wrapText(ctx, getPredictionLine(challenge), 955, 4);
    lines.forEach((line, index) => ctx.fillText(line, 105, 385 + index * 76));

    const panelY = 710;
    ctx.fillStyle = "#181513";
    ctx.shadowColor = "rgba(45,31,26,.16)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    roundedRect(ctx, 105, panelY, 985, 270, 34);
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#bfb2aa";
    ctx.font = "800 24px Arial, sans-serif";
    ctx.fillText("TOTAL POOL", 160, panelY + 72);
    ctx.fillText("PARTICIPANTS", 650, panelY + 72);
    ctx.fillStyle = "#fff8f4";
    ctx.font = "900 64px Arial, sans-serif";
    ctx.fillText(`$${Number(stats.pool).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 160, panelY + 148);
    ctx.fillText(String(stats.participants), 650, panelY + 148);
    ctx.strokeStyle = "#53463f";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(575, panelY + 48); ctx.lineTo(575, panelY + 175); ctx.stroke();
    ctx.fillStyle = "#f5d547";
    roundedRect(ctx, 150, panelY + 194, 895, 48, 24);
    ctx.fillStyle = "#181513";
    ctx.font = "800 22px Arial, sans-serif";
    ctx.fillText(`${stripUsdcQuote(challenge.trading_pair || challenge.ticker) || "MARKET"}  •  ${challenge.status.replaceAll("_", " ")}`, 185, panelY + 226);

    ctx.fillStyle = "#181513";
    ctx.font = "900 31px Arial, sans-serif";
    ctx.fillText("PICK A SIDE. PROVE YOUR CALL.", 105, 1068);
    ctx.fillStyle = "#806f65";
    ctx.font = "600 23px Arial, sans-serif";
    ctx.fillText("rekto.fun  •  Challenge #" + challenge.id, 105, 1115);
    setPreview(canvas.toDataURL("image/png"));
  }, [challenge, sharingUsername, stats.participants, stats.pool]);

  useEffect(() => { if (isOpen) requestAnimationFrame(drawCard); }, [drawCard, isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isOpen, onClose]);

  const canvasBlob = () => new Promise<Blob>((resolve, reject) => canvasRef.current?.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image unavailable")), "image/png"));
  const copyLink = async () => { await navigator.clipboard.writeText(shareUrl); setFeedback("link"); setTimeout(() => setFeedback(null), 1600); };
  const copyImage = async () => {
    try {
      const blob = await canvasBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setFeedback("image"); setTimeout(() => setFeedback(null), 1600);
    } catch { setFeedback(null); }
  };
  const downloadImage = async () => {
    const blob = await canvasBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `rektofun-challenge-${challenge.id}.png`; link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="share-challenge-title">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close share card" />
      <div className="relative z-10 max-h-[94vh] w-full max-w-xl overflow-y-auto border-2 border-black bg-[#fff8f4] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div><h2 id="share-challenge-title" className="text-xl font-black text-gray-950">Share challenge</h2></div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-black bg-white hover:bg-[#f5d547]" aria-label="Close"><X className="h-4 w-4" strokeWidth={3} /></button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="overflow-hidden border-2 border-black bg-[#f1d5c5]">{preview && <Image src={preview} alt="Generated RektoFun challenge share card" width={1200} height={1200} unoptimized className="aspect-square w-full" />}</div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" onClick={copyLink} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 py-3 text-sm font-black hover:bg-[#fdf1e9]">{feedback === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}{feedback === "link" ? "Copied" : "Copy link"}</button>
          <button type="button" onClick={copyImage} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 py-3 text-sm font-black hover:bg-[#fdf1e9]">{feedback === "image" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{feedback === "image" ? "Copied" : "Copy image"}</button>
          <button type="button" onClick={downloadImage} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-[#e85a2d] px-3 py-3 text-sm font-black text-white hover:bg-[#c94821]"><Download className="h-4 w-4" />Download</button>
        </div>
      </div>
    </div>, document.body,
  );
}
