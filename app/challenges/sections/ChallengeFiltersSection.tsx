interface ChallengeFiltersSectionProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  activeAsset: string;
  setActiveAsset: (asset: string) => void;
}

const filterOptions = ["All", "Active", "Ending Soon", "High Stakes", "My Bets"];
const assetOptions = ["All Assets", "SOL", "BTC", "ETH", "DOGE", "PEPE", "SHIB"];

export function ChallengeFiltersSection({
  activeFilter,
  setActiveFilter,
  activeAsset,
  setActiveAsset,
}: ChallengeFiltersSectionProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === filter ? "bg-black text-white" : "bg-white/60 text-gray-700 hover:bg-white/80"}`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          {assetOptions.map((asset) => (
            <button
              key={asset}
              onClick={() => setActiveAsset(asset)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeAsset === asset ? "bg-gray-800 text-white" : "bg-white/60 text-gray-700 hover:bg-white/80"}`}
            >
              {asset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}