# AMONDU CI/CD 구축 작업 일지

**날짜**: 2026-06-02  
**작업자**: 박종문

---

## 빠른 실행 명령어 (재시작 시 참고)

### minikube 시작 및 서비스 기동
```powershell
# 1. minikube 시작
minikube start

# 2. 전체 pod 상태 확인
kubectl get pods -n amondu

# 3. 프론트엔드 접속
minikube service frontend-service -n amondu
```

### 이미지 재빌드가 필요한 경우
```powershell
# minikube docker-env 해제 (반드시 먼저 실행)
minikube docker-env -u | Invoke-Expression

# 빌드 (예시: frontend)
docker build -t edtech-frontend:latest -f docker\edtech-frontend\Dockerfile edtech-frontend\

# minikube에 이미지 주입
minikube image load edtech-frontend:latest

# pod 재시작
kubectl rollout restart deployment/edtech-frontend -n amondu
```

### 이전 이미지가 잔존할 때 강제 교체
```powershell
kubectl scale deployment/<서비스명> -n amondu --replicas=0
minikube ssh "docker rmi -f <이미지명>:latest"
minikube image load <이미지명>:latest
kubectl scale deployment/<서비스명> -n amondu --replicas=1
```

### secrets 재적용
```powershell
kubectl apply -f k8s/secrets-template.yaml
kubectl rollout restart deployment -n amondu
```

### 로그 확인
```powershell
kubectl logs -n amondu -l app=<서비스명> --tail=30
kubectl describe pod -n amondu -l app=<서비스명>
```

### MySQL 직접 접속
```powershell
kubectl exec -n amondu -it $(kubectl get pod -n amondu -l app=mysql -o jsonpath='{.items[0].metadata.name}') -- mysql -uroot -p1234
```

---

## 오늘 한 일 요약

1. 6개 서비스 Dockerfile 작성
2. Kubernetes 매니페스트 작성 (namespace, secrets, deployment, service)
3. GitHub Actions CI/CD 워크플로우 작성
4. minikube로 로컬 K8s 배포 및 전체 서비스 기동 확인
5. README CI/CD 섹션 업데이트

---

## 최종 서비스 상태

| 서비스 | 포트 | 상태 |
|--------|------|------|
| edtech-frontend | 80 | ✅ Running |
| edtech-backend | 8080 | ✅ Running |
| edtech-noticeboard | 8083 | ✅ Running |
| edtech-gpt-backend | 8081 | ✅ Running |
| attention-model-fastapi-service | 8001 | ✅ Running |
| edtech-aiquizbackend | 8082 | ✅ Running |
| mysql | 3306 | ✅ Running |

---

## 발생한 오류 및 해결 내역

### 1. nginx.conf not found (edtech-frontend)

**증상**
```
ERROR: failed to solve: "/nginx.conf": not found
```

**원인**  
Dockerfile의 `COPY nginx.conf` 명령은 build context(소스 폴더)에서 파일을 찾는다. `docker build -f docker/edtech-frontend/Dockerfile edtech-frontend/` 형태로 실행하면 build context가 `edtech-frontend/`이므로, `docker/edtech-frontend/nginx.conf`는 찾을 수 없다.

**해결**
```powershell
Copy-Item docker\edtech-frontend\nginx.conf edtech-frontend\nginx.conf
```

---

### 2. libgl1-mesa-glx 패키지 없음 (attention-model-fastapi-service)

**증상**
```
E: Package 'libgl1-mesa-glx' has no installation candidate
```

**원인**  
`libgl1-mesa-glx`는 Debian Buster/Bullseye까지 존재하던 패키지명이다. `python:3.10-slim`의 베이스가 Debian trixie(13)로 업데이트되면서 해당 패키지가 `libgl1`으로 통합됨.

**해결**  
Dockerfile에서 `libgl1-mesa-glx` → `libgl1`으로 수정.

---

### 3. minikube docker-env 사용 시 pip install DNS 실패

**증상**
```
Failed to establish a new connection: [Errno -3] Temporary failure in name resolution
```

**원인**  
`minikube docker-env | Invoke-Expression`을 실행하면 현재 셸의 Docker 클라이언트가 minikube 내부 Docker 데몬을 가리키게 된다. minikube 내부 네트워크는 외부 인터넷이 격리되어 있어 pip install, apt-get 등 외부 패키지 다운로드가 차단됨.

**해결**  
`minikube docker-env -u | Invoke-Expression`으로 원래 Docker Desktop 데몬으로 복원 후 빌드. 완성된 이미지는 `minikube image load`로 주입.

---

### 4. requirements.txt 경로 문제 (attention-model-fastapi-service)

**증상**
```
ERROR: "/requirements.txt": not found
```

**원인**  
#3과 동일한 구조 문제. `requirements.txt`가 `docker/` 폴더에만 있고 소스 폴더에 없어서 build context에서 찾지 못함.

**해결**
```powershell
Copy-Item docker\attention-model-fastapi-service\requirements.txt attention-model-fastapi-service\requirements.txt
```

---

### 5. exec format error (edtech-aiquizbackend)

**증상**
```
exec /usr/local/bin/uvicorn: exec format error
```

