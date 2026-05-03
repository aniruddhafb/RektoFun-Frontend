"use client";

import { useEffect, useRef } from "react";

export function TradingViewChart() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear any existing content
        containerRef.current.innerHTML = '';

        // Create the TradingView widget script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": "BITSTAMP:BTCUSD",
            "interval": "15",
            "timezone": "exchange",
            "theme": "light",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "backgroundColor": "rgba(255, 255, 255, 0)",
            "gridColor": "rgba(0, 0, 0, 0.05)",
            "withdateranges": true,
            "hide_side_toolbar": false,
            "allow_symbol_change": false,
            "save_image": false,
            "calendar": true,
            "hide_volume": false,
            "support_host": "https://www.tradingview.com"
        });

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <div
            className="tradingview-widget-container"
            style={{ height: '400px', width: '100%' }}
        >
            <div
                ref={containerRef}
                className="tradingview-widget-container__widget"
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
}

interface ChartSectionProps {
    showChart: boolean;
    onToggleChart: () => void;
}

export function ChartSection({ showChart, onToggleChart }: ChartSectionProps) {
    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <span className="font-semibold text-gray-900 text-base sm:text-lg">BTC/USD Chart</span>
                </div>
                <button
                    onClick={onToggleChart}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                >
                    {showChart ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <span className="hidden sm:inline">Hide Chart</span>
                            <span className="sm:hidden">Hide</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="hidden sm:inline">Show Chart</span>
                            <span className="sm:hidden">Show</span>
                        </>
                    )}
                </button>
            </div>

            {/* TradingView Chart */}
            {showChart && <TradingViewChart />}
        </div>
    );
}