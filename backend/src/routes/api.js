import express from 'express';
import { analyzeArticle } from '../services/analyzer.js';
import { findCounterArguments } from '../services/counterArgumentFinder.js';

const router = express.Router();

// POST /api/analyze
router.post('/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const analysis = await analyzeArticle(url);
        const { perspectives, bridgeAnalysis } = await findCounterArguments(analysis.topic, analysis.leaning, analysis.summary, analysis.extractedText);

        res.json({
            analysis,
            perspectives,
            bridgeAnalysis
        });
    } catch (error) {
        console.error('Error analyzing article:', error);
        res.status(500).json({ error: 'Failed to analyze article' });
    }
});

export default router;
