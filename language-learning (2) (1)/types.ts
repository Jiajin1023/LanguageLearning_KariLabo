
export interface VocabularyWord {
  sourceWord: string; // The word in the language being learned
  targetWord: string; // The translation in the UI language
  englishWord: string; // The English translation, always needed for image generation
  image?: string; // base64 string for the generated image
}

export interface ExampleSentence {
  sourceSentence: string;
  translationSentence: string;
}

export interface GrammarQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface GrammarRule {
    rule: string;
    explanation: string;
    example: ExampleSentence;
}


export enum FeedbackState {
  NONE,
  CORRECT,
  INCORRECT,
}

export type GameMode = 'menu' | 'vocab_learn' | 'vocab_quiz' | 'grammar_learn' | 'grammar_quiz' | 'pronunciation_practice';
export type Language = 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'ar';
export type UiLanguage = Language;
export type LearningLanguage = Language;
export type CefRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'All';