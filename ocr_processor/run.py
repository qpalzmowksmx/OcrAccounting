# ./ocr_processor/run.py
import os
import redis
import json
import uuid
from PIL import Image
import pytesseract
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# --- 설정 ---
#  Gemini API 호출 및 프롬프트 로직

def process_image(image_path):
    # 1. Tesseract OCR로 텍스트 추출
    raw_text = pytesseract.image_to_string(Image.open(image_path), lang='kor+eng')
    
    # 2. Gemini API로 JSON 데이터 추출 (이전에 작성한 코드)
    # ...
    # structured_data = call_gemini_api(raw_text)
    structured_data = { "vendor": "테스트 상점", "total_amount": 10000, "purchase_date": "2025-12-10", "items": [] } # 임시 데이터

    return structured_data

def main():
    print("Starting OCR processing...")
    
    # Redis 연결
    redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'redis'), port=6379, db=0)
    
    # 처리할 파일이 있는 폴더
    process_folder = '/app/receipts_to_process'
    
    # 처리 완료된 파일을 옮길 폴더 (무한 반복 처리 방지)
    processed_folder = '/app/receipts_processed'
    os.makedirs(processed_folder, exist_ok=True)

    for filename in os.listdir(process_folder):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(process_folder, filename)
            print(f"Processing: {filename}")

            try:
                # 1. 이미지 처리
                receipt_json = process_image(image_path)
                
                # 2. Redis에 저장
                receipt_id = uuid.uuid4().hex
                redis_key = f"receipt:unverified:{receipt_id}"
                redis_client.set(redis_key, json.dumps(receipt_json))
                print(f"  -> Saved to Redis with key: {redis_key}")
                
                # 3. 처리 완료된 파일을 다른 폴더로 이동 (가장 중요)
                os.rename(image_path, os.path.join(processed_folder, filename))

            except Exception as e:
                print(f"  -> Error processing {filename}: {e}")

    print("OCR processing finished.")

if __name__ == "__main__":
    main()