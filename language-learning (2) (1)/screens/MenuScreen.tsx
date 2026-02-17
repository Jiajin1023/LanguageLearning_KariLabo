import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { BookOpenIcon, PencilSquareIcon, ChatBubbleBottomCenterTextIcon, Bars3BottomLeftIcon, SpeakerWaveIcon } from '../components/Icons';
import type { UiLanguage, LearningLanguage, GameMode, CefRLevel } from '../types';
import { languageOptions as allLanguageOptions } from '../translations';

type Category = 'vocabulary' | 'grammar' | 'pronunciation';

type Translations = {
    title: string;
    subtitle: string;
    step1: string;
    iWantToLearn: string;
    myAppIsIn: string;
    step2: string;
    step3: string;
    vocabulary: string;
    grammar: string;
    pronunciation: string;
    step4: string;
    learn: string;
    learnItems: string;
    quiz: string;
    practice: string;
    practiceItems: string;
    quizItems: string;
    step5: string;
    quizLength: string;
    startSession: string;
    A1: string;
    A2: string;
    B1: string;
    B2: string;
    C1: string;
    All: string;
};

interface MenuScreenProps {
  onStart: (mode: Exclude<GameMode, 'menu'>, uiLang: UiLanguage, learningLang: LearningLanguage, count: number, level: CefRLevel) => void;
  selectedUiLanguage: UiLanguage;
  setSelectedUiLanguage: (lang: UiLanguage) => void;
  selectedLearningLanguage: LearningLanguage;
  setSelectedLearningLanguage: (lang: LearningLanguage) => void;
  selectedLevel: CefRLevel;
  setSelectedLevel: (level: CefRLevel) => void;
  t: Translations;
}

const LanguageButton: React.FC<{ lang: typeof allLanguageOptions[0]; isSelected: boolean; onClick: () => void; }> = ({ lang, isSelected, onClick }) => (
    <button onClick={onClick} className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`} aria-pressed={isSelected}>
        <lang.icon />
        <span className="font-semibold text-sm text-center">{lang.name}</span>
    </button>
);

const LevelButton: React.FC<{ level: { name: CefRLevel, description: string }; isSelected: boolean; onClick: () => void; }> = ({ level, isSelected, onClick }) => (
    <button onClick={onClick} className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`} aria-pressed={isSelected}>
        <span className="font-bold text-lg">{level.name}</span>
        <span className="text-xs text-slate-500">{level.description}</span>
    </button>
);


