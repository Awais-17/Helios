require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const AIService = require('./services/aiService');

console.log("Loading AI Service with keys:", {
    openai: !!process.env.OPENAI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    nvidia: !!process.env.OPENROUTER_NVIDIA_KEY,
    gptOss: !!process.env.OPENROUTER_GPT_OSS_KEY,
    gemma: !!process.env.OPENROUTER_GEMMA_KEY,
    llama: !!process.env.OPENROUTER_LLAMA_KEY
});

// Initialize the AI Service with ALL provided Keys
const aiService = new AIService({
    openaiApiKey: process.env.OPENAI_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    openRouterKeys: {
        nvidia: process.env.OPENROUTER_NVIDIA_KEY,
        gptOss: process.env.OPENROUTER_GPT_OSS_KEY,
        gemma: process.env.OPENROUTER_GEMMA_KEY,
        llama: process.env.OPENROUTER_LLAMA_KEY
    },
    defaultModel: 'gpt-4o'
});

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        title: "Helios | Powered by AI",
        backgroundColor: '#0d1117',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: true
        }
    });

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// --- IPC Handlers for File System ---

function getDirStructure(dirPath) {
    const files = fs.readdirSync(dirPath);
    const structure = [];

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            if (file === 'node_modules' || file === '.git' || file === 'dist') return;

            structure.push({
                name: file,
                type: 'directory',
                path: fullPath,
                children: getDirStructure(fullPath)
            });
        } else {
            structure.push({
                name: file,
                type: 'file',
                path: fullPath
            });
        }
    });

    return structure;
}

ipcMain.handle('get-project-structure', async (event, rootPath) => {
    try {
        const pathToShow = rootPath || (app.isReady() ? app.getAppPath() : process.cwd());
        return getDirStructure(pathToShow);
    } catch (error) {
        console.error("File Structure Error:", error);
        return [];
    }
});

ipcMain.handle('open-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (canceled || filePaths.length === 0) return null;

    const folderPath = filePaths[0];
    const structure = getDirStructure(folderPath);
    return { folderPath, structure };
});

ipcMain.handle('create-file', async (event, filePath, content = '') => {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        console.error("Create File Error:", error);
        throw error;
    }
});

ipcMain.handle('open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'All Files', extensions: ['*'] },
            { name: 'Code Files', extensions: ['js', 'ts', 'html', 'css', 'json', 'md', 'txt', 'py', 'go'] }
        ]
    });

    if (canceled || filePaths.length === 0) return null;

    const filePath = filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    return { content, fileName, filePath };
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error("Read File Error:", error);
        throw error;
    }
});

ipcMain.handle('save-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        console.error("Save File Error:", error);
        throw error;
    }
});

// --- IPC Handlers for AI ---

ipcMain.handle('ask-ai', async (event, { prompt, currentFileContent, fileStructure, mode, modelId }) => {
    try {
        return await aiService.askAI(prompt, currentFileContent, fileStructure, mode, modelId);
    } catch (error) {
        console.error("Main Process AI Error:", error);
        return `Error: ${error.message}`;
    }
});

ipcMain.handle('set-ai-model', async (event, modelId) => {
    try {
        aiService.setModel(modelId);
        return { success: true };
    } catch (error) {
        console.error("Set AI Model Error:", error);
        return { success: false, error: error.message };
    }
});

// --- App Lifecycle ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
