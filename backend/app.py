# -- 데이터베이스 생성 (docker-compose.yml의 MYSQL_DATABASE와 일치)
# CREATE DATABASE my_accounting_db;
# USE my_accounting_db;

# -- 최종 승인된 영수증 정보를 저장할 테이블
# CREATE TABLE verified_receipts (
#     id INT AUTO_INCREMENT PRIMARY KEY,
#     receipt_id VARCHAR(255) UNIQUE NOT NULL, -- Redis에서 사용했던 고유 ID
#     vendor_name VARCHAR(255),
#     purchase_date DATE,
#     total_amount DECIMAL(10, 2),
#     items_json JSON, -- 구매 항목들은 JSON 형태로 저장
#     approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );

# -- 수동 등록 항목 (카테고리 등)을 관리할 테이블
# CREATE TABLE categories (
#     id INT AUTO_INCREMENT PRIMARY KEY,
#     name VARCHAR(100) UNIQUE NOT NULL,
#     description TEXT,
#     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );```

# ---

### 백엔드 코드 (`./backend/app.py`)



# Python 코드 부분 위는 까먹지않으려고 한 메모(미리 sql 작성 필수)



# ./backend/app.py

import os
import json
import redis # type: ignore
import pymysql # type: ignore
from flask import Flask, jsonify, request # type: ignore
from werkzeug.utils import secure_filename # type: ignore # 파일명을 안전하게 처리하기 위해 import
import uuid # 고유한 파일명을 만들기 위해 import
from flask_cors import CORS # type: ignore # CORS 문제를 해결하기 위한 라이브러리

# --- 1. 애플리케이션 설정 ---

# Flask 앱 초기화
app = Flask(__name__)
CORS(app)

# 업로드된 파일을 저장할 컨테이너 내부 경로 설정
# 이 경로는 docker-compose.yml의 ocr-processor 볼륨과 연결
UPLOAD_FOLDER = '/app/receipts_to_process' 
# 폴더가 없으면 생성
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 

# CORS 설정: 프론트엔드(Nginx)로부터 오는 모든 요청을 허용
# 프론트엔드(예: localhost:5001)와 백엔드(예: localhost:5000)는 출처(Origin)가 다르기 때문에 필수입니다.
CORS(app)

# 환경 변수에서 데이터베이스 접속 정보 불러오기
# docker-compose.yml의 서비스 이름을 호스트명으로 사용합니다.
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
MYSQL_HOST = os.getenv('MYSQL_HOST', 'db')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_DB = os.getenv('MYSQL_DATABASE')


# --- 2. 데이터베이스 연결 ---

# Redis 연결
# decode_responses=True: Redis에서 받은 데이터를 자동으로 utf-8 문자열로 변환해줍니다.
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)
    redis_client.ping() # 연결 테스트
    print("Successfully connected to Redis.")
except redis.exceptions.ConnectionError as e:
    print(f"Could not connect to Redis: {e}")
    redis_client = None

# MySQL 연결 함수 (요청이 있을 때마다 새로 연결하여 안정성 확보)
def get_mysql_connection():
    try:
        return pymysql.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            cursorclass=pymysql.cursors.DictCursor # 결과를 딕셔너리 형태로 받음
        )
    except pymysql.MySQLError as e:
        print(f"Could not connect to MySQL: {e}")
        return None

# --- 3. API 엔드포인트 (라우트) 정의 ---

# API가 잘 동작하는지 확인하기 위한 기본 라우트

# ... 기존 API 엔드포인트들 ...

# [화면 1] 영수증 파일 업로드 처리
@app.route('/api/upload-receipts', methods=['POST'])
def upload_receipts():
    # 'receipts' 라는 키로 파일이 넘어왔는지 확인
    if 'receipts' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    files = request.files.getlist('receipts')
    
    if not files or files[0].filename == '':
        return jsonify({"error": "No selected file"}), 400

    uploaded_count = 0
    errors = []

    for file in files:
        if file:
            try:
                # 파일명을 안전하게 처리 (예: ../../etc/passwd 같은 공격 방지)
                original_filename = secure_filename(file.filename)
                # 파일명 중복을 피하기 위해 고유 ID와 원본 파일명을 조합
                unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
                
                # 파일을 지정된 경로에 저장
                file.save(os.path.join(UPLOAD_FOLDER, unique_filename))
                uploaded_count += 1
            except Exception as e:
                errors.append(f"Could not save file {file.filename}: {e}")

    if uploaded_count > 0:
        return jsonify({
            "message": f"{uploaded_count}개의 파일이 성공적으로 업로드되었습니다.",
            "errors": errors
        })
    else:
        return jsonify({"error": "파일 업로드에 실패했습니다.", "details": errors}), 500
    
