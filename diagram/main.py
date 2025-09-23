import os

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Client
from diagrams.gcp.compute import Run
from diagrams.gcp.storage import GCS
from diagrams.gcp.database import SQL
from diagrams.gcp.devtools import Tasks
from diagrams.custom import Custom


# 見やすさ調整（曲線、余白、解像度など）
graph_attr = {
    "splines": "spline",
    "pad": "0.3",
    "dpi": "140",
}

vertex_ai_icon_path = os.path.join(os.path.dirname(__file__), "icons/vertexai.png")
gemini_icon_path = os.path.join(os.path.dirname(__file__), "icons/gemini.png")

with Diagram(
    "HARE Movie - System Architecture",
    filename="haremovie_architecture",
    outformat="png",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
):
    # User & Web (SPA)
    user = Client("User / Browser")
    with Cluster("Web (Vite + React)"):
        web = Run("App")

    # API サービス
    with Cluster("API Service (FastAPI)"):
        api = Run("API server")

    # Worker サービス
    with Cluster("Worker Service (FastAPI)"):
        worker = Run("Worker server")

    # GCP 側
    with Cluster("Google Cloud"):
        # ストレージ/DB/キュー
        gcs = GCS("Cloud Storage")
        sql = SQL("Cloud SQL (PostgreSQL)")
        tasks_q = Tasks("Cloud Tasks\nHTTP queue")

        # Vertex AI クラスタ
        with Cluster("Vertex AI"):
            agent_engine = Custom("Agent Engine", vertex_ai_icon_path)
            with Cluster("Agent & Tools"):
                agent = Custom("LlmAgent", vertex_ai_icon_path)
                vto = Custom("virtual_try_on\n(nanobanana)", gemini_icon_path)
                synth = Custom("image_synthesis\n(nanobanana)", gemini_icon_path)
                veo = Custom("veo-3.0", vertex_ai_icon_path)

    # --- フロー（Web → API） ---
    user >> Edge(label="操作") >> web
    web >> Edge(label="POST /tasks/create\n(画像をBase64化して送信)") >> api

    # API: 入力画像を GCS にアップロード、Cloud Tasks に投入
    api >> Edge(label="upload_artifact()\ninputs/*") >> gcs
    api >> Edge(label="create_task()") >> tasks_q

    # Cloud Tasks → Worker（HTTP 呼び出し）
    tasks_q >> Edge(label="HTTP POST\n/tasks/run/{task_id}") >> worker

    # Worker: 入力アセット取得 → Vertex AI 呼び出し
    worker >> Edge(label="download_artifact()") >> gcs
    worker >> Edge(label="create_session()") >> agent_engine
    agent_engine >> Edge(label="dispatch to Agent") >> agent

    # Agent のツールチェーン
    agent >> Edge(label="VTO") >> vto
    agent >> Edge(label="Image Synth") >> synth
    agent >> Edge(label="Video (8s)") >> veo

    # 生成動画は Vertex 側が GCS に出力（output_gcs_uri）
    veo >> Edge(label="output_gcs_uri\nvideos/*") >> gcs

    # 進捗/結果保存
    worker >> Edge(label="upsert_task(), save_task_result()") >> sql

    # Web 側のポーリング（進捗/結果取得）
    web >> Edge(label="POST /tasks/{id}\n進捗取得") >> api
    api >> Edge(label="SELECT Task") >> sql

    web >> Edge(label="POST /tasks/{id}/result\n動画URL取得") >> api
    api >> Edge(label="get_signed_url()\n署名付きURLを発行") >> gcs
    # （API は URL を Web に返す → ブラウザが動画を再生/ダウンロード）
