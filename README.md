# OcrAccounting




Project Structure
./
├── backend/            # Python Flask API Server
├── frontend/           # Nginx Server and UI files (HTML/CSS/JS)
├── ocr_processor/      # Python script for OCR and Gemini API calls
├── db_init/            # SQL scripts for initial DB setup
├── receipts_to_process/ # Shared volume for receipt images
├── .env                # Environment variables (API Keys, Passwords)
├── docker-compose.yml  # Main Docker Compose configuration
└── README.md



How to Use

1. Access the Web UI: Open your browser and navigate to `http://localhost:5001`.

2. Upload Receipts**: In panel-1, select one or more receipt image files and click "Upload".
    The files will be saved to the `receipts_to_process` folder.

3. Run the OCR Processor**: In your terminal, manually trigger the OCR processing script.
    This container will start, process all new images in the folder, and then stop.
   
    docker-compose run --rm ocr-processor python run.py


4. Verify and Approve: Refresh the web UI.
    The newly processed receipts will appear in panel-2 ("Awaiting Approval").
    Review the data and click the "Approve" button.

5.  Check Final Data: Once approved, the receipt will disappear from panel #2 and appear in panel #4 ("Approved Receipts"), confirming it has been saved to the MySQL database.



mermaid
graph TD
    subgraph 사용자 상호작용
        User[사용자] --> Browser[브라우저]
    end

    subgraph Docker 네트워크
        Browser -- HTTP 요청 --> Frontend[프론트엔드 <br>(Nginx)]
        
        Frontend -- /api/ --> Backend[백엔드 <br>(Flask API)]
        Frontend -- / (HTML/CSS/JS) --> Browser

        subgraph 데이터 흐름
            Backend -- 이미지 저장 --> SharedVolume[📂 receipts_to_process]
            OCR[OCR 프로세서 <br>(수동 실행)] -- 이미지 읽기 --> SharedVolume
        end
        
        OCR -- OCR 텍스트 --> Gemini[Google Gemini API-FreeVersion]
        Gemini -- 구조화된 JSON --> OCR
        OCR -- JSON 저장 --> Redis[⚡ Redis <br>(미검증 데이터)]

        Backend -- 데이터 읽기 --> Redis
        Backend -- 데이터 쓰기 --> MySQL[MySQL <br>(검증 완료 데이터)]
    end



- Backend: Python, Flask, Gunicorn
- Frontend: Nginx, HTML, CSS, JavaScript (Vanilla JS)
- Databases: Redis, MySQL
- Containerization: Docker, Docker Compose
- OCR / AI : Tesseract OCR, Google Gemini API-FreeVersion



This project is licensed under the MIT License.