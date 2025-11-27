FROM python:3.11-slim

# Tesseract OCR 설치 (Debian/Ubuntu 기반)
RUN apt-get update && apt-get install -y tesseract-ocr

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# run.py가 실행될 것이므로 CMD는 따로 필요 없슴
# docker-compose run 명령어가 직접 python run.py를 실행할 것이기 때문