@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok"})

# [화면 2] 지출 확인 (Redis에 있는 미승인 데이터 조회)
@app.route('/api/unverified-receipts', methods=['GET'])
def get_unverified_receipts():
    if not redis_client:
        return jsonify({"error": "Redis not connected"}), 500
    
    receipts = []
    # 'receipt:unverified:*' 패턴을 가진 모든 키를 조회
    for key in redis_client.scan_iter("receipt:unverified:*"):
        receipt_data = redis_client.get(key)
        if receipt_data:
            receipt_json = json.loads(receipt_data)
            receipt_json['id'] = key.split(':')[-1] # 프론트에서 사용할 고유 ID 추가
            receipts.append(receipt_json)
            
    return jsonify(receipts)

# [화면 2 -> 4] 영수증 승인 (Redis -> MySQL)
@app.route('/api/approve-receipt/<receipt_id>', methods=['POST'])
def approve_receipt(receipt_id):
    if not redis_client:
        return jsonify({"error": "Redis not connected"}), 500

    # 1. Redis에서 데이터 가져오기
    redis_key = f"receipt:unverified:{receipt_id}"
    receipt_data_str = redis_client.get(redis_key)
    
    if not receipt_data_str:
        return jsonify({"error": "Receipt not found in Redis"}), 404
    
    receipt_data = json.loads(receipt_data_str)

    # (선택) 프론트엔드에서 수정된 데이터를 POST body로 받을 수도 있습니다.
    updated_data = request.get_json()
    if updated_data:
        receipt_data.update(updated_data)

    # 2. MySQL에 데이터 저장
    conn = get_mysql_connection()
    if not conn:
        return jsonify({"error": "MySQL not connected"}), 500

    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO verified_receipts 
                (receipt_id, vendor_name, purchase_date, total_amount, items_json)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                receipt_id,
                receipt_data.get('vendor'),
                receipt_data.get('purchase_date'),
                receipt_data.get('total_amount'),
                json.dumps(receipt_data.get('items', [])) # items 리스트를 JSON 문자열로 변환
            ))
        conn.commit()
    except pymysql.MySQLError as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    # 3. Redis에서 데이터 삭제
    redis_client.delete(redis_key)

    return jsonify({"message": f"Receipt {receipt_id} approved and moved to MySQL."})

# [화면 4] 전체 보기 (MySQL에 커밋된 값 호출)
@app.route('/api/verified-receipts', methods=['GET'])
def get_verified_receipts():
    conn = get_mysql_connection()
    if not conn:
        return jsonify({"error": "MySQL not connected"}), 500
        
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM verified_receipts ORDER BY approved_at DESC")
            receipts = cursor.fetchall()
            # 날짜/시간 객체는 JSON으로 바로 변환되지 않으므로 문자열로 변환
            for receipt in receipts:
                if 'approved_at' in receipt:
                    receipt['approved_at'] = receipt['approved_at'].isoformat()
                if 'purchase_date' in receipt:
                    receipt['purchase_date'] = receipt['purchase_date'].isoformat()
            return jsonify(receipts)
    except pymysql.MySQLError as e:
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()


# [화면 3] 수동 항목 등록 (카테고리 관리 API 예시)
@app.route('/api/categories', methods=['GET', 'POST'])
def manage_categories():
    conn = get_mysql_connection()
    if not conn:
        return jsonify({"error": "MySQL not connected"}), 500

    try:
        with conn.cursor() as cursor:
            if request.method == 'POST':
                new_category = request.get_json()
                cursor.execute("INSERT INTO categories (name, description) VALUES (%s, %s)",
                               (new_category['name'], new_category.get('description')))
                conn.commit()
                return jsonify({"message": "Category added successfully."}), 201

            # GET 요청
            cursor.execute("SELECT * FROM categories")
            categories = cursor.fetchall()
            return jsonify(categories)
    except pymysql.MySQLError as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

# --- 4. 메인 실행 ---
if __name__ == '__main__':
    # 이 부분은 'python app.py'로 직접 실행할 때만 사용됩니다.
    # Gunicorn을 사용할 때는 Gunicorn이 이 파일을 import하여 'app' 객체를 사용하므로
    # 아래 코드가 직접 실행되지는 않습니다.
    app.run(host='0.0.0.0', port=5000, debug=True)