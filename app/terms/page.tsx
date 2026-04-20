import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Read RektoFun's Terms of Service. Learn about our user responsibilities, prohibited activities, and service limitations.",
    keywords: ["terms of service", "RektoFun terms", "user agreement", "prediction markets terms", "trading platform rules", "service terms"],
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: "Terms of Service | RektoFun",
        description: "Read our Terms of Service and user agreement.",
        url: "https://rekto.fun/terms",
        images: [
            {
                url: "/logos/BG.png",
                width: 1200,
                height: 630,
                alt: "RektoFun Terms of Service",
            },
        ],
    },
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#f3e1d7] font-sans">
            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12 md:py-16">
                <h1 className="text-4xl md:text-5xl font-bold text-black mb-8">
                    Terms of Service
                </h1>

                <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="text-lg mb-6">
                        Last updated: April 2026
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            1. Acceptance of Terms
                        </h2>
                        <p className="mb-4">
                            By accessing and using RektoFun, you accept and agree to be bound by the terms
                            and provision of this agreement. If you do not agree to abide by the above,
                            please do not use this service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            2. Description of Service
                        </h2>
                        <p className="mb-4">
                            RektoFun is a PvP battleground for price predictions and prediction markets.
                            Users can participate in challenges, compete on leaderboards, and engage with
                            other users in prediction-based competitions.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            3. User Responsibilities
                        </h2>
                        <p className="mb-4">
                            You are responsible for maintaining the confidentiality of your account
                            information and for all activities that occur under your account. You agree
                            to notify us immediately of any unauthorized use of your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            4. Prohibited Activities
                        </h2>
                        <p className="mb-4">
                            Users are prohibited from engaging in any activity that:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Violates any applicable laws or regulations</li>
                            <li>Infringes on the rights of others</li>
                            <li>Interferes with the operation of the service</li>
                            <li>Attempts to gain unauthorized access to our systems</li>
                            <li>Engages in fraudulent or manipulative behavior</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            5. Limitation of Liability
                        </h2>
                        <p className="mb-4">
                            RektoFun shall not be liable for any indirect, incidental, special,
                            consequential, or punitive damages resulting from your use of or inability
                            to use the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            6. Changes to Terms
                        </h2>
                        <p className="mb-4">
                            We reserve the right to modify these terms at any time. We will notify users
                            of any material changes by posting the new terms on this page.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            7. Contact Information
                        </h2>
                        <p className="mb-4">
                            If you have any questions about these Terms of Service, please contact us
                            through our twitter or email support at rektofun@gmail.com
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
