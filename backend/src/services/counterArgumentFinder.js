import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar-reasoning-pro';

export const findCounterArguments = async (topic, originalBias, originalSummary, articleText) => {
    console.log(`Finding counter-arguments for topic: ${topic}, bias: ${originalBias}`);

    try {
        // Determine input text: Use articleText if valid, otherwise fall back to summary
        let inputText = articleText;
        if (!inputText || inputText === "Scraping failed, used URL analysis." || inputText.length < 50) {
            console.warn("Article text missing or invalid. Using summary for analysis.");
            inputText = `Topic: ${topic}\nSummary: ${originalSummary.join(' ')}`;
        }

        // PHASE 1: Analyze with Perspective Bridge Engine Prompt
        const analysisPrompt = `
SYSTEM ROLE
You are the Perspective Bridge Engine, an expert AI analyst designed to reduce echo chambers.
Your job is to analyze a news article (extracted from a user-provided URL) and generate high-quality search queries for counter-arguments, prioritizing credible, verified, high-trust sources from both global and Indian media.

PHASE 1: TRIAGE & CLASSIFICATION

Classify the article text into exactly one category:

ARGUMENT – The article takes a stance, expresses opinion, or advocates a viewpoint.

EVENT – The article reports factual news without explicit stance.

DOGMA – The article uses hostile, absolute, or hyper-certain language.

PHASE 2: ENTITY & CONTENT EXTRACTION

Identify the Main Topic or Core Claim in one sentence.

Extract Entities (people, organizations, laws, countries, locations).

Determine the Stance of the article: "Pro", "Anti", or "Neutral".

**PHASE 3: SEARCH QUERY GENERATION

(With Valid-Source Prioritization for Perplexity API)**

Your goal is to help users break out of echo chambers by surfacing credible counter-arguments, expert critiques, and context-building information.

All search queries must prioritize high-trust global and Indian sources.

PREFERRED NEWS & ANALYSIS SOURCES
Global Trusted Sources

BBC

Reuters

Associated Press (AP)

The Guardian

Al Jazeera

Financial Times

The Economist

New York Times

Washington Post

Nature

Science

Harvard, MIT, Stanford research

Think tanks: Brookings, RAND, Cato, Carnegie, CSIS

Indian Trusted Sources

The Hindu

Indian Express

Hindustan Times (analysis section)

Mint

The Print

The Wire (for long-form analysis)

Scroll.in

IDR (India Development Review)

PRS Legislative Research

ORF (Observer Research Foundation)

EPW (Economic & Political Weekly)

Useful Search Operators

site:thehindu.com

site:indianexpress.com

site:livemint.com

site:bbc.com

site:reuters.com

site:edu

site:gov

filetype:pdf

RULES FOR QUERY GENERATION
IF CLASS = ARGUMENT

Generate counter-stance queries using sources above.

If article is Pro-X, generate Anti-X or critique of X.

Include economic, legal, political, or scientific angles.

Always bias toward reputable outlets via site filters.

IF CLASS = EVENT

Do NOT generate counter-arguments.
Generate contextual queries:

historical background

expert commentary

prior events

policy analysis

investigative reports from reliable sources

IF CLASS = DOGMA

Generate de-escalation queries prioritizing:

nuanced perspectives

expert consensus

multi-disciplinary explanations

good-faith critiques

OUTPUT FORMAT (STRICT JSON ONLY)

{
"triage": {
"classification": "ARGUMENT" | "EVENT" | "DOGMA",
"confidence_score": 0-100,
"reasoning": "Why this classification was chosen"
},
"analysis": {
"main_topic_or_claim": "One sentence summary",
"detected_stance": "Pro" | "Anti" | "Neutral",
"entities": ["Entity A", "Entity B", "Location X"]
},
"search_queries": [
"Query 1 (Counter-argument or context from reputable global/Indian sources)",
"Query 2 (Specific angle using site filters of trusted outlets)",
"Query 3 (Academic/think-tank deep dive)"
]
}

Input Text:
${inputText.slice(0, 5000)}
`;

        console.log(`Input Text Length: ${inputText.length}`);
        console.log("Sending Analysis Request to Perplexity...");

        const requestBody = {
            model: PERPLEXITY_MODEL,
            messages: [
                { role: 'system', content: 'You are the Perspective Bridge Engine. Return ONLY valid JSON.' },
                { role: 'user', content: analysisPrompt }
            ],
            max_tokens: 3000,
            temperature: 0.2,
            top_p: 0.9,
            return_citations: false,
            return_images: false,
            return_related_questions: false
        };

        const analysisResponse = await axios.post(PERPLEXITY_API_URL, requestBody, {
            headers: { 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' }
        });

        const analysisContent = analysisResponse.data.choices[0].message.content
            .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove reasoning block
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        let bridgeAnalysis;
        try {
            bridgeAnalysis = JSON.parse(analysisContent);
        } catch (e) {
            console.error("Failed to parse Bridge Analysis JSON:", analysisContent);
            throw new Error("Bridge Analysis JSON parse failed");
        }

        console.log("Bridge Analysis Result:", JSON.stringify(bridgeAnalysis, null, 2));

        if (bridgeAnalysis.error || !bridgeAnalysis.triage) {
            throw new Error(bridgeAnalysis.message || "Bridge Analysis failed to generate valid classification");
        }

        // PHASE 2: Find Articles using the generated queries
        const searchQueries = bridgeAnalysis.search_queries;
        const classification = bridgeAnalysis.triage.classification;

        const searchPrompt = `
        Context: The user is reading an article about "${bridgeAnalysis.analysis.main_topic_or_claim}".
        The article was classified as: "${classification}".
        Key Entities involved: ${bridgeAnalysis.analysis.entities.join(', ')}.
        
        Using the following search queries generated by the analysis engine:
        ${JSON.stringify(searchQueries)}

        TASK: Search for and list 3 high-quality articles that match the intent of these queries (Counter-arguments, Context, or Nuance).
        
        RELEVANCE GUIDELINES:
        1. The articles MUST be directly relevant to the specific claims: "${bridgeAnalysis.analysis.main_topic_or_claim}".
        2. Prioritize recent articles if the topic is a current event.
        
        PREFERRED SOURCES (Prioritize these if available):
        The Hindu, The Indian Express, TOI, Hindustan Times, The Print, Scroll.in, Economic Times, Mint, NYT, WSJ, Washington Post, BBC, The Economist, Firstpost.

        Return a JSON array of objects, each with:
        - id: A unique string id (1, 2, 3)
        - title: The article title
        - source: The publication name
        - url: A valid URL to the article.
        - summary: A 1-sentence summary of the article.
        - bias: The bias of this article (Left, Right, or Center).
        - qualityScore: A number 0-100 based on the source's reputation.

        Output ONLY valid JSON.
        `;

        console.log("Sending Search Request to Perplexity...");
        const searchResponse = await axios.post(PERPLEXITY_API_URL, {
            model: PERPLEXITY_MODEL,
            messages: [
                { role: 'system', content: 'You are a helpful research assistant. Return ONLY valid JSON array.' },
                { role: 'user', content: searchPrompt }
            ],
            max_tokens: 3000,
            temperature: 0.2,
            top_p: 0.9
        }, {
            headers: { 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' }
        });

        const searchContent = searchResponse.data.choices[0].message.content
            .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove reasoning block
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        let perspectives;
        try {
            perspectives = JSON.parse(searchContent);
        } catch (e) {
            console.error("Failed to parse Search Results JSON:", searchContent);
            throw new Error("Search Results JSON parse failed");
        }

        console.log("Found Perspectives:", perspectives.length);
        return { perspectives, bridgeAnalysis };

    } catch (error) {
        console.error("PERPLEXITY ERROR DETAILS:", JSON.stringify(error.response?.data || error.message, null, 2));
        throw error; // Remove fallback, just throw error
    }
};
