import React, { useState, useCallback, useMemo } from 'react';
import { MenuScreen } from './screens/MenuScreen';
import { LearningScreen } from './screens/LearningScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { GrammarLearnScreen } from './screens/GrammarLearnScreen';
import { GrammarScreen } from './screens/GrammarScreen';
import { PronunciationScreen } from './screens/PronunciationScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Card } from './components/Card';
import { fetchWordList } from './services/geminiService';
import type { GameMode, UiLanguage, LearningLanguage, VocabularyWord, CefRLevel } from './types';
import { getTranslations, languageMap } from './translations';

const App: React.FC = () => {
    const [gameMode, setGameMode] = useState<GameMode | 'loading' | 'results'>('menu');
    const [uiLanguage, setUiLanguage] = useState<UiLanguage>('en');
    const [learningLanguage, setLearningLanguage] = useState<LearningLanguage>('de');
    const [level, setLevel] = useState<CefRLevel>('A1');
    const [wordList, setWordList] = useState<VocabularyWord[]>([]);
    const [wordCount, setWordCount] = useState(10);
    const [finalScore, setFinalScore] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const t = useMemo(() => getTranslations(uiLanguage), [uiLanguage]);

    const handleStartSession = useCallback(async (
        mode: Exclude<GameMode, 'menu'>,
        selectedUiLang: UiLanguage,
        selectedLearnLang: LearningLanguage,
        count: number,
        selectedLevel: CefRLevel
    ) => {
        setGameMode('loading');
        setError(null);
        setUiLanguage(selectedUiLang);
        setLearningLanguage(selectedLearnLang);
        setWordCount(count);
        setLevel(selectedLevel);
        try {
            const words = await fetchWordList(count, selectedLearnLang, selectedUiLang, selectedLevel);
            setWordList(words.map(w => ({...w})));
            setGameMode(mode);
        } catch (err) {
            setError(t.app.error);
            console.error(err);
            setGameMode('menu');
        }
    }, [t]);

    const handleFinishQuiz = (score: number) => {
        setFinalScore(score);
        setGameMode('results');
    };

    const handleRestart = () => {
        setGameMode('menu');
        setWordList([]);
        setFinalScore(0);
        setError(null);
    };

    const renderContent = () => {
        const backToMenuText = t.app.backToMenu;
        switch (gameMode) {
            case 'loading':
                return (
                    <Card>
                        <div className="h-64 flex flex-col items-center justify-center space-y-4">
                            <LoadingSpinner />
                            <p className="text-slate-500">{t.app.loading}</p>
                        </div>
                    </Card>
                );
            case 'vocab_learn':
                return <LearningScreen words={wordList} onFinish={handleRestart} learningLanguage={learningLanguage} t={t.learning} backToMenuText={backToMenuText} />;
            case 'vocab_quiz':
                return <QuizScreen words={wordList} uiLanguage={uiLanguage} learningLanguage={learningLanguage} onFinish={handleFinishQuiz} onBackToMenu={handleRestart} t={t.quiz} backToMenuText={backToMenuText} />;
            case 'grammar_learn':
                return <GrammarLearnScreen words={wordList} onFinish={handleRestart} learningLanguage={learningLanguage} uiLanguage={uiLanguage} level={level} t={t.grammarLearn} backToMenuText={backToMenuText}/>;
            case 'grammar_quiz':
                return <GrammarScreen words={wordList} uiLanguage={uiLanguage} learningLanguage={learningLanguage} onFinish={handleFinishQuiz} onBackToMenu={handleRestart} level={level} t={t.grammarQuiz} backToMenuText={backToMenuText} />;
            case 'pronunciation_practice':
                 return <PronunciationScreen words={wordList} learningLanguage={learningLanguage} onFinish={handleFinishQuiz} onBackToMenu={handleRestart} t={t.pronunciation} backToMenuText={backToMenuText} />;
            case 'results':
                return <ResultsScreen score={finalScore} total={wordCount} onRestart={handleRestart} t={t.results} />;
            case 'menu':
            default:
                return (
                    <MenuScreen
                        onStart={handleStartSession}
                        selectedUiLanguage={uiLanguage}
                        setSelectedUiLanguage={setUiLanguage}
                        selectedLearningLanguage={learningLanguage}
                        setSelectedLearningLanguage={setLearningLanguage}
                        selectedLevel={level}
                        setSelectedLevel={setLevel}
                        t={t.menu}
                    />
                );
        }
    };
    
    const appTagline = t.app.tagline.replace('{language}', languageMap[learningLanguage] || 'a new language');

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <header className="text-center mb-8">
                <h1 className="text-5xl font-extrabold text-blue-600 dark:text-blue-400">{t.app.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{appTagline}</p>
            </header>
             <main className="w-full max-w-2xl">
                 {error && gameMode === 'menu' && (
                    <Card className="bg-red-100 dark:bg-red-900 border-red-500 mb-4">
                        <p className="text-red-700 dark:text-red-200 font-semibold">{error}</p>
                    </Card>
                )}
                {renderContent()}
            </main>
             <footer className="mt-8 text-center text-slate-500">
                <p>{t.app.footer}</p>
            </footer>
        </div>
    );
};

export default App;