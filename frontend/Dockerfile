# ./frontend/Dockerfile

# 1. 기반 이미지 설정 (안정적인 최신 버전의 초경량 alpine 이미지 사용)
FROM nginx:1.25-alpine

# 2. 정적 웹 파일(UI) 복사
# 로컬의 ./html 폴더에 있는 모든 파일(index.html, style.css 등)을
# Nginx 컨테이너의 기본 웹 루트 디렉토리인 /usr/share/nginx/html 로 복사
COPY ./html/ /usr/share/nginx/html

# 3. 사용자 정의 Nginx 설정 파일 복사 및 # 기본 설정을 덮어쓰기
#  이 파일에 리버스 프록시 설정이 들어있어서 백엔드 API 서버로 요청을 전달
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 4. 포트 노출
# Nginx는 기본적으로 80번 포트를 사용합니다.
EXPOSE 80

# 5. Nginx 실행
# 잘 되길 기도하기
# 컨테이너가 시작되면 자동으로 Nginx가 실행됩니다.