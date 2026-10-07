#------------------------------------------------------Imports------------------------------------------------------
import asyncio
import cv2
import numpy as np
import time
import uvicorn

from datetime import datetime
from starlette.applications import Starlette
from starlette.responses import StreamingResponse, JSONResponse
from starlette.routing import Route


#------------------------------------------------------Configuration------------------------------------------------------
VIDEO_PORT = 8000

FRAME_WIDTH = 1280
FRAME_HEIGHT = 720
FRAME_RATE = 15

FRAME_DELAY = 1 / FRAME_RATE


#------------------------------------------------------Test_Frame------------------------------------------------------
def generateTestFrame(frameNumber):

    frame = np.zeros((FRAME_HEIGHT, FRAME_WIDTH, 3), dtype=np.uint8)

    # Background grid
    for x in range(0, FRAME_WIDTH, 80):
        cv2.line(frame, (x, 0), (x, FRAME_HEIGHT), (35, 35, 35), 1)

    for y in range(0, FRAME_HEIGHT, 80):
        cv2.line(frame, (0, y), (FRAME_WIDTH, y), (35, 35, 35), 1)

    # Moving target
    travelWidth = FRAME_WIDTH - 200
    targetX = 100 + int((frameNumber * 6) % travelWidth)

    targetY = int(
        FRAME_HEIGHT / 2 +
        np.sin(frameNumber / 20) * 180
    )

    cv2.circle(frame, (targetX, targetY), 35, (0, 255, 255), -1)

    cv2.rectangle(
        frame,
        (targetX - 55, targetY - 55),
        (targetX + 55, targetY + 55),
        (0, 255, 0),
        3
    )

    # Header
    cv2.rectangle(frame, (0, 0), (FRAME_WIDTH, 75), (20, 20, 20), -1)

    cv2.putText(
        frame,
        "UAV LIVE CAMERA TEST",
        (30, 48),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.2,
        (255, 255, 255),
        2
    )

    # Information
    currentTime = datetime.now().strftime("%H:%M:%S")

    cv2.putText(
        frame,
        f"Frame: {frameNumber}",
        (30, FRAME_HEIGHT - 70),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Time: {currentTime}",
        (30, FRAME_HEIGHT - 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )

    return frame


#------------------------------------------------------MJPEG_Stream------------------------------------------------------
async def generateVideo():

    frameNumber = 0

    while True:

        startTime = time.time()

        frame = generateTestFrame(frameNumber)

        success, encodedFrame = cv2.imencode(
            ".jpg",
            frame,
            [cv2.IMWRITE_JPEG_QUALITY, 80]
        )

        if success:

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" +
                encodedFrame.tobytes() +
                b"\r\n"
            )

        frameNumber += 1

        elapsedTime = time.time() - startTime
        delay = max(0, FRAME_DELAY - elapsedTime)

        await asyncio.sleep(delay)


#------------------------------------------------------Routes------------------------------------------------------
async def video(request):

    return StreamingResponse(
        generateVideo(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


async def status(request):

    return JSONResponse({
        "status": "online",
        "source": "test",
        "fps": FRAME_RATE,
        "resolution": f"{FRAME_WIDTH}x{FRAME_HEIGHT}"
    })


#------------------------------------------------------Server------------------------------------------------------
routes = [
    Route("/video", video),
    Route("/status", status)
]

application = Starlette(routes=routes)


#------------------------------------------------------Main------------------------------------------------------
if __name__ == "__main__":

    print(f"Starting UAV test video server on port {VIDEO_PORT}")

    uvicorn.run(
        application,
        host="0.0.0.0",
        port=VIDEO_PORT
    )