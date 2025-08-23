import cv2


def extract_last_frame(video_path: str) -> bytes:
    video_stream = cv2.VideoCapture(video_path)
    total_frames = int(video_stream.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames == 0:
        raise ValueError("No frames found in video")
    video_stream.set(cv2.CAP_PROP_POS_FRAMES, total_frames - 1)
    ret, frame = video_stream.read()
    if not ret:
        raise ValueError("Failed to read last frame")
    return cv2.imencode(".png", frame)[1].tobytes()
