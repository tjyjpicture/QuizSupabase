"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, CheckCircle, XCircle } from "lucide-react";

interface QuizHistory {
  id: string;
  questions: string[];
  answers: Record<string, string>;
  score: number;
  completed_at: string;
  questionDetails?: QuestionDetail[];
}

interface QuestionDetail {
  id: string;
  content: string;
  options: string[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
}

export default function HistoryPage() {
  const [quizHistory, setQuizHistory] = useState<QuizHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  const fetchQuizHistory = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 获取答题记录
      const { data: quiz } = await supabase
        .from("quizzes")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .single();

      if (!quiz) {
        setLoading(false);
        return;
      }

      // 获取题目详情
      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .in("id", quiz.questions);

      setQuizHistory({
        ...quiz,
        questionDetails: questions || [],
      });
    } catch (error) {
      console.error("Error fetching quiz history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!quizHistory || !quizHistory.questionDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无答题记录
          </CardContent>
        </Card>
      </div>
    );
  }

  const correctCount = quizHistory.score;
  const totalCount = quizHistory.questionDetails.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">我的答题记录</h1>

      {/* 答题概览 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>答题结果</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4" />
                {formatDate(quizHistory.completed_at)}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {correctCount} / {totalCount}
              </div>
              <div className="text-sm text-muted-foreground">
                正确率 {percentage}%
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 题目详情 */}
      <div className="space-y-6">
        {quizHistory.questionDetails.map((question, index) => {
          const userAnswer = quizHistory.answers[question.id];
          const isCorrect = userAnswer === question.correct_answer;

          return (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{question.content}</CardTitle>
                  </div>
                  <Badge variant={isCorrect ? "default" : "destructive"} className="gap-1">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        正确
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        错误
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.options.map((option, i) => {
                    const optionLabel = ['A', 'B', 'C', 'D'][i];
                    const isUserAnswer = userAnswer === optionLabel;
                    const isCorrectAnswer = question.correct_answer === optionLabel;

                    let statusClass = "";
                    let statusIcon = null;

                    if (isUserAnswer && isCorrect) {
                      statusClass = "bg-green-50 border-green-500";
                    } else if (isUserAnswer && !isCorrect) {
                      statusClass = "bg-red-50 border-red-500";
                    } else if (isCorrectAnswer) {
                      statusClass = "bg-green-50 border-green-300";
                    }

                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${statusClass} transition-colors`}
                      >
                        <span className="font-medium mr-2">{optionLabel}.</span>
                        {option}
                        {isUserAnswer && isCorrect && (
                          <span className="ml-2 text-green-600 text-sm font-medium">(您的答案)</span>
                        )}
                        {isUserAnswer && !isCorrect && (
                          <span className="ml-2 text-red-600 text-sm font-medium">(您的答案)</span>
                        )}
                        {isCorrectAnswer && !isUserAnswer && (
                          <span className="ml-2 text-green-600 text-sm font-medium">(正确答案)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
