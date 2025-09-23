# HARE Movie

AIで結婚式動画を生成するアプリケーションです。

## ディレクトリ構成

- `agent`: Google ADKで作成された動画生成AIエージェント
- `api`: バックエンドとAIエージェント呼び出し用ワーカー(FastAPI)
- `web`: フロントエンド(Next.js)
- `infra`: インフラ(Terraform, GCP)

## アーキテクチャ

![arch](diagram/haremovie_architecture.png)
