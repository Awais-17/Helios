const { contextBridge, ipcRenderer } = require('electron');

/**
 * The contextBridge ensures that the Renderer process can communicate 
 * with the Main process securely, only exposing a set of predefined functions.
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // File System Operations
    getProjectStructure: (rootPath) => ipcRenderer.invoke('get-project-structure', rootPath),
    openFolder: () => ipcRenderer.invoke('open-folder'),
    openFile: () => ipcRenderer.invoke('open-file'),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
    createFile: (filePath, content) => ipcRenderer.invoke('create-file', filePath, content),

    // Indexing
    indexProject: (rootPath) => ipcRenderer.invoke('index-project', rootPath),

    // AI Communication
    askAI: (prompt, currentFileContent, fileStructure, mode = 'chat', modelId = null, repoMap = null) => 
        ipcRenderer.invoke('ask-ai', { prompt, currentFileContent, fileStructure, mode, modelId, repoMap }),
    setAIModel: (modelId) => ipcRenderer.invoke('set-ai-model', modelId),

    // Terminal
    runTerminalCommand: (command, cwd) => ipcRenderer.invoke('run-terminal-command', command, cwd),

    // App Info
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
