import { GoogleGenAI, Type } from "@google/genai";
import type { VocabularyWord, ExampleSentence, UiLanguage, LearningLanguage, Language, GrammarQuestion, GrammarRule, CefRLevel } from '../types';
import { languageMap } from "../translations";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SEEN_WORDS_KEY_PREFIX = 'lingoAppSeenWords_';

const getSeenWords = (learningLanguage: LearningLanguage): string[] => {
    try {
        const seenWords = localStorage.getItem(`${SEEN_WORDS_KEY_PREFIX}${learningLanguage}`);
        return seenWords ? JSON.parse(seenWords) : [];
    } catch (error) {
        console.error("Could not parse seen words from localStorage", error);
        return [];
    }
};

const addSeenWords = (newWords: string[], learningLanguage: LearningLanguage) => {
    try {
        const existingWords = getSeenWords(learningLanguage);
        const updatedWords = Array.from(new Set([...existingWords, ...newWords]));
        localStorage.setItem(`${SEEN_WORDS_KEY_PREFIX}${learningLanguage}`, JSON.stringify(updatedWords));
    } catch (error) {
        console.error("Could not save seen words to localStorage", error);
    }
};


export const fetchWordList = async (count: number, learningLanguage: LearningLanguage, uiLanguage: UiLanguage, level: CefRLevel): Promise<Omit<VocabularyWord, 'image'>[]> => {
    const learningLanguageName = languageMap[learningLanguage];
    const uiLanguageName = languageMap[uiLanguage];

    const vocabularyListSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                sourceWord: {
                    type: Type.STRING,
                    description: `A single common ${learningLanguageName} word (noun, verb, or adjective).`
                },
                englishWord: {
                    type: Type.STRING,
                    description: `The English translation of the ${learningLanguageName} word.`
                },
                targetWord: {
                    type: Type.STRING,
                    description: `The ${uiLanguageName} translation of the ${learningLanguageName} word.`
                },
            },
            required: ["sourceWord", "englishWord", "targetWord"],
        }
    };

    try {
        const seenWords = getSeenWords(learningLanguage);
        const exclusionPrompt = seenWords.length > 0 
            ? ` IMPORTANT: Do not include any of the following ${learningLanguageName} words in the list: ${seenWords.join(', ')}.` 
            : '';

        const levelPrompt = level === 'All'
            ? 'covering all CEFR levels from A1 to C1'
            : `appropriate for the CEFR ${level} level`;

        const prompt = `Generate a list of ${count} unique and common ${learningLanguageName} words, ${levelPrompt}. Include a mix of nouns, verbs, and adjectives. For each word, provide its English translation and its ${uiLanguageName} translation.${exclusionPrompt}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: vocabularyListSchema,
                temperature: 1.2,
            },
        });
        const jsonText = response.text.trim();
        const words: Omit<VocabularyWord, 'image'>[] = JSON.parse(jsonText);
        
        addSeenWords(words.map(w => w.sourceWord), learningLanguage);

        return words;
    } catch (error) {
        console.error("Error fetching new word list:", error);
        throw new Error("Failed to generate a new word list from the API.");
    }
};

export const fetchImageForWord = async (wordInEnglish: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A clean, simple, high-quality photograph or vector illustration of "${wordInEnglish}". The object should be on a plain white background, centered. No text or watermarks.`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        throw new Error("No image generated.");

    } catch (error) {
        console.error(`Error generating image for "${wordInEnglish}":`, error);
        throw new Error("Failed to generate an image.");
    }
}


export const fetchExampleSentence = async (sourceWord: string, learningLanguage: LearningLanguage, uiLanguage: UiLanguage): Promise<ExampleSentence> => {
    const learningLanguageName = languageMap[learningLanguage];
    const uiLanguageName = languageMap[uiLanguage];

    const sentenceSchema = {
        type: Type.OBJECT,
        properties: {
            sourceSentence: {
                type: Type.STRING,
                description: `A simple ${learningLanguageName} sentence using the provided word "${sourceWord}".`
            },
            translationSentence: {
                type: Type.STRING,
                description: `The ${uiLanguageName} translation of the ${learningLanguageName} sentence.`
            }
        },
        required: ["sourceSentence", "translationSentence"],
    }
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a simple ${learningLanguageName} example sentence for the word "${sourceWord}" and provide its ${uiLanguageName} translation.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: sentenceSchema,
            },
        });
        const jsonText = response.text.trim();
        const sentence = JSON.parse(jsonText);
        // The API might return keys from the schema description, let's normalize them
        return {
            sourceSentence: sentence.sourceSentence || sentence.germanSentence,
            translationSentence: sentence.translationSentence,
        }
    } catch (error) {
        console.error("Error fetching example sentence:", error);
        throw new Error("Failed to generate an example sentence from the API.");
    }
};

export const fetchHint = async (sourceWord: string, learningLanguage: LearningLanguage, uiLanguage: UiLanguage): Promise<string> => {
    const learningLanguageName = languageMap[learningLanguage];
    const uiLanguageName = languageMap[uiLanguage];

    const hintSchema = {
        type: Type.OBJECT,
        properties: {
            hint: {
                type: Type.STRING,
                description: `A short, one or two-word hint in ${uiLanguageName} that describes or relates to the ${learningLanguageName} word, without giving away the answer directly.`
            }
        },
        required: ["hint"],
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Give me a short, one or two-word hint in ${uiLanguageName} for the ${learningLanguageName} word "${sourceWord}". The hint should not be the direct translation.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: hintSchema,
            },
        });
        const jsonText = response.text.trim();
        const hintObject = JSON.parse(jsonText);
        return hintObject.hint;
    } catch (error) {
        console.error("Error fetching hint:", error);
        throw new Error("Failed to generate a hint from the API.");
    }
};

