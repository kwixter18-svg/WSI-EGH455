FROM python:3.12-slim

WORKDIR /video

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY video/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY video/videoHandler.py .
COPY video/test-video.mp4 .

EXPOSE 8000

CMD ["python", "videoHandler.py"]
