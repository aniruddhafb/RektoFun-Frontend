import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us",
    description: "Learn about RektoFun's mission to revolutionize prediction markets with PvP battles. Discover our vision for the future of competitive trading.",
    keywords: ["about RektoFun", "prediction markets mission", "PvP trading platform", "trading community", "DeFi vision", "Web3 predictions"],
    openGraph: {
        title: "About RektoFun",
        description: "Learn about our mission to revolutionize prediction markets with PvP battles.",
        url: "https://rekto.fun/about",
        images: [
            {
                url: "/logos/BG.png",
                width: 1200,
                height: 630,
                alt: "About RektoFun",
            },
        ],
    },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#f3e1d7] font-sans">

            {/* Hero Section */}
            <section className=" py-16 md:py-24">
                <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-black mb-6">
                        About RektoFun
                    </h1>
                    <p className="text-lg md:text-xl text-gray-800 max-w-2xl mx-auto">
                        The first PvP battleground for price predictions.
                        We're revolutionizing prediction markets with competitive,
                        social, and engaging gameplay.
                    </p>
                </div>
            </section>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12 md:py-16">
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Mission */}
                    <section>
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            Our Mission
                        </h2>
                        <p className="text-gray-700 mb-4">
                            At RektoFun, we believe prediction markets should be exciting,
                            social, and accessible to everyone. We're building the future
                            of decentralized predictions where users can compete, learn, and earn.
                        </p>
                        <p className="text-gray-700">
                            Our platform combines the thrill of PvP competition with the
                            wisdom of crowds, creating a unique ecosystem where the best
                            predictors rise to the top.
                        </p>
                    </section>

                    {/* Vision */}
                    <section>
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            Our Vision
                        </h2>
                        <p className="text-gray-700 mb-4">
                            We envision a world where prediction markets are as mainstream
                            as sports betting, but with the added benefit of collective
                            intelligence and real-world impact.
                        </p>
                        <p className="text-gray-700">
                            By gamifying predictions, we're making financial literacy
                            and market analysis fun and engaging for a new generation
                            of users.
                        </p>
                    </section>
                </div>

                {/* Features */}
                <section className="mt-16">
                    <h2 className="text-3xl font-bold text-black mb-8 text-center">
                        What Makes Us Different
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-black mb-2">
                                PvP Battles
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Compete directly against other predictors in real-time battles
                                and prove your market expertise.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-black mb-2">
                                Community First
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Join a vibrant community of predictors, share strategies,
                                and climb the leaderboards together.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-black mb-2">
                                Real Rewards
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Earn rewards for accurate predictions and build your reputation
                                as a top market analyst.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
