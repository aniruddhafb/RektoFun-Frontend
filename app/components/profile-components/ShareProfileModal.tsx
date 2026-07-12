"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Copy, Download, Link2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    avatar: string;
    verified: boolean;
    stats: { wins: number; rekts: number; winRatio: number; pnl: number; volume: number };
};

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
}

function formatMoney(value: number) {
    return `$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

async function loadImage(src: string) {
    const image = new window.Image();
    let imageSource = src;
    try {
        const url = new URL(src);
        // Drawing DiceBear's SVG directly to canvas can omit its nested avatar
        // layers in some browsers. Ask DiceBear for a flattened PNG instead.
        if (url.hostname === "api.dicebear.com") {
            url.pathname = url.pathname.replace(/\/svg\/?$/, "/png");
            url.searchParams.set("size", "512");
            imageSource = url.toString();
        }
    } catch {
        // Local asset paths are already safe to load directly.
    }
    image.src = /^https:\/\//i.test(imageSource) ? `/api/image-proxy?url=${encodeURIComponent(imageSource)}` : imageSource;
    await new Promise<void>((resolve) => { image.onload = () => resolve(); image.onerror = () => resolve(); });
    return image;
}

export function ShareProfileModal({ isOpen, onClose, username, avatar, verified, stats }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [preview, setPreview] = useState("");
    const [feedback, setFeedback] = useState<"link" | "image" | null>(null);
    useBodyScrollLock(isOpen);
    const shareUrl = useMemo(() => typeof window === "undefined" ? "" : window.location.href, []);

    const drawCard = useCallback(async () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const W = 1200;
        canvas.width = W; canvas.height = W;
        const gradient = ctx.createLinearGradient(0, 0, W, W);
        gradient.addColorStop(0, "#171311"); gradient.addColorStop(1, "#30221c");
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, W);
        ctx.fillStyle = "rgba(232,90,45,.16)"; ctx.beginPath(); ctx.arc(1080, 130, 280, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(245,213,71,.09)"; ctx.beginPath(); ctx.arc(70, 1120, 260, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff8f4"; roundedRect(ctx, 55, 48, 1090, 1104, 48);
        ctx.fillStyle = "#e85a2d"; roundedRect(ctx, 55, 48, 18, 1104, 9);

        const logo = await loadImage("/rektologo.png");
        if (logo.naturalWidth) ctx.drawImage(logo, 105, 88, 330, 66);
        ctx.strokeStyle = "#ead7cc"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(105, 190); ctx.lineTo(1090, 190); ctx.stroke();

        const profileImage = await loadImage(avatar);
        ctx.save(); ctx.beginPath(); ctx.arc(260, 385, 130, 0, Math.PI * 2); ctx.clip();
        if (profileImage.naturalWidth) {
            const side = Math.min(profileImage.naturalWidth, profileImage.naturalHeight);
            ctx.drawImage(profileImage, (profileImage.naturalWidth - side) / 2, (profileImage.naturalHeight - side) / 2, side, side, 130, 255, 260, 260);
        } else { ctx.fillStyle = "#ead7cc"; ctx.fillRect(130, 255, 260, 260); }
        ctx.restore(); ctx.strokeStyle = "#e85a2d"; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(260, 385, 136, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = "#181513"; ctx.font = "900 58px Arial, sans-serif"; ctx.fillText(`@${username}`, 450, 370);
        if (verified) {
            const textWidth = ctx.measureText(`@${username}`).width;
            const x = Math.min(1060, 480 + textWidth); ctx.fillStyle = "#378FDB"; ctx.beginPath(); ctx.arc(x, 350, 30, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "white"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x - 13, 350); ctx.lineTo(x - 3, 361); ctx.lineTo(x + 16, 338); ctx.stroke();
        }
        ctx.fillStyle = "#806f65"; ctx.font = "700 27px Arial, sans-serif"; ctx.fillText("REKTOFUN TRADER PROFILE", 450, 425);

        const cards = [
            { label: "WINS", value: String(stats.wins) }, { label: "REKTS", value: String(stats.rekts) }, { label: "WIN RATIO", value: `${stats.winRatio.toFixed(1)}%` },
            { label: "P&L", value: `${stats.pnl < 0 ? "-" : "+"}${formatMoney(stats.pnl)}`, color: stats.pnl < 0 ? "#e85a2d" : "#179b62" },
            { label: "VOLUME", value: formatMoney(stats.volume) },
        ];
        const positions = [[105, 575, 310, 180], [440, 575, 310, 180], [775, 575, 315, 180], [105, 780, 477, 190], [607, 780, 483, 190]];
        cards.forEach((card, index) => {
            const [x, y, w, h] = positions[index]; ctx.fillStyle = "#181513"; roundedRect(ctx, x, y, w, h, 28);
            ctx.fillStyle = "#bfb2aa"; ctx.font = "800 22px Arial, sans-serif"; ctx.fillText(card.label, x + 34, y + 55);
            ctx.fillStyle = card.color || "#fff8f4"; ctx.font = `900 ${index > 2 ? 48 : 54}px Arial, sans-serif`; ctx.fillText(card.value, x + 34, y + 130);
        });
        ctx.fillStyle = "#181513"; ctx.font = "900 31px Arial, sans-serif"; ctx.fillText("CALLS MADE. RESULTS PROVEN.", 105, 1068);
        ctx.fillStyle = "#806f65"; ctx.font = "600 23px Arial, sans-serif"; ctx.fillText(`rekto.fun  •  @${username}`, 105, 1115);
        try { setPreview(canvas.toDataURL("image/png")); } catch { setPreview(""); }
    }, [avatar, stats, username, verified]);

    useEffect(() => { if (isOpen) requestAnimationFrame(drawCard); }, [drawCard, isOpen]);
    useEffect(() => { if (!isOpen) return; const close = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [isOpen, onClose]);
    const canvasBlob = () => new Promise<Blob>((resolve, reject) => canvasRef.current?.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image unavailable")), "image/png"));
    const copyLink = async () => { await navigator.clipboard.writeText(shareUrl); setFeedback("link"); setTimeout(() => setFeedback(null), 1600); };
    const copyImage = async () => { try { await navigator.clipboard.write([new ClipboardItem({ "image/png": await canvasBlob() })]); setFeedback("image"); setTimeout(() => setFeedback(null), 1600); } catch { setFeedback(null); } };
    const download = async () => { const url = URL.createObjectURL(await canvasBlob()); const link = document.createElement("a"); link.href = url; link.download = `rektofun-profile-${username}.png`; link.click(); URL.revokeObjectURL(url); };
    if (!isOpen) return null;
    return createPortal(<div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="share-profile-title">
        <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close share card" />
        <div className="relative z-10 max-h-[94vh] w-full max-w-xl overflow-y-auto border-2 border-black bg-[#fff8f4] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between"><h2 id="share-profile-title" className="text-xl font-black text-gray-950">Share profile</h2><button type="button" onClick={onClose} className="flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-black bg-white hover:bg-[#f5d547]" aria-label="Close"><X className="h-4 w-4" strokeWidth={3} /></button></div>
            <canvas ref={canvasRef} className="hidden" /><div className="overflow-hidden border-2 border-black bg-[#f1d5c5]">{preview && <Image src={preview} alt={`Generated share card for ${username}`} width={1200} height={1200} unoptimized className="aspect-square w-full" />}</div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button type="button" onClick={copyLink} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 py-3 text-sm font-black hover:bg-[#fdf1e9]">{feedback === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}{feedback === "link" ? "Copied" : "Copy link"}</button>
                <button type="button" onClick={copyImage} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 py-3 text-sm font-black hover:bg-[#fdf1e9]">{feedback === "image" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{feedback === "image" ? "Copied" : "Copy image"}</button>
                <button type="button" onClick={download} className="flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-[#e85a2d] px-3 py-3 text-sm font-black text-white hover:bg-[#c94821]"><Download className="h-4 w-4" />Download</button>
            </div>
        </div>
    </div>, document.body);
}
