"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  content: string;
  options: string[];
}

interface QuizState {
  questions: Question[];
  answers: Record<string, string>;
  currentIndex: number;
  isQuizEnabled: boolean;
  hasCompleted: boolean;
}

export default function QuizPage() {
  const [state, setState] = useState<QuizState>({
    questions: [],
    answers: {},
    currentIndex: 0,
    isQuizEnabled: false,
    hasCompleted: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 检查答题是否开启
      const { data: config } = await supabase
        .from("quiz_config")
        .select("*")
        .single();

      if (!config || !config.is_enabled) {
        setState(prev => ({ ...prev, isQuizEnabled: false, hasCompleted: false }));
        setLoading(false);
        return;
      }

      // 检查是否已答题
      const { data: existingQuiz } = await supabase
        .from("quizzes")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingQuiz) {
        setState(prev => ({ ...prev, isQuizEnabled: true, hasCompleted: true }));
        setLoading(false);
        return;
      }

      // 获取所有未删除的题目
      const { data: allQuestions } = await supabase
        .from("questions")
        .select("id")
        .eq("is_deleted", false);

      if (!allQuestions || allQuestions.length === 0) {
        setLoading(false);
        return;
      }

      // 随机抽取题目
      const questionCount = Math.min(config.question_count, allQuestions.length);
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selectedIds = shuffled.slice(0, questionCount).map(q => q.id);

      // 获取题目详情
      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .in("id", selectedIds);

      setState(prev => ({
        ...prev,
        questions: questions || [],
        answers: {},
        currentIndex: 0,
        isQuizEnabled: true,
        hasCompleted: false,
      }));
    } catch (error) {
      console.error("Error initializing quiz:", error);
      toast({
        title: "加载失败",
        description: "无法加载答题页面",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));
  };

  const handleNext = () => {
    if (state.currentIndex < state.questions.length - 1) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    }
  };

  const handlePrevious = () => {
    if (state.currentIndex > 0) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    }
  };

  const handleSubmit = async () => {
    // 检查是否所有题目都已作答
    const unansweredQuestions = state.questions.filter(
      q => !state.answers[q.id]
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: "请完成所有题目",
        description: `还有 ${unansweredQuestions.length} 道题目未作答`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 获取正确答案
      const { data: correctAnswers } = await supabase
        .from("questions")
        .select("id, correct_answer")
        .in("id", state.questions.map(q => q.id));

      if (!correctAnswers) {
        throw new Error("无法获取正确答案");
      }

      // 计算得分
      let correctCount = 0;
      const answerMap = correctAnswers.reduce((acc, q) => {
        acc[q.id] = q.correct_answer;
        return acc;
      }, {} as Record<string, string>);

      state.questions.forEach(q => {
        if (state.answers[q.id] === answerMap[q.id]) {
          correctCount++;
        }
      });

      // 保存答题记录
      const { error } = await supabase.from("quizzes").insert({
        user_id: user.id,
        questions: state.questions.map(q => q.id),
        answers: state.answers,
        score: correctCount,
      });

      if (error) throw error;

      setScore(correctCount);
      setShowResult(true);
      toast({
        title: "提交成功",
        description: `答对 ${correctCount} / ${state.questions.length} 题`,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "提交失败",
        description: "提交答题时出错",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!state.isQuizEnabled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            答题尚未开启，请联系管理员开启答题功能。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (state.hasCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            您已完成答题，每人只能答题一次。{" "}
            <Button variant="link" className="h-auto p-0" onClick={() => router.push("/quiz/history")}>
              查看答题记录
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-3xl">答题完成！</CardTitle>
            <CardDescription className="text-lg">
              您的得分：<span className="text-3xl font-bold text-primary mx-2">{score}</span>
              / {state.questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/quiz/history")} size="lg">
              查看答题详情
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentIndex];
  const currentAnswer = state.answers[currentQuestion?.id];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>进度</span>
            <span>{state.currentIndex + 1} / {state.questions.length}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${((state.currentIndex + 1) / state.questions.length) * 100}%`
              }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                {state.currentIndex + 1}
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{currentQuestion?.content}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup
              key={currentQuestion?.id}
              value={currentAnswer}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            >
              {currentQuestion?.options.map((option, index) => {
                const optionLabel = ['A', 'B', 'C', 'D'][index];
                return (
                  <div key={index} className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value={optionLabel} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {optionLabel}. {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={state.currentIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                上一题
              </Button>

              {state.currentIndex === state.questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "提交中..." : "提交答案"}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!currentAnswer}>
                  下一题
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
