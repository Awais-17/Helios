import { useEffect } from 'react';

const useInlineCompletions = (monaco, activeFile, projectStructure) => {
  useEffect(() => {
    if (!monaco || !activeFile) return;

    const provider = monaco.languages.registerInlineCompletionsProvider(
      { pattern: '**/*' },
      {
        provideInlineCompletions: async (model, position) => {
          const value = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          // Only trigger if we have some context and user stopped typing
          if (value.length < 10) return;

          try {
            const structureText = JSON.stringify(projectStructure, (key, value) => 
              key === 'children' ? undefined : value, 2);
            
            const suggestion = await window.electronAPI.askAI(
              "Continue this code", 
              value, 
              structureText, 
              'complete'
            );

            if (suggestion && suggestion.trim()) {
              return {
                items: [
                  {
                    insertText: suggestion,
                    range: {
                      startLineNumber: position.lineNumber,
                      startColumn: position.column,
                      endLineNumber: position.lineNumber,
                      endColumn: position.column,
                    },
                  },
                ],
              };
            }
          } catch (err) {
            console.error("Inline completion error:", err);
          }
          return { items: [] };
        },
        freeInlineCompletions: () => {},
      }
    );

    return () => provider.dispose();
  }, [monaco, activeFile, projectStructure]);
};

export default useInlineCompletions;
