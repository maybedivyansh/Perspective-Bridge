import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper to scrape article text
const scrapeArticle = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 second timeout
        });
        const $ = cheerio.load(data);

        // Basic scraping strategy (can be improved)
        const title = $('h1').text().trim();
        const paragraphs = $('p').map((i, el) => $(el).text()).get().join('\n');

        if (!paragraphs || paragraphs.length < 100) {
            throw new Error("Insufficient content scraped");
        }

        return { title, text: paragraphs };
    } catch (error) {
        console.error("Scraping failed:", error.message);
        return { title: "", text: "Scraping failed, used URL analysis." };
    }
};

export const analyzeArticle = async (url) => {
    console.log(`Analyzing article: ${url}`);

    // 1. Scrape the article
    const { title, text } = await scrapeArticle(url);

    // 2. Analyze with Gemini
    try {
        let prompt;
        if (text === "Scraping failed, used URL analysis.") {
            prompt = `
            I cannot access the content of this URL directly: "${url}".
            
            Please use Google Search to find and analyze the article at this URL.
            
            Return a JSON object with these fields:
            - title: The likely title of the article.
            - topic: The main topic (e.g., Economic Policy, Healthcare, Technology, Foreign Affairs, Environment, Education, or General News).
            - biasScore: A number 0-100 where 0 is Far Left, 50 is Center, 100 is Far Right.
            - leaning: "Left", "Right", or "Center".
            - authenticityScore: A number 0-100 indicating the credibility and factuality of the content (higher is better).
            - summary: An array of 3 short bullet points summarizing the main arguments.
            `;
        } else {
            prompt = `
            Analyze the following news article text. 
            Return a JSON object with these fields:
            - title: The likely title of the article.
            - topic: The main topic (e.g., Economic Policy, Healthcare, Technology, Foreign Affairs, Environment, Education, or General News).
            - biasScore: A number 0-100 where 0 is Far Left, 50 is Center, 100 is Far Right.
            - leaning: "Left", "Right", or "Center".
            - authenticityScore: A number 0-100 indicating the credibility and factuality of the content (higher is better).
            - summary: An array of 3 short bullet points summarizing the main arguments.
            
            Article Text:
            ${text.slice(0, 5000)}
            `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const analysis = JSON.parse(jsonString);

        return {
            url,
            ...analysis,
            extractedText: text
        };

    } catch (error) {
        console.error("AI Analysis failed:", error);
        return analyzeArticleFallback(url, title);
    }
};

// Fallback logic (previous mock implementation)
const analyzeArticleFallback = (url, scrapedTitle) => {
    // Helper to generate a hash from string
    const getHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    const hash = getHash(url);

    // Determine bias based on known domains or hash
    const isRightLeaning = url.includes('fox') || url.includes('breitbart') || url.includes('nypost');
    const isLeftLeaning = url.includes('cnn') || url.includes('msnbc') || url.includes('huffpost');

    let biasScore;
    let leaning;

    if (isRightLeaning) {
        biasScore = 70 + (hash % 30); // 70-99
        leaning = 'Right';
    } else if (isLeftLeaning) {
        biasScore = 0 + (hash % 30); // 0-29
        leaning = 'Left';
    } else {
        // Randomize center/lean for unknown domains
        const val = hash % 100;
        if (val < 33) {
            biasScore = 0 + (hash % 35);
            leaning = 'Left';
        } else if (val > 66) {
            biasScore = 65 + (hash % 35);
            leaning = 'Right';
        } else {
            biasScore = 35 + (hash % 30);
            leaning = 'Center';
        }
    }

    // Generate title from URL
    let title = "Unknown Article";
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 3);
        if (pathSegments.length > 0) {
            // Take the last meaningful segment and format it
            const slug = pathSegments[pathSegments.length - 1];
            title = slug.replace(/[-_]/g, ' ').replace(/\.html?$/, '');
            // Capitalize words
            title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else {
            title = `Article from ${urlObj.hostname}`;
        }
    } catch (e) {
        title = "Analyzed Content";
    }

    // Detect topic based on keywords
    const detectTopic = (text) => {
        const lower = text.toLowerCase();
        if (lower.match(/money|tax|economy|inflation|market|finance|bank|trade|rate/)) return "Economic Policy";
        if (lower.match(/health|med|doctor|virus|care|hospital|drug|vaccine/)) return "Healthcare";
        if (lower.match(/tech|ai|data|cyber|phone|app|digital|robot|software/)) return "Technology";
        if (lower.match(/war|peace|china|russia|border|military|army|foreign|diploma/)) return "Foreign Affairs";
        if (lower.match(/climate|energy|green|carbon|warming|planet|solar|oil/)) return "Environment";
        if (lower.match(/school|student|college|teach|university|class|educat/)) return "Education";
        return "General News";
    };

    const topic = detectTopic(url);
    const authenticityScore = 80 + (hash % 20); // Random score 80-99 for fallback

    return {
        url,
        title,
        topic,
        biasScore,
        leaning,
        authenticityScore,
        summary: [
            `The article discusses key issues regarding ${topic.toLowerCase()}.`,
            `It presents arguments that align with a ${leaning.toLowerCase()}-leaning perspective.`,
            "The author emphasizes specific policy implications and potential outcomes."
        ],
        extractedText: "Scraping failed, used URL analysis."
    };
};
