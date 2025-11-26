import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Share2, Bookmark, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

const ResultsPage = () => {
    const [searchParams] = useSearchParams();
    const url = searchParams.get('url');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const { saveArticle, savedArticles, removeArticle } = useStore();
    const isSaved = data && savedArticles.some(a => a.url === data.analysis.url);

    const handleSave = () => {
        if (!data) return;
        if (isSaved) {
            removeArticle(data.analysis.url);
        } else {
            saveArticle(data.analysis);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!url) return;
            try {
                const response = await fetch('http://localhost:3000/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                });

                if (!response.ok) throw new Error('Analysis failed');

                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground animate-pulse">Analyzing article and finding perspectives...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <p className="text-destructive text-lg">Error: {error}</p>
                <Link to="/" className="text-primary hover:underline">Try another URL</Link>
            </div>
        );
    }

    const { analysis, perspectives } = data;

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Link>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                isSaved ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                            )}
                            title={isSaved ? "Remove from saved" : "Save article"}
                        >
                            {isSaved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                        </button>
                        <button className="p-2 hover:bg-secondary rounded-full"><Share2 className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Original Article Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Original Article</span>
                            <h1 className="text-3xl font-bold leading-tight">{analysis.title}</h1>
                            <a href={analysis.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                                {new URL(analysis.url).hostname} <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="bg-card border rounded-xl p-6 space-y-4">
                            <h3 className="font-semibold text-lg">Summary</h3>
                            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                                {analysis.summary.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bias Meter */}
                    <div className="bg-secondary/30 rounded-xl p-6 flex flex-col justify-center space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Detected Bias</h3>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Left</span>
                                <span>Center</span>
                                <span>Right</span>
                            </div>
                            <div className="h-4 bg-secondary rounded-full overflow-hidden relative">
                                <div
                                    className="absolute top-0 bottom-0 w-2 bg-primary rounded-full shadow-lg transition-all duration-1000"
                                    style={{ left: `${analysis.biasScore}%` }}
                                />
                                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-foreground/20" />
                            </div>
                            <p className="text-center mt-2 font-medium text-primary">
                                {analysis.leaning} Leaning ({analysis.biasScore}%)
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Perspective Bridge Engine Analysis */}
                {data.bridgeAnalysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border rounded-xl p-6 space-y-4 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                Perspective Bridge Engine
                            </span>
                            <span className="text-xs text-muted-foreground">AI Analysis</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    Classification:
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-sm",
                                        data.bridgeAnalysis.triage.classification === 'ARGUMENT' ? "bg-orange-100 text-orange-700" :
                                            data.bridgeAnalysis.triage.classification === 'EVENT' ? "bg-blue-100 text-blue-700" :
                                                "bg-red-100 text-red-700"
                                    )}>
                                        {data.bridgeAnalysis.triage.classification}
                                    </span>
                                </h3>
                                <p className="text-muted-foreground text-sm italic">
                                    "{data.bridgeAnalysis.triage.reasoning}"
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Confidence Score:</span>
                                    <span className="font-medium">{data.bridgeAnalysis.triage.confidence_score}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Detected Stance:</span>
                                    <span className="font-medium">{data.bridgeAnalysis.analysis.detected_stance}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground block mb-1">Key Entities:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {data.bridgeAnalysis.analysis.entities.slice(0, 5).map((entity, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                                                {entity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Counter Arguments */}
                <div className="space-y-6 pt-8 border-t">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm align-middle">STEEL-MAN</span>
                        Counter-Arguments
                    </h2>

                    <div className="grid gap-6">
                        {perspectives.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-card border hover:border-primary/50 transition-colors rounded-xl p-6 shadow-sm"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-medium",
                                                item.bias === 'Left' ? "bg-blue-100 text-blue-700" :
                                                    item.bias === 'Right' ? "bg-red-100 text-red-700" :
                                                        "bg-gray-100 text-gray-700"
                                            )}>
                                                {item.bias}
                                            </span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="font-medium">{item.source}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                                            <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                                        </h3>
                                        <p className="text-muted-foreground">{item.summary}</p>
                                    </div>

                                    <div className="flex flex-col items-end justify-between min-w-[120px] text-right">
                                        <div className="text-sm">
                                            <span className="block text-muted-foreground text-xs">Quality Score</span>
                                            <span className="font-bold text-green-600">{item.qualityScore}/100</span>
                                        </div>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors"
                                        >
                                            Read <ExternalLink className="w-3 h-3 ml-2" />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
