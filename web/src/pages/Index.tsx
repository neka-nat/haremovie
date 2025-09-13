import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ImageUpload';
import { SampleGallery } from '@/components/SampleGallery';
import { ProgressIndicator, TaskStatus } from '@/components/ProgressIndicator';
import { VideoPreview } from '@/components/VideoPreview';
import { toast } from 'sonner';
import { Heart, Sparkles, Film, Users } from 'lucide-react';

// Sample images imports
import heroImage from '@/assets/hero-wedding.jpg';
import sampleDress1 from '@/assets/sample-dress-1.jpg';
import sampleTuxedo1 from '@/assets/sample-tuxedo-1.jpg';
import sampleBackgroundBeach from '@/assets/sample-background-beach.jpg';
import sampleBackgroundChurch from '@/assets/sample-background-church.jpg';

interface UploadedImages {
  bride?: File | null;
  groom?: File | null;
  dress?: File | string | null;
  tuxedo?: File | string | null;
  background?: File | string | null;
}

const Index = () => {
  const [images, setImages] = useState<UploadedImages>({});
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | undefined>();

  // Sample data
  const sampleDresses = [
    { id: 'dress1', src: sampleDress1, alt: 'エレガントなウェディングドレス', title: 'クラシックドレス' },
  ];

  const sampleTuxedos = [
    { id: 'tuxedo1', src: sampleTuxedo1, alt: 'クラシックタキシード', title: 'フォーマルタキシード' },
  ];

  const sampleBackgrounds = [
    { id: 'beach', src: sampleBackgroundBeach, alt: 'ビーチウェディング', title: 'ビーチ会場' },
    { id: 'church', src: sampleBackgroundChurch, alt: 'チャペルウェディング', title: 'チャペル会場' },
  ];

  const handleImageUpload = (type: keyof UploadedImages) => (file: File) => {
    setImages(prev => ({ ...prev, [type]: file }));
    toast.success(`${getImageTypeLabel(type)}がアップロードされました`);
  };

  const handleImageRemove = (type: keyof UploadedImages) => () => {
    setImages(prev => ({ ...prev, [type]: null }));
  };

  const handleSampleSelect = (type: keyof UploadedImages) => (item: any) => {
    setImages(prev => ({ ...prev, [type]: item.src }));
    toast.success(`${item.title}を選択しました`);
  };

  const getImageTypeLabel = (type: keyof UploadedImages): string => {
    switch (type) {
      case 'bride': return '花嫁の写真';
      case 'groom': return '花婿の写真';
      case 'dress': return 'ウェディングドレス';
      case 'tuxedo': return 'タキシード';
      case 'background': return '背景';
      default: return '';
    }
  };

  const canGenerate = images.bride && images.groom && images.dress && images.tuxedo && images.background;

  const handleGenerateVideo = async () => {
    if (!canGenerate) {
      toast.error('すべての画像を選択してください');
      return;
    }

    setTaskStatus('processing');
    setProgress(0);

    // Simulate video generation process
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTaskStatus('completed');
          // Simulate generated video URL
          setGeneratedVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
          toast.success('動画が生成されました！');
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
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
              Wedding AI Video
            </h1>
            <Heart className="h-8 w-8 text-rose-gold animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AIの力で、あなたの特別な日を美しい動画に。写真をアップロードするだけで、プロ品質の結婚式動画を生成します。
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>人物写真 2枚</span>
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
                  人物写真のアップロード
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
                        images.background === sampleBackgroundBeach ? 'beach' :
                        images.background === sampleBackgroundChurch ? 'church' :
                        undefined
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
                />
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>動画プレビュー</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoPreview
                  videoUrl={generatedVideoUrl}
                  onDownload={handleDownload}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;