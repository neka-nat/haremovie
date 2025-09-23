import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ImageUpload';
import { SampleGallery } from '@/components/SampleGallery';
import { ProgressIndicator, TaskStatus } from '@/components/ProgressIndicator';
import { VideoPreview } from '@/components/VideoPreview';
import { toast } from 'sonner';
import { Heart, Sparkles, Film, Users } from 'lucide-react';

import heroImage from '@/assets/hero-wedding.jpg';
import sampleDress1 from '@/assets/sample-dress-1.png';
import sampleTuxedo1 from '@/assets/sample-tuxedo-1.png';
import sampleBackgroundBeach from '@/assets/sample-background-beach.jpg';
import sampleBackgroundChurch1 from '@/assets/sample-background-church-1.png';
import sampleBackgroundChurch2 from '@/assets/sample-background-church-2.png';

import {
  createTask,
  fileOrUrlToBase64,
  getTask,
  getTaskResult,
  type ServerTaskStatus,
  type CreateTaskRequest,
} from '@/lib/api';

interface UploadedImages {
  bride?: File | null;
  groom?: File | null;
  dress?: File | string | null;
  tuxedo?: File | string | null;
  background?: File | string | null;
}

const statusMap: Record<ServerTaskStatus, TaskStatus> = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'error',
};

