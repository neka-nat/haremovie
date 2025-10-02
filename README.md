# HARE Movie

AIで結婚式動画を生成するアプリケーションです。

## ディレクトリ構成

- `agent`: Google ADKで作成された動画生成AIエージェント
- `api`: バックエンドとAIエージェント呼び出し用ワーカー(FastAPI)
- `web`: フロントエンド(Next.js)
- `infra`: インフラ(Terraform, GCP)
- `diagram`: アーキテクチャ図を作成するコードとか

## アーキテクチャ

![arch](diagram/haremovie_architecture.png)

## デモ

https://github.com/user-attachments/assets/6bba6358-c123-46de-a616-4acc7fdb808a
