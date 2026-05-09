const OpenAI = require('openai');
const Groq = require('groq-sdk');

class AIService {
    constructor(config) {
        this.config = config;
        
        // OpenAI Client
        this.openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;
        
        // Groq Client
        this.groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

        // NVIDIA NIM Client (Cloud API)
        this.nvidiaCloud = new OpenAI({
            baseURL: "https://integrate.api.nvidia.com/v1",
            apiKey: config.ngcApiKey,
        });

        // NVIDIA NIM Client (Local)
        this.nvidiaLocal = new OpenAI({
            baseURL: "http://127.0.0.1:8000/v1",
            apiKey: 'not-needed',
        });
        
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
            'mistralai/mistral-medium-3.5-128b': { client: this.nvidiaCloud, provider: 'nvidia' },
            'nvidia/phi-3.5-vision-instruct': { client: this.nvidiaCloud, provider: 'nvidia' },
            'nvidia/nemotron-3-super-120b-a12b:free': { client: this.openRouterClients.nvidia, provider: 'openrouter' },
            'openai/gpt-oss-120b:free': { client: this.openRouterClients.gptOss, provider: 'openrouter' },
            'google/gemma-4-31b-it:free': { client: this.openRouterClients.gemma, provider: 'openrouter' },
            'meta-llama/llama-3.3-70b-instruct:free': { client: this.openRouterClients.llama, provider: 'openrouter' },
        };

        // Fallback Sequence for "Smart" mode or if current model fails
        this.fallbackSequence = [
            'gpt-4o',
            'llama-3.3-70b-versatile',
            'mistralai/mistral-medium-3.5-128b',
            'nvidia/phi-3.5-vision-instruct',
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
     * Generates embeddings for a given text.
     */
    async getEmbeddings(text) {
        if (!this.openai) {
            throw new Error("OpenAI client not configured for embeddings.");
        }
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error("Embedding Error:", error);
            throw error;
        }
    }

    /**
     * Sends code and context to AI for analysis or editing.
     * Implements a Planner/Coder split for complex tasks.
     */
    async askAI(prompt, currentFileContent, fileStructure, mode = 'chat', modelId = null, repoMap = null, relevantSnippets = []) {
        if (mode === 'chat' && (modelId === 'smart' || !modelId)) {
            return this.agenticWorkflow(prompt, currentFileContent, fileStructure, repoMap, relevantSnippets);
        }
        
        return this.executeDirect(prompt, currentFileContent, fileStructure, mode, modelId, repoMap, relevantSnippets);
    }

    async agenticWorkflow(prompt, currentFileContent, fileStructure, repoMap, relevantSnippets) {
        console.log("Starting Agentic Workflow (Planner -> Coder)");

        // 1. PLANNING PHASE
        const plannerModel = 'llama-3.3-70b-versatile'; 
        const plannerPrompt = `
            You are a Senior Software Architect. Your task is to plan the implementation for the following user request:
            TASK: "${prompt}"

            PROJECT CONTEXT:
            - File Structure: ${fileStructure}
            - Repository Map (Skeletal): ${JSON.stringify(repoMap, null, 2)}
            - Relevant Snippets: ${JSON.stringify(relevantSnippets)}

            GOAL:
            Identify exactly which files need to be created or modified. 
            Provide a step-by-step logical sequence for the changes.
            Identify any potential architectural side effects or risks.
            
            Return ONLY a structured plan.
        `;

        const plan = await this.executeDirect(plannerPrompt, currentFileContent, fileStructure, 'chat', plannerModel, repoMap, relevantSnippets);
        console.log("Plan generated.");

        // 2. EXECUTION PHASE
        const coderModel = 'gpt-4o';
        const coderPrompt = `
            You are an expert full-stack developer. Implement the following plan:
            
            USER REQUEST: "${prompt}"
            
            APPROVED ARCHITECTURAL PLAN:
            ${plan}
            
            INSTRUCTIONS:
            - Execute the plan precisely.
            - For each file change, use the following format:
            [FILE: path/to/file]
            \`\`\`language
            file content
            \`\`\`
            - If you need to run a command to verify or build, use:
            [CMD: command_to_run]
        `;

        const result = await this.executeDirect(coderPrompt, currentFileContent, fileStructure, 'chat', coderModel, repoMap, relevantSnippets);
        return `### 📋 ARCHITECTURAL PLAN\n${plan}\n\n---\n\n### 🚀 IMPLEMENTATION\n${result}`;
    }

    async executeDirect(prompt, currentFileContent, fileStructure, mode, modelId, repoMap, relevantSnippets) {
        const primaryModel = modelId || this.currentModel;
        
        const modelsToTry = primaryModel === 'smart' 
            ? this.fallbackSequence 
            : [primaryModel, ...this.fallbackSequence.filter(m => m !== primaryModel)];

        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const mapping = this.modelMapping[modelName];
                
                if (!mapping || !mapping.client) continue;

                const client = mapping.client;

                let systemPrompt = `
                    You are Helios, an AI Senior Software Engineer.
                    
                    PROJECT CONTEXT:
                    - Structure: ${fileStructure}
                `;

                if (repoMap) {
                    systemPrompt += `
                    - Repository Map: ${JSON.stringify(repoMap)}
                    `;
                }

                if (relevantSnippets && relevantSnippets.length > 0) {
                    systemPrompt += `
                    - Relevant Snippets: ${relevantSnippets.map(s => `File: ${s.filePath}\n${s.text}`).join('\n---\n')}
                    `;
                }

                systemPrompt += `
                    ACTIVE FILE:
                    ---
                    ${currentFileContent}
                    ---
                `;

                if (mode === 'chat') {
                    systemPrompt += `
                        GOAL: Help the user build their software. 
                        Propose file changes using:
                        [FILE: path/to/file]
                        \`\`\`
                        content
                        \`\`\`
                        Run commands using: [CMD: command]
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
                    return response.choices[0].message.content;
                }
            } catch (error) {
                console.error(`AI Error (${modelName}):`, error.message);
                lastError = error;
                continue;
            }
        }

        throw new Error(lastError?.message || 'All models failed');
    }
}

module.exports = AIService;
