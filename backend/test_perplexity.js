import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar-pro';

const testPerplexity = async () => {
    const analysisPrompt = "Test prompt to check API connectivity.";

    const requestBody = {
        model: PERPLEXITY_MODEL,
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 100,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: false,
        return_images: false,
        return_related_questions: false
    };

    try {
        console.log("Sending Test Request to Perplexity...");
        const response = await axios.post(PERPLEXITY_API_URL, requestBody, {
            headers: { 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' }
        });

        console.log("Success!");
        fs.writeFileSync('perplexity_test_output.txt', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Failed!");
        const errorDetails = error.response ? error.response.data : error.message;
        fs.writeFileSync('perplexity_test_output.txt', JSON.stringify(errorDetails, null, 2));
    }
};

testPerplexity();
