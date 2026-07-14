"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Share2, Trophy, X } from "lucide-react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Challenge } from "@/app/lib/challenges-service/challenges";
import { stripUsdcQuote } from "@/app/lib/format-market-label";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useUserStore } from "@/app/store/useUserStore";

interface WinningsShareModalProps {
  challenge: Challenge;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.join(" ").length < text.trim().length && lines.length) lines[lines.length - 1] += "…";
  return lines;
}

export function WinningsShareModal({ challenge, amount, isOpen, onClose }: WinningsShareModalProps) {
  const username = useUserStore((state) => state.user?.username?.trim() || "Rekto winner");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);
  useBodyScrollLock(isOpen);

  const shareUrl = useMemo(() => typeof window === "undefined"
    ? ""
    : `${window.location.origin}/challenges?challengeId=${encodeURIComponent(challenge.id)}`, [challenge.id]);
  const amountLabel = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const prediction = stripUsdcQuote(challenge.statement || challenge.title) || `${challenge.ticker} challenge`;

  const drawCard = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const size = 1200;
    canvas.width = size;
    canvas.height = size;

    const background = ctx.createLinearGradient(0, 0, size, size);
    background.addColorStop(0, "#15110f");
    background.addColorStop(0.55, "#2c211b");
    background.addColorStop(1, "#0d6847");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "rgba(245,213,71,.16)";
    ctx.beginPath(); ctx.arc(1060, 90, 330, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(17,137,90,.3)";
    ctx.beginPath(); ctx.arc(80, 1110, 340, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#fffaf7";
    roundedRect(ctx, 58, 52, 1084, 1096, 48);
    ctx.fillStyle = "#11895a";
    roundedRect(ctx, 58, 52, 18, 1096, 9);

    const logo = new window.Image();
    logo.src = "/rektologo.png";
    await new Promise<void>((resolve) => { logo.onload = () => resolve(); logo.onerror = () => resolve(); });
    if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, 110, 92, 320, 64);

    ctx.textAlign = "right";
    ctx.fillStyle = "#6f5c52";
    ctx.font = "800 27px Arial, sans-serif";
    ctx.fillText(`@${username}`, 1080, 132);
    ctx.textAlign = "left";

    ctx.fillStyle = "#f5d547";
    roundedRect(ctx, 110, 220, 310, 62, 31);
    ctx.fillStyle = "#181513";
    ctx.font = "900 25px Arial, sans-serif";
    ctx.fillText("✓ WINNINGS CLAIMED", 148, 260);

    ctx.fillStyle = "#181513";
    ctx.font = "900 54px Arial, sans-serif";
    ctx.fillText("I CALLED IT. I WON.", 110, 380);
    ctx.fillStyle = "#11895a";
    ctx.font = "900 116px Arial, sans-serif";
    ctx.fillText(`${amountLabel}`, 110, 525);
    ctx.fillStyle = "#3c302a";
    ctx.font = "900 42px Arial, sans-serif";
    ctx.fillText("USDC", 110, 582);

    ctx.fillStyle = "#181513";
    roundedRect(ctx, 110, 650, 980, 265, 32);
    ctx.fillStyle = "#f5d547";
    ctx.font = "900 24px Arial, sans-serif";
    ctx.fillText(`CHALLENGE #${challenge.id}  •  ${challenge.mode}`, 158, 714);
    ctx.fillStyle = "#fffaf7";
    ctx.font = "900 40px Arial, sans-serif";
    wrapText(ctx, prediction, 875, 3).forEach((line, index) => ctx.fillText(line, 158, 785 + index * 52));

    ctx.fillStyle = "#181513";
    ctx.font = "900 31px Arial, sans-serif";
    ctx.fillText("CONVICTION PAID OFF.", 110, 1035);
    ctx.fillStyle = "#806f65";
    ctx.font = "700 24px Arial, sans-serif";
    ctx.fillText("rekto.fun  •  Pick a side. Prove your call.", 110, 1085);
    setPreview(canvas.toDataURL("image/png"));
  }, [amountLabel, challenge.id, challenge.mode, prediction, username]);

  useEffect(() => { if (isOpen) requestAnimationFrame(drawCard); }, [drawCard, isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isOpen, onClose]);

  const canvasBlob = () => new Promise<Blob>((resolve, reject) => canvasRef.current?.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("Image unavailable")), "image/png"
  ));
  const copyImage = async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": await canvasBlob() })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { setCopied(false); }
  };
  const downloadImage = async () => {
    const url = URL.createObjectURL(await canvasBlob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `rektofun-win-${challenge.id}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const share = async () => {
    const text = `I just claimed ${amountLabel} USDC on RektoFun. Think you can beat my call?`;
    if (navigator.share) await navigator.share({ title: "RektoFun win", text, url: shareUrl });
    else await navigator.clipboard.writeText(`${text} ${shareUrl}`);
  };

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[10200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="winnings-share-title">
      <button type="button" onClick={onClose} className="absolute inset-0 cursor-pointer bg-black/65 backdrop-blur-sm" aria-label="Close winnings share card" />
      <section className="relative z-10 max-h-[94vh] w-full max-w-xl overflow-y-auto border-2 border-black bg-[#fff8f4] p-4 shadow-[8px_8px_0_#111] sm:p-5">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5d547] text-black"><Trophy className="h-5 w-5" strokeWidth={2.7} /></span>
            <div><h2 id="winnings-share-title" className="text-xl font-black text-gray-950">Flex your win</h2><p className="text-sm font-semibold text-[#786a61]">Your winnings are confirmed. Share the receipt.</p></div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-black bg-white hover:bg-[#f5d547]" aria-label="Close"><X className="h-4 w-4" strokeWidth={3} /></button>
        </header>
        <canvas ref={canvasRef} className="hidden" />
        <div className="overflow-hidden border-2 border-black bg-[#e7d4c9]">{preview && <Image src={preview} alt={`Share card celebrating ${amountLabel} USDC in winnings`} width={1200} height={1200} unoptimized className="aspect-square w-full" />}</div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={share} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-[#f5d547] px-3 py-3 text-sm font-black hover:bg-[#f8df68]"><Share2 className="h-4 w-4" />Share</button>
          <button type="button" onClick={copyImage} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 py-3 text-sm font-black hover:bg-[#fdf1e9]">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy image"}</button>
          <button type="button" onClick={downloadImage} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-[#11895a] px-3 py-3 text-sm font-black text-white hover:bg-[#0d7049]"><Download className="h-4 w-4" />Download</button>
        </div>
      </section>
    </div>, document.body
  );
}
