# ... (json import)
import json

# ...

def process_image(image_path):
    # 1. Tesseract OCR로 텍스트 추출
    # ... (기존 코드)
    raw_text = pytesseract.image_to_string(Image.open(image_path), lang='kor+eng')

    # 2. Gemini API로 JSON 데이터 추출
    # ... (기존 코드)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    prompt = f"""...""" # 프롬프트는 여기에
    response = model.generate_content(prompt)

    # --- 안정성 보강 부분 ---
    try:
        # 응답 텍스트 앞뒤에 있을 수 있는 ```json ... ``` 같은 마크다운 제거
        clean_text = response.text.strip().replace('```json', '').replace('```', '')
        receipt_json = json.loads(clean_text)
        return receipt_json
    except (json.JSONDecodeError, AttributeError) as e:
        print(f"  -> Gemini API가 유효한 JSON을 반환하지 않았습니다. Error: {e}")
        print(f"  -> 원본 응답: {response.text}")
        return None # 실패 시 None을 반환하여 main 함수에서 처리하도록 함