**원인**  
Docker 이미지가 빌드 머신의 아키텍처(ARM64, Apple Silicon 등)로 빌드됨. minikube는 amd64(x86_64) 환경에서 실행되므로 ARM 이미지를 실행할 수 없음.

**해결**
```powershell
docker build --platform linux/amd64 -t edtech-aiquizbackend:latest ...
```

---

### 6. MariaDB 드라이버 URL 불일치 (edtech-backend, noticeboard)

**증상**
```
Driver org.mariadb.jdbc.Driver claims to not accept jdbcUrl, jdbc:mysql://...
```

**원인**  
소스코드의 `application.yaml`이 `org.mariadb.jdbc.Driver`와 `jdbc:mariadb://` URL을 사용하는데, secrets-template.yaml에 `jdbc:mysql://`로 잘못 설정함. MariaDB 드라이버는 `jdbc:mysql://` 프로토콜을 처리하지 않음.

**해결**  
secrets-template.yaml 수정:
```yaml
DB_URL: "jdbc:mariadb://mysql-service:3306/edtech?allowPublicKeyRetrieval=true&useSSL=false"
DB_USERNAME: "aivle17"
DB_PASSWORD: "aivle0517"
NOTICEBOARD_DB_URL: "jdbc:mariadb://mysql-service:3306/noticeboard?allowPublicKeyRetrieval=true&useSSL=false"
```
MySQL pod에 유저 및 DB 생성:
```sql
CREATE DATABASE IF NOT EXISTS edtech;
CREATE DATABASE IF NOT EXISTS noticeboard;
CREATE USER IF NOT EXISTS 'aivle17'@'%' IDENTIFIED BY 'aivle0517';
GRANT ALL PRIVILEGES ON *.* TO 'aivle17'@'%';
```

---

### 7. email-validator 누락 (attention-model-fastapi-service)

**증상**
```
ImportError: email-validator is not installed, run `pip install 'pydantic[email]'`
```

**원인**  
소스코드에서 `pydantic`의 `EmailStr` 타입을 사용하는데, 이 타입은 `email-validator` 패키지를 별도로 요구한다. requirements.txt 작성 시 누락됨.

**해결**  
`requirements.txt`에 `email-validator==2.2.0` 추가 후 재빌드.

---

### 8. gpt.model 설정 누락 (edtech-gpt-backend)

**증상**
```
Could not resolve placeholder 'gpt.model' in value "${gpt.model}"
```

**원인**  
`GptService.java`가 `@Value("${gpt.model}")` 어노테이션으로 설정값을 주입받는데, `application.yaml`에 `gpt.model` 키가 없고 K8s deployment에도 해당 환경변수가 없었음. Spring은 placeholder를 해석하지 못하면 애플리케이션 컨텍스트 로딩을 중단함.

**해결**  
`k8s/gpt-backend/deployment.yaml`에 환경변수 추가:
```yaml
- name: GPT_MODEL
  value: "gpt-4o"
- name: GPT_API_KEY
  valueFrom:
    secretKeyRef:
      name: amondu-secrets
      key: OPENAI_API_KEY
```

---

### 9. readinessProbe 403으로 READY 0/1 (edtech-backend)

**증상**  
pod STATUS는 Running이지만 READY가 0/1로 트래픽을 받지 못하는 상태.

**원인**  
Spring Security 기본 설정은 인증 없이 모든 엔드포인트를 차단한다. readinessProbe가 `/actuator/health`에 GET 요청을 보내면 403을 받아 실패 처리되고, K8s는 해당 pod를 ready 상태로 보지 않음.

**해결**  
`k8s/backend/deployment.yaml`에서 readinessProbe 블록 제거. (근본 해결은 Spring Security에서 actuator 엔드포인트 허용 설정 추가)

---

### 10. 이미지 재빌드 후에도 이전 이미지 사용 (minikube)

**증상**  
`minikube image load` 후 재시작해도 에러가 동일하게 발생.

**원인**  
종료된(Terminated) 컨테이너가 이미지 레이어 참조를 유지하고 있어 `docker rmi`로 삭제가 되지 않음. 그 결과 새 이미지 로드가 덮어쓰지 못하고 기존 이미지 ID가 그대로 사용됨.

**해결**
```powershell
# pod를 0으로 내려 컨테이너 참조 해제
kubectl scale deployment/<서비스명> -n amondu --replicas=0
# minikube 내부에서 강제 삭제
minikube ssh "docker rmi -f <이미지명>:latest"
# 새 이미지 로드
minikube image load <이미지명>:latest
# pod 재기동
kubectl scale deployment/<서비스명> -n amondu --replicas=1
```

---

## 잔여 작업

- [ ] OpenAI API 키 revoke 및 교체 (오늘 키 노출됨 — 즉시 처리 필요)
- [ ] GitHub Actions + Azure AKS 연결
- [ ] Kafka 설계 및 구현 (리팩터링 단계)
- [ ] minikube registry 설정으로 이미지 영속성 확보
- [ ] Spring Security actuator 엔드포인트 허용 설정 추가
- [ ] README Preview 섹션 스크린샷 추가
- [ ] 팀원 역할 기재
