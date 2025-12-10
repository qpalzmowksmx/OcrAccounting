# docker-compose.yml

# ./ocr_processor/Dockerfile

FROM python:3.11-slim

# --- Tesseract OCR 엔진 설치 (Debian/Ubuntu 기반)
RUN apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-kor

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# docker-compose run 명령어가 직접 python run.py를 실행하므로 CMD는 필요 X