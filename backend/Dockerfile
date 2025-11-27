# ./backend/Dockerfile

# 1. 기반 이미지 설정 (최신 버전의 경량 이미지 사용)
# 'slim' 버전으로사용
FROM python:3.11-slim

# 2. 작업 디렉토리 설정
# 컨테이너 내부에서 명령이 실행될 기본 경로를 지정
WORKDIR /app

# 3. 의존성 설치 (가장 중요한 최적화 단계)
# requirements.txt 파일만 먼저 복사하여 라이브러리를 설치
# 이렇게 하면 소스 코드만 변경되었을 때, 매번 라이브러리를 새로 설치하지 않고
# Docker의 캐시를 사용하여 빌드 속도가 매우 빨라? 제발
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 소스 코드 복사
# 의존성 설치가 끝난 후, 나머지 모든 소스 코드를 작업 디렉토리로 복사
COPY . .

# 5. 포트 노출
# 컨테이너가 5000번 포트를 사용할 것임을 명시적으로 알리기
EXPOSE 5000

# 6. 애플리케이션 실행
# 컨테이너가 시작될 때 실행할 명령어를 지정합니다.
# 0.0.0.0 으로 바인딩해야 Docker 컨테이너 외부(다른 컨테이너)에서 접근 가능합니다.
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5000", "app:app"]
# 'app:app' -> 'app.py' 파일 안에 있는 'app'이라는 이름의 Flask/FastAPI 객체를 의미