export const fetchGrammarRule = async (word: VocabularyWord, learningLanguage: LearningLanguage, uiLanguage: UiLanguage, level: CefRLevel): Promise<GrammarRule> => {
    const learningLanguageName = languageMap[learningLanguage];
    const uiLanguageName = languageMap[uiLanguage];

    const schema = {
        type: Type.OBJECT,
        properties: {
            rule: {
                type: Type.STRING,
                description: `A concise name for the primary grammar rule associated with the word (e.g., 'Noun Gender', 'Verb Conjugation', 'Adjective Declension').`
            },
            explanation: {
                type: Type.STRING,
                description: `A simple, one-to-two sentence explanation of this grammar rule in ${uiLanguageName}, specifically as it applies to the word.`
            },
            example: {
                type: Type.OBJECT,
                properties: {
                    sourceSentence: { type: Type.STRING, description: `A simple ${learningLanguageName} sentence demonstrating the rule with the word.` },
                    translationSentence: { type: Type.STRING, description: `The ${uiLanguageName} translation of the example sentence.` }
                },
                required: ["sourceSentence", "translationSentence"]
            }
        },
        required: ["rule", "explanation", "example"]
    };

    const levelPrompt = level === 'All'
        ? 'appropriate for a CEFR A1-C1 learner'
        : `appropriate for a CEFR ${level} learner`;

    const prompt = `For the ${learningLanguageName} word "${word.sourceWord}" (which means "${word.englishWord}" in English), identify the most important grammar rule associated with it, ${levelPrompt}. Provide a concise name for the rule, a brief explanation in ${uiLanguageName}, and a simple example sentence in ${learningLanguageName} with its ${uiLanguageName} translation.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching grammar rule:", error);
        throw new Error("Failed to generate a grammar rule.");
    }
};

export const fetchGrammarQuestion = async (word: VocabularyWord, learningLanguage: LearningLanguage, uiLanguage: UiLanguage, level: CefRLevel): Promise<GrammarQuestion> => {
    const learningLanguageName = languageMap[learningLanguage];
    const uiLanguageName = languageMap[uiLanguage];

    const schema = {
        type: Type.OBJECT,
        properties: {
            question: {
                type: Type.STRING,
                description: `A single ${learningLanguageName} sentence with a blank space ('___') where the word should fit. It must also include the ${uiLanguageName} translation in parentheses. Example: 'Ich ___ ins Kino. (I go to the cinema.)'`
            },
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `An array of 3-4 possible ${learningLanguageName} words to fill the blank. One must be the correct answer from the prompt, and the others should be plausible but incorrect.`
            },
            answer: {
                type: Type.STRING,
                description: `The correct ${learningLanguageName} word from the options array.`
            }
        },
        required: ["question", "options", "answer"],
    };

    const levelPrompt = level === 'All'
        ? 'at a CEFR level from A1 to C1'
        : `at the CEFR ${level} level`;

    const prompt = `Generate a multiple-choice grammar question for the ${learningLanguageName} word "${word.sourceWord}" (which means "${word.targetWord}" in ${uiLanguageName}). The question should be a sentence in ${learningLanguageName} with a blank space ('___') where the word should go. The sentence should test a common grammatical point related to the word ${levelPrompt} (e.g., verb conjugation, noun gender/case, adjective endings). Provide three plausible incorrect options and ensure the one correct answer is "${word.sourceWord}". Also, provide a translation of the question sentence in ${uiLanguageName} in parentheses after the question sentence.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        const result: GrammarQuestion = JSON.parse(jsonText);

        // Ensure the correct answer is one of the options
        if (!result.options.includes(result.answer)) {
            // Replace a random incorrect option with the correct answer
            const incorrectOptions = result.options.filter(opt => opt !== result.answer);
            const options = incorrectOptions.slice(0, result.options.length - 1);
            options.push(result.answer);
            // Shuffle options
            result.options = options.sort(() => Math.random() - 0.5);
        }
        
        return result;
    } catch (error) {
        console.error("Error fetching grammar question:", error);
        throw new Error("Failed to generate a grammar question.");
    }
};

export const fetchGrammarExplanation = async (
    question: GrammarQuestion,
    incorrectAnswer: string,
    learningLanguage: LearningLanguage,
    uiLanguage: UiLanguage
): Promise<string> => {
    const learningLanguageName = languageMap[learningLanguage];
    const uiLanguageName = languageMap[uiLanguage];

    const schema = {
        type: Type.OBJECT,
        properties: {
            explanation: {
                type: Type.STRING,
                description: `A simple, one-to-two sentence explanation in ${uiLanguageName} of the grammar rule tested. Explain why "${question.answer}" is correct and "${incorrectAnswer}" is incorrect for the sentence: "${question.question}".`
            }
        },
        required: ["explanation"]
    };

    const prompt = `A user was given a multiple-choice grammar question in ${learningLanguageName}.
    The sentence was: "${question.question}".
    The correct answer is "${question.answer}".
    The user incorrectly chose "${incorrectAnswer}".
    Please provide a simple, one-to-two sentence explanation in ${uiLanguageName} of the grammar rule they likely misunderstood. Focus on why the correct answer fits the sentence and the incorrect one does not.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.explanation;
    } catch (error) {
        console.error("Error fetching grammar explanation:", error);
        throw new Error("Failed to generate a grammar explanation.");
    }
};