const Index = () => {
  const [images, setImages] = useState<UploadedImages>({});
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [hasServerProgress, setHasServerProgress] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | undefined>();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // ポーリング解除用
  const pollingAbortRef = useRef<{ aborted: boolean }>({ aborted: false });

  // Sample data
  const sampleDresses = [
    { id: 'dress1', src: sampleDress1, alt: 'エレガントなウェディングドレス', title: 'クラシックドレス' },
  ];

  const sampleTuxedos = [
    { id: 'tuxedo1', src: sampleTuxedo1, alt: 'クラシックタキシード', title: 'フォーマルタキシード' },
  ];

  const sampleBackgrounds = [
    { id: 'beach', src: sampleBackgroundBeach, alt: 'ビーチウェディング', title: 'ビーチ会場' },
    { id: 'church1', src: sampleBackgroundChurch1, alt: 'チャペルウェディング1', title: 'チャペル会場' },
    { id: 'church2', src: sampleBackgroundChurch2, alt: 'チャペルウェディング2', title: 'チャペル会場' },
  ];

  const handleImageUpload = (type: keyof UploadedImages) => (file: File) => {
    setImages((prev) => ({ ...prev, [type]: file }));
    toast.success(`${getImageTypeLabel(type)}がアップロードされました`);
  };

  const handleImageRemove = (type: keyof UploadedImages) => () => {
    setImages((prev) => ({ ...prev, [type]: null }));
  };

  const handleSampleSelect = (type: keyof UploadedImages) => (item: any) => {
    setImages((prev) => ({ ...prev, [type]: item.src }));
    toast.success(`${item.title}を選択しました`);
  };

  const getImageTypeLabel = (type: keyof UploadedImages): string => {
    switch (type) {
      case 'bride':
        return '花嫁の写真';
      case 'groom':
        return '花婿の写真';
      case 'dress':
        return 'ウェディングドレス';
      case 'tuxedo':
        return 'タキシード';
      case 'background':
        return '背景';
      default:
        return '';
    }
  };

  const canGenerate =
    !!images.bride &&
    !!images.groom &&
    !!images.dress &&
    !!images.tuxedo &&
    !!images.background;

  const tickProgress = (serverProgress?: number) => {
    if (typeof serverProgress === 'number' && serverProgress >= 0 && serverProgress <= 100) {
      setProgress(serverProgress);
      setHasServerProgress(true);
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleGenerateVideo = async () => {
    if (!canGenerate) {
      toast.error('花嫁・花婿の写真、ドレス・タキシード、背景を選択してください');
      return;
    }

    try {
      setTaskStatus('processing');
      setProgress(0);
      setHasServerProgress(false);
      setGeneratedVideoUrl(undefined);
      setActiveTaskId(null);
      pollingAbortRef.current.aborted = false;

      // 必須チェック（二重防止）
      const { bride, groom, dress, tuxedo, background } = {
        bride: images.bride,
        groom: images.groom,
        dress: images.dress,
        tuxedo: images.tuxedo,
        background: images.background,
      };
      if (!bride || !groom || !dress || !tuxedo || !background) {
        toast.error('入力が不足しています');
        setTaskStatus('error');
        return;
      }

      // File or URL → Base64（5点）
      const [br, gr, dr, tx, bg] = await Promise.all([
        fileOrUrlToBase64(bride as File | string),
        fileOrUrlToBase64(groom as File | string),
        fileOrUrlToBase64(dress as File | string),
        fileOrUrlToBase64(tuxedo as File | string),
        fileOrUrlToBase64(background as File | string),
      ]);

      const payload: CreateTaskRequest = {
        bride_image: { base64_data: br.base64, mime_type: br.mime },
        groom_image: { base64_data: gr.base64, mime_type: gr.mime },
        dress_image: { base64_data: dr.base64, mime_type: dr.mime },
        tuxedo_image: { base64_data: tx.base64, mime_type: tx.mime },
        background_image: { base64_data: bg.base64, mime_type: bg.mime },
      };

      // タスク作成
      const { task_id } = await createTask(payload);
      setActiveTaskId(task_id);
      toast.success('生成タスクを作成しました');

      // ポーリング
      const started = Date.now();
      const timeoutMs = 15 * 60 * 1000; // 15分

      while (!pollingAbortRef.current.aborted && Date.now() - started < timeoutMs) {
        try {
          const t = await getTask(task_id);
          setTaskStatus(statusMap[t.status]);
          tickProgress(t.progress);

          if (t.status === 'COMPLETED') {
            const result = await getTaskResult(task_id);
            setGeneratedVideoUrl(result.result_video_url);
            setProgress(100);
            setHasServerProgress(true);
            setTaskStatus('completed');
            toast.success('動画が生成されました！');
            return;
          }
          if (t.status === 'FAILED') {
            setTaskStatus('error');
            toast.error('動画生成に失敗しました');
            return;
          }
        } catch (e: any) {
          // まだ Task が見つからない(404)等は少し待って再試行
          // それ以外のエラーも一定時間はリトライ
          // console.warn(e);
        }
        await sleep(2500);
      }

      if (!pollingAbortRef.current.aborted) {
        setTaskStatus('error');
        toast.error('タイムアウトしました（しばらくしてから再試行してください）');
      }
    } catch (e: any) {
      setTaskStatus('error');
      toast.error(`エラーが発生しました: ${e?.message || e}`);
    }
  };

  const handleDownload = () => {
    if (generatedVideoUrl) {
      const a = document.createElement('a');
      a.href = generatedVideoUrl;
      a.download = 'wedding-video.mp4';
      a.click();
      toast.success('動画のダウンロードを開始しました');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Heart className="h-8 w-8 text-rose-gold animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              HARE Movie
            </h1>
            <Heart className="h-8 w-8 text-rose-gold animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AIの力で、あなたの理想の結婚式を動画に。<br/>写真をアップロードすることで、結婚式動画を生成します。
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>人物写真 2枚（花嫁・花婿）</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>衣装・背景選択</span>
            </div>
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              <span>AI動画生成</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  人物写真のアップロード（花嫁・花婿）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <ImageUpload
                    onImageUpload={handleImageUpload('bride')}
                    onImageRemove={handleImageRemove('bride')}
                    image={images.bride}
                    title="花嫁の写真"
                    subtitle="正面を向いた明るい写真"
                  />
                  <ImageUpload
                    onImageUpload={handleImageUpload('groom')}
                    onImageRemove={handleImageRemove('groom')}
                    image={images.groom}
                    title="花婿の写真"
                    subtitle="正面を向いた明るい写真"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  衣装・背景の選択
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="dress" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dress">ドレス</TabsTrigger>
                    <TabsTrigger value="tuxedo">タキシード</TabsTrigger>
                    <TabsTrigger value="background">背景</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dress" className="space-y-4">
                    <ImageUpload
                      onImageUpload={handleImageUpload('dress')}
                      onImageRemove={handleImageRemove('dress')}
                      image={images.dress}
                      title="ウェディングドレス"
                      subtitle="カスタムドレスをアップロード"
                    />
                    <SampleGallery
                      items={sampleDresses}
                      onSelect={handleSampleSelect('dress')}
                      selectedId={images.dress === sampleDress1 ? 'dress1' : undefined}
                      title="サンプルドレス"
                    />
                  </TabsContent>

                  <TabsContent value="tuxedo" className="space-y-4">
                    <ImageUpload
                      onImageUpload={handleImageUpload('tuxedo')}
                      onImageRemove={handleImageRemove('tuxedo')}
                      image={images.tuxedo}
                      title="タキシード"
                      subtitle="カスタムタキシードをアップロード"
                    />
                    <SampleGallery
                      items={sampleTuxedos}
                      onSelect={handleSampleSelect('tuxedo')}
                      selectedId={images.tuxedo === sampleTuxedo1 ? 'tuxedo1' : undefined}
                      title="サンプルタキシード"
                    />
                  </TabsContent>

                  <TabsContent value="background" className="space-y-4">
                    <ImageUpload
                      onImageUpload={handleImageUpload('background')}
                      onImageRemove={handleImageRemove('background')}
                      image={images.background}
                      title="背景"
                      subtitle="カスタム背景をアップロード"
                    />
                    <SampleGallery
                      items={sampleBackgrounds}
                      onSelect={handleSampleSelect('background')}
                      selectedId={
                        images.background === sampleBackgroundBeach
                          ? 'beach'
                          : images.background === sampleBackgroundChurch1
                          ? 'church1'
                          : images.background === sampleBackgroundChurch2
                          ? 'church2'
                          : undefined
                      }
                      title="サンプル背景"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Generation & Preview Section */}
          <div className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary" />
                  動画生成
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerateVideo}
                  disabled={!canGenerate || taskStatus === 'processing'}
                  variant="elegant"
                  size="lg"
                  className="w-full"
                >
                  {taskStatus === 'processing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Film className="h-4 w-4 mr-2" />
                      動画を生成する
                    </>
                  )}
                </Button>

                <ProgressIndicator
                  status={taskStatus}
                  progress={progress}
                  indeterminate={taskStatus === 'processing' && !hasServerProgress}
                />
                {activeTaskId && (
                  <p className="text-xs text-muted-foreground text-center break-all">
                    タスクID: {activeTaskId}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>動画プレビュー</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoPreview videoUrl={generatedVideoUrl} onDownload={handleDownload} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
