export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#f5f5f5] font-sans">
            {/* Navigation */}
            <nav className="bg-[#f5f5f5]/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <a href="/" className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xl font-semibold tracking-tight">REKTO</span>
                        </a>
                        <a
                            href="/"
                            className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            Back to Home
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-[#f3e1d7] py-16 md:py-24">
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

                {/* Team */}
                <section className="mt-16">
                    <h2 className="text-3xl font-bold text-black mb-8 text-center">
                        Join the Community
                    </h2>
                    <div className="bg-[#f3e1d7] rounded-2xl p-8 md:p-12 text-center">
                        <p className="text-lg text-gray-800 mb-6 max-w-2xl mx-auto">
                            Ready to test your prediction skills? Join thousands of users
                            already competing on RektoFun and become part of the Prediction
                            Markets 2.0 revolution.
                        </p>
                        <a
                            href="/"
                            className="inline-block px-8 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            Start Predicting
                        </a>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-6 px-6 lg:px-8 border-t border-gray-200 bg-[#f5f5f5]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-600">
                            ©2026 RektoFun
                        </p>
                        <div className="flex gap-6">
                            <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                            </a>
                            <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                            <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
