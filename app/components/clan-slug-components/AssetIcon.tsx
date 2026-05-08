const AssetIcon = ({ asset, color }: { asset: string; color: string }) => {
    const icons: Record<string, string> = {
        SOL: "◎",
        BTC: "₿",
        ETH: "Ξ",
    };
    return (
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: color }}
        >
            {icons[asset] ?? asset[0]}
        </div>
    );
};

export default AssetIcon;
