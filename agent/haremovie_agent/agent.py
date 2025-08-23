import os
from google.adk.agents import LlmAgent

from .callback import save_uploads_as_artifacts
from .generate_image_synthesis import generate_image_synthesis
from .generate_virtual_try_on import generate_virtual_try_on
from .generate_video import generate_video


instruction = """
あなたは優秀な動画制作者です。
花嫁のための結婚式の動画を作成してください。
作成の流れは以下になります。

1. 最初にユーザから以下の3つの写真が与えられます。
  - 1枚目、花嫁の写真
  - 2枚目、ウェディングドレスの写真
  - 3枚目、背景の写真
2. まず、virtual_try_onを使用して、花嫁の写真にウェディングドレスを着せてください。
3. 次に、generate_image_synthesisを使用して、ウェディングドレスを着た花嫁を与えられた背景写真の中に自然な形で合成した画像を生成してください。
4. 最後に、generate_videoを使用して、3で画像を入力にして、動画を生成してください。
"""


root_agent = LlmAgent(
    name="haremovie_agent",
    model="gemini-2.5-flash",
    description="Agent to create 'HARE' movie.",
    instruction=instruction,
    tools=[
        generate_virtual_try_on,
        generate_image_synthesis,
        generate_video,
    ],
    before_model_callback=save_uploads_as_artifacts,
)
