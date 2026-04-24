import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Read RektoFun's Privacy Policy. Learn how we collect, use, and protect your personal information.",
    keywords: ["privacy policy", "RektoFun privacy", "data protection", "personal information", "cookie policy", "data collection"],
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: "Privacy Policy | RektoFun",
        description: "Read our Privacy Policy and learn how we protect your data.",
        url: "https://rekto.fun/privacy",
        images: [
            {
                url: "/logos/BG.png",
                width: 1200,
                height: 630,
                alt: "RektoFun Privacy Policy",
            },
        ],
    },
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#f3e1d7] font-sans">
            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12 md:py-16">
                <h1 className="text-4xl md:text-5xl font-bold text-black mb-8">
                    Privacy Policy
                </h1>

                <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="text-lg mb-6">
                        Last updated: April 2026
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            1. Information We Collect
                        </h2>
                        <p className="mb-4">
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Account information (wallet address, email when provided)</li>
                            <li>Transaction data related to challenges and predictions</li>
                            <li>Communication preferences and support requests</li>
                            <li>Usage data and analytics to improve our service</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            2. How We Use Your Information
                        </h2>
                        <p className="mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Provide and maintain our prediction market services</li>
                            <li>Process transactions and manage your account</li>
                            <li>Communicate with you about updates and support</li>
                            <li>Improve our platform and user experience</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            3. Data Security
                        </h2>
                        <p className="mb-4">
                            We implement appropriate technical and organizational measures to protect
                            your personal information against unauthorized access, alteration, disclosure,
                            or destruction. However, no method of transmission over the Internet is
                            100% secure.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            4. Cookies and Tracking
                        </h2>
                        <p className="mb-4">
                            We use cookies and similar tracking technologies to:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Remember your preferences and settings</li>
                            <li>Analyze usage patterns and improve our service</li>
                            <li>Provide personalized content and recommendations</li>
                        </ul>
                        <p className="mb-4">
                            You can control cookie preferences through your browser settings.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            5. Third-Party Services
                        </h2>
                        <p className="mb-4">
                            We may share your information with third-party service providers who assist
                            us in operating our platform, including blockchain infrastructure providers,
                            analytics services, and customer support tools.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            6. Your Rights
                        </h2>
                        <p className="mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt out of marketing communications</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            7. Blockchain Data
                        </h2>
                        <p className="mb-4">
                            Please note that blockchain transactions are publicly visible and cannot
                            be deleted. Your wallet address and transaction history on the blockchain
                            will remain accessible indefinitely.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            8. Changes to This Policy
                        </h2>
                        <p className="mb-4">
                            We may update this Privacy Policy from time to time. We will notify you
                            of any material changes by posting the new policy on this page and updating
                            the "Last updated" date.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-black mb-4">
                            9. Contact Us
                        </h2>
                        <p className="mb-4">
                            If you have any questions about this Privacy Policy, please contact us
                            through our Twitter or email support at rektofun@gmail.com
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}