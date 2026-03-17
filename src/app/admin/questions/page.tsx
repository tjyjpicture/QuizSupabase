"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  content: string;
  options: string[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  created_at: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // 表单状态
  const [formData, setFormData] = useState({
    content: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct_answer: "A" as 'A' | 'B' | 'C' | 'D',
  });

  const fetchQuestions = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let query = supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("content", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "加载失败",
        description: "无法加载题目列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "操作失败",
          description: "用户未登录",
          variant: "destructive",
        });
        return;
      }

      const questionData = {
        content: formData.content,
        options: [formData.optionA, formData.optionB, formData.optionC, formData.optionD],
        correct_answer: formData.correct_answer,
        created_by: user.id,
      };

      if (editingQuestion) {
        // 更新题目
        const { error } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", editingQuestion.id);

        if (error) throw error;
        toast({ title: "更新成功", description: "题目已更新" });
      } else {
        // 创建题目
        const { error } = await supabase
          .from("questions")
          .insert(questionData);

        if (error) throw error;
        toast({ title: "创建成功", description: "题目已添加" });
      }

      setDialogOpen(false);
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      console.error("Error saving question:", error);
      toast({
        title: "操作失败",
        description: error.message || "保存题目时出错",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from("questions")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "删除成功", description: "题目已删除" });
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "删除失败",
        description: "删除题目时出错",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      content: question.content,
      optionA: question.options[0],
      optionB: question.options[1],
      optionC: question.options[2],
      optionD: question.options[3],
      correct_answer: question.correct_answer,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setFormData({
      content: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct_answer: "A",
    });
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
        <h1 className="text-3xl font-bold">题目管理</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingQuestion(null)}>
              <Plus className="mr-2 h-4 w-4" />
              添加题目
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "编辑题目" : "添加题目"}</DialogTitle>
              <DialogDescription>
                请输入题目内容和选项，并选择正确答案
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">题目内容</Label>
                  <Input
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="请输入题目内容"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="optionA">选项 A</Label>
                    <Input
                      id="optionA"
                      value={formData.optionA}
                      onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                      placeholder="选项 A"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionB">选项 B</Label>
                    <Input
                      id="optionB"
                      value={formData.optionB}
                      onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                      placeholder="选项 B"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionC">选项 C</Label>
                    <Input
                      id="optionC"
                      value={formData.optionC}
                      onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                      placeholder="选项 C"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionD">选项 D</Label>
                    <Input
                      id="optionD"
                      value={formData.optionD}
                      onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                      placeholder="选项 D"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>正确答案</Label>
                  <div className="flex gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                      <Button
                        key={opt}
                        type="button"
                        variant={formData.correct_answer === opt ? "default" : "outline"}
                        onClick={() => setFormData({ ...formData, correct_answer: opt })}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit">
                  {editingQuestion ? "更新" : "添加"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索题目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无题目，点击右上角添加题目
            </CardContent>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{question.content}</CardTitle>
                    <CardDescription>
                      正确答案: <span className="font-semibold text-primary">{question.correct_answer}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除这道题目吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(question.id)}>
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>A. {question.options[0]}</div>
                  <div>B. {question.options[1]}</div>
                  <div>C. {question.options[2]}</div>
                  <div>D. {question.options[3]}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
