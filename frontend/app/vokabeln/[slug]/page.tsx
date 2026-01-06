'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  GraduationCap, 
  Trophy, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  Eye,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

// ============================================
// TYPEN
// ============================================
interface VocabItem {
  id: string;
  arabic: string;
  german: string;
  past_tense?: string;
  present_tense?: string;
  root?: string;
  gender?: string;
  plural?: string;
  example_arabic?: string;
  example_german?: string;
}

interface VocabularyList {
  id: string;
  title: string;
  title_arabic?: string;
  description?: string;
  word_type: string;
  level: string;
  item_count: number;
  items: VocabItem[];
}

interface QuizQuestion {
  id: string;
  arabic: string;
  german: string;
  options: string[];
  correctAnswer: string;
}

interface QuizResult {
  total: number;
  correct: number;
  percentage: number;
  grade: string;
  answers: { question: QuizQuestion; userAnswer: string; isCorrect: boolean }[];
}

// ============================================
// HILFSFUNKTIONEN
// ============================================
const calculateGrade = (percentage: number): string => {
  if (percentage >= 92) return "1 (Sehr gut)";
  if (percentage >= 81) return "2 (Gut)";
  if (percentage >= 67) return "3 (Befriedigend)";
  if (percentage >= 50) return "4 (Ausreichend)";
  if (percentage >= 30) return "5 (Mangelhaft)";
  return "6 (Ungenügend)";
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================
// KARTEIKARTEN-KOMPONENTE
// ============================================
function FlashcardLearning({ items, wordType }: { items: VocabItem[]; wordType: string }) {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState<"ar-de" | "de-ar">("ar-de");

  useEffect(() => {
    setVocabList(shuffleArray(items));
    setCurrentIndex(0);
    setIsFlipped(false);
    setLearned(new Set());
  }, [items]);

  if (vocabList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Keine Vokabeln in dieser Liste.</p>
      </div>
    );
  }

  const currentVocab = vocabList[currentIndex];
  const progress = (learned.size / vocabList.length) * 100;

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < vocabList.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }, 150);
  };

  const markAsLearned = () => {
    setLearned(new Set([...learned, currentVocab.id]));
    handleNext();
  };

  const resetProgress = () => {
    setLearned(new Set());
    setVocabList(shuffleArray(vocabList));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="space-y-6">
      {/* Fortschritt */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>📊 Fortschritt: {learned.size} / {vocabList.length} gelernt</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Richtung */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => { setDirection("ar-de"); setIsFlipped(false); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            direction === "ar-de" 
              ? "bg-amber-500 text-white" 
              : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          <span className="font-arabic" dir="rtl">عربي</span> → Deutsch
        </button>
        <button
          onClick={() => { setDirection("de-ar"); setIsFlipped(false); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            direction === "de-ar" 
              ? "bg-amber-500 text-white" 
              : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          Deutsch → <span className="font-arabic" dir="rtl">عربي</span>
        </button>
      </div>

      {/* Karteikarte */}
      <div 
        className="relative w-full min-h-[320px] cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Vorderseite */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-sm text-slate-400 mb-4">
              📚 Karte {currentIndex + 1} von {vocabList.length}
              {learned.has(currentVocab.id) && (
                <span className="ml-2 text-emerald-400">✓ Gelernt</span>
              )}
            </p>

            <div className="text-6xl mb-6">
              {wordType === 'verb' ? '⚡' : wordType === 'particle' ? '🔗' : '📦'}
            </div>

            <div className="text-center mb-6">
              {direction === "ar-de" ? (
                <p className="font-arabic text-4xl text-white" dir="rtl">
                  {currentVocab.arabic}
                </p>
              ) : (
                <p className="text-2xl text-white font-semibold">
                  {currentVocab.german}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-400 mt-4">
              <RefreshCw className="h-5 w-5 animate-pulse" />
              <span>Klicken zum Umdrehen</span>
            </div>
          </div>

          {/* Rückseite */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-8 flex flex-col items-center justify-center"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <p className="text-sm text-amber-400 mb-4">✨ Lösung</p>

            <div className="text-6xl mb-6">
              {wordType === 'verb' ? '⚡' : wordType === 'particle' ? '🔗' : '📦'}
            </div>

            <div className="text-center mb-4">
              {direction === "ar-de" ? (
                <>
                  <p className="text-2xl text-amber-400 font-bold mb-2">
                    {currentVocab.german}
                  </p>
                  <p className="font-arabic text-xl text-slate-300" dir="rtl">
                    {currentVocab.arabic}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-arabic text-4xl text-amber-400 mb-2" dir="rtl">
                    {currentVocab.arabic}
                  </p>
                  <p className="text-xl text-slate-300">
                    {currentVocab.german}
                  </p>
                </>
              )}
            </div>

            {currentVocab.root && (
              <p className="text-sm text-slate-400 mt-2">
                <span className="font-arabic" dir="rtl">جذر: {currentVocab.root}</span>
              </p>
            )}

            <div className="flex items-center gap-2 text-slate-400 mt-4">
              <RefreshCw className="h-5 w-5" />
              <span>Klicken zum Zurückdrehen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-50 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück
        </button>

        <div className="flex gap-2">
          <button
            onClick={resetProgress}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Neu starten
          </button>
          <button
            onClick={markAsLearned}
            disabled={learned.has(currentVocab.id)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50 transition-all"
          >
            <CheckCircle className="h-4 w-4" />
            Gelernt ✓
          </button>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 transition-all"
        >
          Weiter
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// QUIZ-KOMPONENTE
// ============================================
function VocabQuiz({ items }: { items: VocabItem[] }) {
  const [quizState, setQuizState] = useState<"setup" | "active" | "result">("setup");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ question: QuizQuestion; userAnswer: string; isCorrect: boolean }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizDirection, setQuizDirection] = useState<"ar-de" | "de-ar">("ar-de");

  const generateQuestions = () => {
    const shuffled = shuffleArray(items);
    const selectedItems = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    
    const generated: QuizQuestion[] = selectedItems.map(item => {
      const otherItems = items.filter(v => v.id !== item.id);
      const wrongAnswers = shuffleArray(otherItems)
        .slice(0, 3)
        .map(v => quizDirection === "ar-de" ? v.german : v.arabic);
      
      const correctAnswer = quizDirection === "ar-de" ? item.german : item.arabic;
      
      return {
        id: item.id,
        arabic: item.arabic,
        german: item.german,
        options: shuffleArray([correctAnswer, ...wrongAnswers]),
        correctAnswer,
      };
    });

    return generated;
  };

  const startQuiz = () => {
    const newQuestions = generateQuestions();
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setResult(null);
    setQuizState("active");
  };

  const confirmAnswer = () => {
    if (!selectedAnswer) return;
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const newAnswer = { question: currentQuestion, userAnswer: selectedAnswer, isCorrect };
    setAnswers(prev => [...prev, newAnswer]);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      const allAnswers = [...answers];
      if (allAnswers.length < questions.length) {
        const currentQuestion = questions[currentIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        allAnswers.push({ question: currentQuestion, userAnswer: selectedAnswer!, isCorrect });
      }
      
      const correctCount = allAnswers.filter(a => a.isCorrect).length;
      const percentage = Math.round((correctCount / questions.length) * 100);
      
      setResult({
        total: questions.length,
        correct: correctCount,
        percentage,
        grade: calculateGrade(percentage),
        answers: allAnswers
      });
      setQuizState("result");
    }
  };

  const resetQuiz = () => {
    setQuizState("setup");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setResult(null);
  };

  // Setup
  if (quizState === "setup") {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Vokabel-Quiz</h3>
          <p className="text-slate-400">{items.length} Vokabeln verfügbar</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Abfragerichtung</label>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setQuizDirection("ar-de")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                quizDirection === "ar-de" 
                  ? "bg-violet-500 text-white" 
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="font-arabic" dir="rtl">عربي</span> → Deutsch
            </button>
            <button
              onClick={() => setQuizDirection("de-ar")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                quizDirection === "de-ar" 
                  ? "bg-violet-500 text-white" 
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              Deutsch → <span className="font-arabic" dir="rtl">عربي</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Anzahl der Fragen</label>
          <div className="flex justify-center gap-2 flex-wrap">
            {[5, 10, 15, 20].filter(n => n <= items.length).map(count => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  questionCount === count 
                    ? "bg-violet-500 text-white" 
                    : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={startQuiz}
          disabled={items.length < 4}
          className="flex items-center justify-center gap-2 px-8 py-3 mx-auto bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all"
        >
          <Play className="h-4 w-4" />
          Quiz starten
        </button>
        
        {items.length < 4 && (
          <p className="text-sm text-red-400 mt-2">Mindestens 4 Vokabeln erforderlich</p>
        )}
      </div>
    );
  }

  // Ergebnis
  if (quizState === "result" && result) {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
                result.percentage >= 50 
                  ? "bg-gradient-to-br from-emerald-500 to-green-600" 
                  : "bg-gradient-to-br from-red-500 to-rose-600"
              }`}>
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Quiz beendet!</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-3xl font-bold text-white">{result.correct}/{result.total}</p>
              <p className="text-sm text-slate-400">Richtig</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-3xl font-bold text-amber-400">{result.percentage}%</p>
              <p className="text-sm text-slate-400">Erfolgsquote</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-2xl font-bold text-violet-400">{result.grade}</p>
              <p className="text-sm text-slate-400">Note</p>
            </div>
          </div>

          <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-6">
            <div 
              className={`h-full transition-all duration-500 ${
                result.percentage >= 50 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
              }`}
              style={{ width: `${result.percentage}%` }}
            />
          </div>

          <button
            onClick={resetQuiz}
            className="flex items-center justify-center gap-2 px-8 py-3 mx-auto bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Neues Quiz
          </button>
        </div>

        {/* Antworten-Übersicht */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h4 className="font-semibold text-white">Deine Antworten</h4>
          </div>
          <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
            {result.answers.map((answer, index) => (
              <div key={index} className={`p-4 ${answer.isCorrect ? "bg-emerald-500/5" : "bg-red-500/5"}`}>
                <div className="flex items-start gap-3">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-arabic text-lg text-white" dir="rtl">{answer.question.arabic}</p>
                    <p className="text-sm text-slate-400">{answer.question.german}</p>
                    {!answer.isCorrect && (
                      <p className="text-sm text-red-400 mt-1">Deine Antwort: {answer.userAnswer}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Aktives Quiz
  const currentQuestion = questions[currentIndex];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Frage {currentIndex + 1} von {questions.length}</span>
          <span>{Math.round((currentIndex / questions.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(currentIndex / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-6 text-center">
        <p className="text-sm text-slate-400 mb-2">Übersetze:</p>
        {quizDirection === "ar-de" ? (
          <p className="font-arabic text-3xl text-white" dir="rtl">
            {currentQuestion.arabic}
          </p>
        ) : (
          <p className="text-2xl text-white">
            {currentQuestion.german}
          </p>
        )}
      </div>

      <div className="grid gap-3 mb-6">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentQuestion.correctAnswer;
          const showCorrect = showFeedback && isCorrect;
          const showWrong = showFeedback && isSelected && !isCorrect;
          
          return (
            <button
              key={index}
              onClick={() => !showFeedback && setSelectedAnswer(option)}
              disabled={showFeedback}
              className={`p-4 rounded-xl border-2 transition-all ${
                quizDirection === "ar-de" ? "text-left" : "text-right"
              } ${
                showCorrect
                  ? "border-emerald-500 bg-emerald-500/10"
                  : showWrong
                  ? "border-red-500 bg-red-500/10"
                  : isSelected
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-white/10 hover:border-white/30 bg-white/5"
              }`}
              dir={quizDirection === "de-ar" ? "rtl" : "ltr"}
            >
              <span className={`${quizDirection === "de-ar" ? "font-arabic text-lg" : ""} ${
                showCorrect ? "text-emerald-400" : showWrong ? "text-red-400" : "text-white"
              }`}>
                {option}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={resetQuiz}
          className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
          Abbrechen
        </button>
        {!showFeedback ? (
          <button 
            onClick={confirmAnswer} 
            disabled={!selectedAnswer}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all"
          >
            Bestätigen
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="px-6 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-medium hover:from-violet-600 hover:to-purple-600 transition-all"
          >
            {currentIndex < questions.length - 1 ? "Weiter" : "Ergebnis"}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// VOKABELLISTE
// ============================================
function VocabList({ items, wordType }: { items: VocabItem[]; wordType: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredItems = items.filter(item => 
    item.arabic.includes(searchTerm) || 
    item.german.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <input
          type="text"
          placeholder="🔍 Suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <p className="text-sm text-slate-400">{filteredItems.length} Vokabeln</p>
        </div>
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-center">
                <p className="font-arabic text-xl text-amber-400" dir="rtl">
                  {item.arabic}
                </p>
                <p className="text-white">{item.german}</p>
              </div>
              {item.root && (
                <p className="text-sm text-slate-500 mt-1 font-arabic" dir="rtl">
                  جذر: {item.root}
                </p>
              )}
              {wordType === 'noun' && item.gender && (
                <p className="text-xs text-slate-500 mt-1">
                  {item.gender === 'm' ? 'maskulin' : 'feminin'}
                  {item.plural && ` | Plural: ${item.plural}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HAUPTKOMPONENTE
// ============================================
export default function VocabularyStudentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [vocabularyList, setVocabularyList] = useState<VocabularyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"learn" | "quiz" | "list">("learn");

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/vocabulary/lists/slug/${slug}`);
        if (!res.ok) throw new Error('Vokabelliste nicht gefunden');
        const data = await res.json();
        setVocabularyList(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !vocabularyList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Fehler beim Laden'}</p>
          <button
            onClick={() => router.back()}
            className="text-amber-400 hover:text-amber-300"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  const wordTypeIcon = vocabularyList.word_type === 'verb' ? '⚡' : vocabularyList.word_type === 'particle' ? '🔗' : '📦';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl">
              {wordTypeIcon}
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{vocabularyList.title}</h1>
              {vocabularyList.title_arabic && (
                <p className="text-sm text-slate-400 font-arabic" dir="rtl">{vocabularyList.title_arabic}</p>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm text-slate-400">{vocabularyList.item_count} Vokabeln</p>
              <p className="text-xs text-slate-500 uppercase">{vocabularyList.level}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Titel */}
        <div className="text-center mb-8">
          <p className="mb-2 font-arabic text-amber-400 text-lg" dir="rtl">دَفْتَرُ المُفْرَداتِ</p>
          <h2 className="text-3xl font-bold text-white mb-2">Vokabelheft</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Lerne die Vokabeln mit Karteikarten oder teste dein Wissen im Quiz.
          </p>
        </div>

        {/* Modus-Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setMode("learn")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "learn" ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Lernen
            </button>
            <button
              onClick={() => setMode("quiz")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "quiz" ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Quiz
            </button>
            <button
              onClick={() => setMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "list" ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4" />
              Liste
            </button>
          </div>
        </div>

        {/* Content */}
        {mode === "learn" && (
          <FlashcardLearning items={vocabularyList.items} wordType={vocabularyList.word_type} />
        )}
        {mode === "quiz" && (
          <VocabQuiz items={vocabularyList.items} />
        )}
        {mode === "list" && (
          <VocabList items={vocabularyList.items} wordType={vocabularyList.word_type} />
        )}
      </div>

      <style jsx global>{`
        .font-arabic {
          font-family: 'Noto Sans Arabic', 'Amiri', sans-serif;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}

