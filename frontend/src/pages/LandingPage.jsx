import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldAlert, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
    const [url, setUrl] = useState('');
    const navigate = useNavigate();

    const handleAnalyze = (e) => {
        if (e) e.preventDefault();
        if (url) {
            // Encode URL to pass as query param or state
            navigate(`/results?url=${encodeURIComponent(url)}`);
        }
    };

    React.useEffect(() => {
        // Check if running in a Chrome extension environment
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const currentTab = tabs[0];
                if (currentTab && currentTab.url && (currentTab.url.startsWith('http') || currentTab.url.startsWith('https'))) {
                    setUrl(currentTab.url);
                    // Auto-analyze if it's a valid URL
                    navigate(`/results?url=${encodeURIComponent(currentTab.url)}`);
                }
            });
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl space-y-8"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                        Break Out of Your <span className="text-primary">Echo Chamber</span>.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Paste an article URL. We'll analyze its bias and find the strongest steel-man counter-arguments from reputable sources.
                    </p>
                </div>

                <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4 w-full max-w-xl mx-auto">
                    <input
                        type="url"
                        placeholder="Paste news article URL here..."
                        className="flex-1 h-12 px-4 rounded-lg border border-input bg-background ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        className="h-12 px-8 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        Analyze <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left">
                    <FeatureCard
                        icon={<ShieldAlert className="w-8 h-8 text-destructive" />}
                        title="Detect Bias"
                        description="Instantly see the political leaning and potential blind spots of any article."
                    />
                    <FeatureCard
                        icon={<Newspaper className="w-8 h-8 text-blue-500" />}
                        title="Find Counter-Arguments"
                        description="Discover high-quality, good-faith arguments from the other side."
                    />
                    <FeatureCard
                        icon={<ArrowRight className="w-8 h-8 text-green-500" />}
                        title="Expand Perspective"
                        description="Move beyond the feed algorithm and understand the full debate."
                    />
                </div>
            </motion.div>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="mb-4">{icon}</div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);

export default LandingPage;
