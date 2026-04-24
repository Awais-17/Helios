const OpenAI = require('openai');
const Groq = require('groq-sdk');

class AIService {
    constructor(config) {
        this.config = config;
        
        // OpenAI Client
        this.openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;
        
        // Groq Client
        this.groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;
        
        // OpenRouter Clients for specific models
        this.openRouterClients = {};
        if (config.openRouterKeys) {
            Object.entries(config.openRouterKeys).forEach(([keyName, apiKey]) => {
                if (apiKey) {
                    this.openRouterClients[keyName] = new OpenAI({
                        baseURL: "https://openrouter.ai/api/v1",
                        apiKey: apiKey,
                        defaultHeaders: {
                            "HTTP-Referer": "https://helios-code.ai",
                            "X-Title": "Helios",
                        }
                    });
                }
            });
        }

        // Model to Client Mapping
        this.modelMapping = {
            'gpt-4o': { client: this.openai, provider: 'openai' },
            'gpt-4o-mini': { client: this.openai, provider: 'openai' },
            'llama-3.3-70b-versatile': { client: this.groq, provider: 'groq' },
            'nvidia/nemotron-3-super-120b-a12b:free': { client: this.openRouterClients.nvidia, provider: 'openrouter' },
            'openai/gpt-oss-120b:free': { client: this.openRouterClients.gptOss, provider: 'openrouter' },
            'google/gemma-4-31b-it:free': { client: this.openRouterClients.gemma, provider: 'openrouter' },
            'meta-llama/llama-3.3-70b-instruct:free': { client: this.openRouterClients.llama, provider: 'openrouter' },
        };

        // Fallback Sequence for "Smart" mode or if current model fails
        this.fallbackSequence = [
            'gpt-4o',
            'llama-3.3-70b-versatile',
            'meta-llama/llama-3.3-70b-instruct:free',
            'nvidia/nemotron-3-super-120b-a12b:free',
            'openai/gpt-oss-120b:free',
            'google/gemma-4-31b-it:free'
        ];

        // Default Model
        this.currentModel = config.defaultModel || 'gpt-4o';
    }

    setModel(modelId) {
        this.currentModel = modelId;
    }

    /**
     * Sends code and context to AI for analysis or editing.
     * Implements a fallback mechanism for robustness.
     */
    async askAI(prompt, currentFileContent, fileStructure, mode = 'chat', modelId = null) {
        const primaryModel = modelId || this.currentModel;
        
        console.log(`AI Request: model=${primaryModel}, mode=${mode}`);

        // If "smart" or specific models fail, try these in order
        const modelsToTry = primaryModel === 'smart' 
            ? this.fallbackSequence 
            : [primaryModel, ...this.fallbackSequence.filter(m => m !== primaryModel)];

        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const mapping = this.modelMapping[modelName];
                
                if (!mapping || !mapping.client) {
                    console.warn(`No client configured for model: ${modelName}. Skipping.`);
                    continue;
                }

                console.log(`Attempting with ${modelName}...`);
                const client = mapping.client;

                let systemPrompt = `
                    You are Helios, an AI Senior Software Engineer.
                    Current Project Context:
                    - Project Root Structure: ${fileStructure}
                    - Active File Content: 
                    ---
                    ${currentFileContent}
                    ---
                `;

                if (mode === 'chat') {
                    systemPrompt += `
                        GOAL: Help the user build their software. Propose file changes using:
                        [FILE: path/to/file]
                        \`\`\`
                        content here
                        \`\`\`
                    `;
                } else if (mode === 'complete') {
                    systemPrompt = `You are a code completion engine. Return ONLY the code that follows. No markdown.`;
                }

                const response = await client.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    model: modelName,
                    temperature: mode === 'complete' ? 0.2 : 0.5,
                    max_tokens: mode === 'complete' ? 100 : 4000,
                });

                if (response.choices && response.choices[0].message.content) {
                    console.log(`Success with ${modelName}`);
                    return response.choices[0].message.content;
                }
            } catch (error) {
                console.error(`AI Error (${modelName}):`, error.message || error);
                lastError = error;
                // Continue to next model in sequence
                continue;
            }
        }

        const finalErrorMessage = lastError ? (lastError.message || JSON.stringify(lastError)) : 'All configured models failed';
        throw new Error(finalErrorMessage);
    }
}

module.exports = AIService;
