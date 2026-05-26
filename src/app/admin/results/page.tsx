"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Trophy, Calendar, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizResult {
  id: string;
  user_id: string;
  username: string;
  score: number;
  completed_at: string;
  question_count: number;
  questions: string[];
  answers: Record<string, string>;
}

interface QuestionDetail {
  id: string;
  content: string;
  options: string[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
}

export default function ResultsPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [questionDetails, setQuestionDetails] = useState<Record<string, QuestionDetail[]>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { toast } = useToast();

  const fetchResults = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .order("completed_at", { ascending: false });

      if (quizzesError) throw quizzesError;

      const userIds = quizzes?.map(q => q.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const userMap = profiles?.reduce((acc, p) => {
        acc[p.id] = p.username;
        return acc;
      }, {} as Record<string, string>) || {};

      const results: QuizResult[] = (quizzes || []).map(quiz => ({
        id: quiz.id,
        user_id: quiz.user_id,
        username: userMap[quiz.user_id] || "未知用户",
        score: quiz.score,
        completed_at: quiz.completed_at,
        question_count: quiz.questions?.length || 0,
        questions: quiz.questions || [],
        answers: quiz.answers || {},
      }));

      let filteredResults = results;
      if (searchQuery) {
        filteredResults = results.filter(r =>
          r.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setResults(filteredResults);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        title: "加载失败",
        description: "无法加载答题结果",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [searchQuery]);

  const loadQuestionDetails = async (result: QuizResult) => {
    if (questionDetails[result.id]) return;

    setLoadingDetails(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .in("id", result.questions);

      setQuestionDetails(prev => ({
        ...prev,
        [result.id]: questions || [],
      }));
    } catch (error) {
      console.error("Error fetching question details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleExpand = (result: QuizResult) => {
    if (expandedId === result.id) {
      setExpandedId(null);
    } else {
      setExpandedId(result.id);
      loadQuestionDetails(result);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "删除成功", description: "答题记录已删除" });
      fetchResults();
    } catch (error) {
      console.error("Error deleting result:", error);
      toast({
        title: "删除失败",
        description: "删除答题记录时出错",
        variant: "destructive",
      });
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

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">答题结果</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无答题记录
            </CardContent>
          </Card>
        ) : (
          results.map((result) => {
            const isExpanded = expandedId === result.id;
            const details = questionDetails[result.id];

            return (
              <Card key={result.id}>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleExpand(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{result.username}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(result.completed_at)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(result.score, result.question_count)}`}>
                          {result.score}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          / {result.question_count} 题
                        </div>
                      </div>
                      <div
                        className="p-2 hover:bg-accent rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(result);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除 {result.username} 的答题记录吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(result.id)}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t pt-4">
                    {loadingDetails && !details ? (
                      <div className="text-center py-8 text-muted-foreground">加载题目详情...</div>
                    ) : details ? (
                      <div className="space-y-4">
                        {details.map((question, index) => {
                          const userAnswer = result.answers[question.id];
                          const isCorrect = userAnswer === question.correct_answer;

                          return (
                            <div key={question.id} className="border rounded-lg p-4">
                              <div className="flex items-start gap-3 mb-3">
                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="flex-1 font-medium">{question.content}</div>
                                <Badge variant={isCorrect ? "default" : "destructive"} className="gap-1 flex-shrink-0">
                                  {isCorrect ? (
                                    <><CheckCircle className="h-3 w-3" />正确</>
                                  ) : (
                                    <><XCircle className="h-3 w-3" />错误</>
                                  )}
                                </Badge>
                              </div>
                              <div className="space-y-1.5 ml-10">
                                {question.options.map((option, i) => {
                                  const optionLabel = ['A', 'B', 'C', 'D'][i];
                                  const isUserAnswer = userAnswer === optionLabel;
                                  const isCorrectAnswer = question.correct_answer === optionLabel;

                                  let statusClass = "";
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
                                      className={`p-2 rounded border ${statusClass} text-sm`}
                                    >
                                      <span className="font-medium mr-2">{optionLabel}.</span>
                                      {option}
                                      {isUserAnswer && isCorrect && (
                                        <span className="ml-2 text-green-600 text-xs font-medium">(作答)</span>
                                      )}
                                      {isUserAnswer && !isCorrect && (
                                        <span className="ml-2 text-red-600 text-xs font-medium">(作答)</span>
                                      )}
                                      {isCorrectAnswer && !isUserAnswer && (
                                        <span className="ml-2 text-green-600 text-xs font-medium">(正确答案)</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
