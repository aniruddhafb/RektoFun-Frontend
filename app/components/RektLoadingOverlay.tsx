"use client";

interface RektLoadingOverlayProps {
  isLoading: boolean;
}

export function RektLoadingOverlay({ isLoading }: RektLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
        <div className="text-4xl mb-4">😈</div>
        <p className="text-lg font-bold text-gray-900">Sending REKT transaction…</p>
        <p className="text-sm text-gray-500 mt-2">Please approve in your wallet</p>
      </div>
    </div>
  );
}