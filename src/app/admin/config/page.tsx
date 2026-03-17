"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface QuizConfig {
  id: string;
  is_enabled: boolean;
  question_count: number;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from("quiz_config")
        .select("*")
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
      toast({
        title: "加载失败",
        description: "无法加载答题配置",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("quiz_config")
        .update({
          is_enabled: config.is_enabled,
          question_count: config.question_count,
          updated_by: user?.id,
        })
        .eq("id", config.id);

      if (error) throw error;

      toast({
        title: "保存成功",
        description: "答题配置已更新",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "保存失败",
        description: "保存配置时出错",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            无法加载答题配置
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">答题配置</h1>

      <Card>
        <CardHeader>
          <CardTitle>答题设置</CardTitle>
          <CardDescription>
            配置答题系统的各项参数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>开启答题</Label>
              <p className="text-sm text-muted-foreground">
                开启后员工可以进行答题
              </p>
            </div>
            <Switch
              checked={config.is_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, is_enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionCount">每次答题数量</Label>
            <Input
              id="questionCount"
              type="number"
              min={1}
              max={100}
              value={config.question_count}
              onChange={(e) => setConfig({ ...config, question_count: parseInt(e.target.value) || 1 })}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              设置每次答题随机抽取的题目数量
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