const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="animate-fade-in">
        <h3 className="font-semibold mb-3 text-lg text-slate-700 dark:text-slate-300">{title}</h3>
        {children}
    </div>
);

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStart, selectedUiLanguage, setSelectedUiLanguage, selectedLearningLanguage, setSelectedLearningLanguage, selectedLevel, setSelectedLevel, t }) => {
    const [category, setCategory] = useState<Category | null>(null);
    const [mode, setMode] = useState<'learn' | 'quiz' | null>(null);
    const [wordCount, setWordCount] = useState(10);
    
    const levelOptions: { name: CefRLevel, description: string }[] = [
        { name: 'A1', description: t.A1 },
        { name: 'A2', description: t.A2 },
        { name: 'B1', description: t.B1 },
        { name: 'B2', description: t.B2 },
        { name: 'C1', description: t.C1 },
        { name: 'All', description: t.All },
    ];

    const learnLimits = {
        vocabulary: { A1: 1000, A2: 1000, B1: 2000, B2: 3000, C1: 3000, All: 10000 },
        grammar: { A1: 200, A2: 200, B1: 300, B2: 400, C1: 400, All: 1500 },
        pronunciation: { A1: 1000, A2: 1000, B1: 2000, B2: 3000, C1: 3000, All: 10000 },
    };
    
    const quizConfig = {
        vocabulary: { min: 2, default: 10 },
        grammar: { min: 2, default: 10 },
        pronunciation: { min: 2, default: 10 },
    };

    const currentQuizMax = category ? learnLimits[category][selectedLevel] : 50;
    const currentLimits = category ? {
        min: quizConfig[category].min,
        max: currentQuizMax,
    } : { min: quizConfig.vocabulary.min, max: 50 };


    useEffect(() => {
        setCategory(null);
        setMode(null);
    }, [selectedLearningLanguage, selectedUiLanguage]);

    useEffect(() => {
        setMode(null);
        if (category) {
            setWordCount(quizConfig[category].default);
            // Pronunciation only has one mode, so we set it automatically
            if (category === 'pronunciation') {
                setMode('quiz');
            }
        }
    }, [category]);
    
    useEffect(() => {
        if (category && mode === 'quiz') {
             if (wordCount > currentLimits.max) setWordCount(currentLimits.max);
             if (wordCount < currentLimits.min) setWordCount(currentLimits.min);
        }
    }, [wordCount, category, mode, selectedLevel]);

    const handleStart = () => {
        if (!category || !mode) return;

        const finalMode: Exclude<GameMode, 'menu'> = category === 'pronunciation'
            ? 'pronunciation_practice'
            : `${category}_${mode}` as 'vocab_learn' | 'vocab_quiz' | 'grammar_learn' | 'grammar_quiz';
            
        const learnCount = learnLimits[category][selectedLevel];
        const count = mode === 'learn' ? learnCount : wordCount;
        onStart(finalMode, selectedUiLanguage, selectedLearningLanguage, count, selectedLevel);
    };

    const isStartable = category && mode;
    const currentLearnCount = category ? learnLimits[category][selectedLevel] : 0;


    return (
        <Card>
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold">{t.title}</h2>
                <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
            </div>

            <div className="space-y-6">
                <Section title={t.step1}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2 text-md">{t.iWantToLearn}</h4>
                            <div className="grid grid-cols-4 gap-2">
                               {allLanguageOptions.map(lang => <LanguageButton key={lang.code} lang={lang} isSelected={selectedLearningLanguage === lang.code} onClick={() => setSelectedLearningLanguage(lang.code)} />)}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-md">{t.myAppIsIn}</h4>
                            <div className="grid grid-cols-4 gap-2">
                               {allLanguageOptions.map(lang => <LanguageButton key={lang.code} lang={lang} isSelected={selectedUiLanguage === lang.code} onClick={() => setSelectedUiLanguage(lang.code)} />)}
                            </div>
                        </div>
                    </div>
                </Section>
                
                <Section title={t.step2}>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {levelOptions.map(level => (
                            <LevelButton
                                key={level.name}
                                level={level}
                                isSelected={selectedLevel === level.name}
                                onClick={() => setSelectedLevel(level.name)}
                            />
                        ))}
                    </div>
                </Section>
                
                <Section title={t.step3}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={() => setCategory('vocabulary')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${category === 'vocabulary' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                           <ChatBubbleBottomCenterTextIcon /> <span className="font-bold text-lg">{t.vocabulary}</span>
                        </button>
                        <button onClick={() => setCategory('grammar')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${category === 'grammar' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                           <Bars3BottomLeftIcon /> <span className="font-bold text-lg">{t.grammar}</span>
                        </button>
                         <button onClick={() => setCategory('pronunciation')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${category === 'pronunciation' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                           <SpeakerWaveIcon /> <span className="font-bold text-lg">{t.pronunciation}</span>
                        </button>
                    </div>
                </Section>

                {category && category !== 'pronunciation' && (
                    <Section title={t.step4}>
                         <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setMode('learn')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${mode === 'learn' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                               <BookOpenIcon className="h-8 w-8" /> <span className="font-bold text-lg">{t.learn}</span>
                               <span className="text-xs text-slate-500">{t.learnItems.replace('{count}', currentLearnCount.toString())}</span>
                            </button>
                            <button onClick={() => setMode('quiz')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${mode === 'quiz' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                               <PencilSquareIcon className="h-8 w-8" /> <span className="font-bold text-lg">{t.quiz}</span>
                               <span className="text-xs text-slate-500">{t.quizItems}</span>
                            </button>
                        </div>
                    </Section>
                )}
                
                {category && mode === 'quiz' && (
                     <Section title={t.step5.replace('quiz', category === 'pronunciation' ? 'practice' : 'quiz')}>
                        <div className="flex flex-col items-center">
                            <input
                                type="range"
                                min={currentLimits.min}
                                max={currentLimits.max}
                                value={wordCount}
                                onChange={(e) => setWordCount(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                            />
                            <div className="flex justify-between w-full text-xs text-slate-500 mt-1">
                                <span>{currentLimits.min}</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{t.quizLength.replace('{count}', wordCount.toString())}</span>
                                <span>{currentLimits.max}</span>
                            </div>
                        </div>
                    </Section>
                )}

                <div className="mt-8">
                     <button onClick={handleStart} disabled={!isStartable} className="w-full bg-green-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100">
                        {t.startSession}
                    </button>
                </div>
            </div>
        </Card>
    );
};