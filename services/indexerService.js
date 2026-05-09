const path = require('path');
const fs = require('fs');
const Parser = require('web-tree-sitter');

class IndexerService {
    constructor() {
        this.parser = null;
        this.languages = {};
        this.isInitialized = false;
        this.vectorIndex = null;
        this.chunkMetadata = []; // Stores { id, filePath, text }
        this.embeddingDim = 1536; // Default for text-embedding-3-small
    }

    async init() {
        if (this.isInitialized) return;
        try {
            const wasmPath = path.join(__dirname, '..', 'node_modules', 'web-tree-sitter', 'web-tree-sitter.wasm');
            await Parser.init({
                locateFile: () => wasmPath
            });
            this.parser = new Parser();
            this.isInitialized = true;
            console.log("Tree-sitter initialized.");

            // Try to load native vector index, but don't crash if it fails
            try {
                const { HierarchicalNSW } = require('hnswlib-node');
                this.vectorIndex = new HierarchicalNSW('l2', this.embeddingDim);
                this.vectorIndex.initIndex(5000);
                console.log("Vector Index (HNSW) initialized.");
            } catch (vError) {
                console.warn("HNSW Vector Index failed to load. Vector search will be disabled.", vError.message);
                this.vectorIndex = null;
            }
        } catch (error) {
            console.error("Failed to initialize IndexerService:", error);
            throw error;
        }
    }

    // Update search to be safe if vectorIndex is null
    async search(query, getEmbeddings, k = 5) {
        if (!this.vectorIndex || this.chunkMetadata.length === 0) {
            console.log("Vector search is disabled or index is empty.");
            return [];
        }
        // ... rest of method

    async loadLanguage(langName) {
        if (this.languages[langName]) return this.languages[langName];

        const wasmPath = path.join(__dirname, '..', 'node_modules', 'tree-sitter-wasms', 'out', `tree-sitter-${langName}.wasm`);
        if (!fs.existsSync(wasmPath)) {
            console.warn(`WASM for language ${langName} not found at ${wasmPath}`);
            return null;
        }

        try {
            const lang = await Parser.Language.load(wasmPath);
            this.languages[langName] = lang;
            return lang;
        } catch (error) {
            console.error(`Failed to load language ${langName}:`, error);
            return null;
        }
    }

    getLanguageForFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.js':
            case '.jsx':
            case '.mjs':
            case '.cjs':
                return 'javascript';
            case '.ts':
                return 'typescript';
            case '.tsx':
                return 'tsx';
            case '.py':
                return 'python';
            case '.go':
                return 'go';
            case '.rs':
                return 'rust';
            case '.java':
                return 'java';
            case '.cpp':
            case '.cc':
            case '.cxx':
            case '.h':
            case '.hpp':
                return 'cpp';
            case '.c':
                return 'c';
            case '.cs':
                return 'c_sharp';
            case '.rb':
                return 'ruby';
            case '.php':
                return 'php';
            default:
                return null;
        }
    }

    async parseFile(filePath) {
        const langName = this.getLanguageForFile(filePath);
        if (!langName) return null;

        const lang = await this.loadLanguage(langName);
        if (!lang) return null;

        this.parser.setLanguage(lang);

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const tree = this.parser.parse(content);
            return { tree, content, langName };
        } catch (error) {
            console.error(`Failed to parse file ${filePath}:`, error);
            return null;
        }
    }

    extractSkeletalView(tree, langName) {
        const rootNode = tree.rootNode;
        const lang = this.languages[langName];
        if (!lang) return "";

        const queries = {
            javascript: `
                (export_statement) @export
                (class_declaration name: (identifier) @class_name) @class
                (function_declaration name: (identifier) @func_name) @func
                (method_definition name: (property_identifier) @method_name) @method
            `,
            typescript: `
                (export_statement) @export
                (class_declaration name: (identifier) @class_name) @class
                (function_declaration name: (identifier) @func_name) @func
                (method_definition name: (property_identifier) @method_name) @method
                (interface_declaration name: (identifier) @interface_name) @interface
                (type_alias_declaration name: (identifier) @type_name) @type
            `,
            tsx: `
                (export_statement) @export
                (class_declaration name: (identifier) @class_name) @class
                (function_declaration name: (identifier) @func_name) @func
                (method_definition name: (property_identifier) @method_name) @method
                (interface_declaration name: (identifier) @interface_name) @interface
                (type_alias_declaration name: (identifier) @type_name) @type
            `
        };

        const queryString = queries[langName] || queries['javascript'];
        try {
            const query = lang.query(queryString);
            const captures = query.captures(rootNode);

            const skeletalLines = [];
            const processedNodes = new Set();

            captures.forEach(capture => {
                if (processedNodes.has(capture.node)) return;
                const text = capture.node.text.split('\n')[0];
                skeletalLines.push(text);
                processedNodes.add(capture.node);
            });

            return skeletalLines.join('\n');
        } catch (error) {
            console.error(`Query error for ${langName}:`, error);
            return "";
        }
    }

    async generateRepoMap(rootPath) {
        const map = {};
        const walk = async (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
                    await walk(fullPath);
                } else {
                    const langName = this.getLanguageForFile(fullPath);
                    if (langName) {
                        const relativePath = path.relative(rootPath, fullPath);
                        const result = await this.parseFile(fullPath);
                        if (result) {
                            const skeletalView = this.extractSkeletalView(result.tree, result.langName);
                            map[relativePath] = skeletalView;
                        }
                    }
                }
            }
        };

        await walk(rootPath);
        return map;
    }

    async indexProjectVectors(rootPath, getEmbeddings) {
        this.chunkMetadata = [];
        this.vectorIndex = new HierarchicalNSW('l2', this.embeddingDim);
        this.vectorIndex.initIndex(5000); 

        const walk = async (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
                    await walk(fullPath);
                } else {
                    const ext = path.extname(fullPath).toLowerCase();
                    if (['.js', '.jsx', '.ts', '.tsx', '.py', '.md', '.txt', '.html', '.css'].includes(ext)) {
                        try {
                            const content = fs.readFileSync(fullPath, 'utf-8');
                            if (!content.trim()) continue;

                            const chunks = this.chunkText(content, 1000); 
                            for (let i = 0; i < chunks.length; i++) {
                                const chunkText = `File: ${path.relative(rootPath, fullPath)}\n\n${chunks[i]}`;
                                const embedding = await getEmbeddings(chunkText);
                                const id = this.chunkMetadata.length;
                                this.vectorIndex.addPoint(embedding, id);
                                this.chunkMetadata.push({
                                    id,
                                    filePath: path.relative(rootPath, fullPath),
                                    text: chunks[i]
                                });
                            }
                        } catch (err) {
                            console.error(`Error processing ${fullPath}:`, err);
                        }
                    }
                }
            }
        };

        await walk(rootPath);
        console.log(`Vector indexing complete: ${this.chunkMetadata.length} chunks indexed.`);
    }

    chunkText(text, chunkSize) {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, Math.min(i + chunkSize, text.length)));
        }
        return chunks;
    }

    async search(query, getEmbeddings, k = 5) {
        if (!this.vectorIndex || this.chunkMetadata.length === 0) return [];
        try {
            const queryEmbedding = await getEmbeddings(query);
            const result = this.vectorIndex.searchKnn(queryEmbedding, k);
            return result.neighbors.map((neighborId, index) => {
                const metadata = this.chunkMetadata[neighborId];
                return { ...metadata, score: result.distances[index] };
            });
        } catch (error) {
            console.error("Vector search error:", error);
            return [];
        }
    }
}

module.exports = IndexerService;
