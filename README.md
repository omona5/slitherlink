# Slitherlink · 슬리더링크

점을 이어 하나의 닫힌 고리를 만드는 한국어 논리 퍼즐. HTML, CSS, 순수 JavaScript로 구현했으며 서버·설치·빌드 없이 GitHub Pages에서 서비스합니다.

## 실행

Node.js 22 이상과 Python 3가 있으면 다음 명령을 사용하세요.

```sh
npm start
```

브라우저에서 http://127.0.0.1:4173 으로 접속합니다. ES 모듈과 JSON을 사용하므로 파일을 더블클릭하는 대신 HTTP 서버로 열어야 합니다. 다른 정적 서버도 사용할 수 있습니다.

```sh
npm test
npm run generate
```

`generate`는 유일해 검사를 거친 36개 기본 퍼즐을 다시 생성합니다. 각 퍼즐을 회전·반사한 최대 288개 조합을 사용하며 같은 조합이 다시 나타날 수 있습니다. 일일 퍼즐은 한국 시간 날짜·크기·난이도로 결정됩니다. 난이도는 남기는 숫자 비율로 나뉘며 사람의 체감 난이도를 보장하지는 않습니다.

## 기능

- 5×5, 7×7, 9×9 / 쉬움·보통·어려움
- 오늘의 퍼즐과 자유 연습
- 클릭·터치로 선, 우클릭 또는 × 도구로 빈 변 표시
- 키보드 Tab, Enter, Space, X / Ctrl 또는 Cmd+Z, Shift+Z
- 실행 취소·다시 실행, 정답 기반 한 변 힌트, 초기화, 타이머·일시 정지
- 숫자·분기 오류 표시, 연결성과 단일 고리까지 검사하는 완료 판정
- 브라우저 로컬 저장: 모드·크기·난이도별 진행 상황, 시간, 힌트, 완성 기록. 새 연습을 시작하면 해당 조합의 이전 연습 진행은 교체됩니다.
- 반응형 한국어 UI. Google Fonts 로드 실패 시 시스템 글꼴로 동작합니다.

## GitHub Pages 배포

대상 저장소: https://github.com/omona5/slitherlink

1. `main` 브랜치로 푸시합니다.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
3. **Actions → Test and deploy GitHub Pages** 워크플로가 성공하는지 확인합니다. 설정을 늦게 바꿨다면 **Run workflow**를 누릅니다.
4. **Settings → Pages → Custom domain**에 `slitherlink.omona.dev`를 입력하고 저장합니다. Actions 배포에서는 `CNAME` 파일만으로 도메인이 등록되지 않으므로 이 설정이 필요합니다.
5. `omona.dev`의 DNS 관리 화면에 **CNAME / 이름: slitherlink / 대상: omona5.github.io** 레코드를 등록합니다. 대상에 `https://`나 `/slitherlink` 경로를 붙이지 않습니다.
6. DNS 검사와 인증서 발급이 끝나면 **Enforce HTTPS**를 켭니다.

GitHub 공식 가이드: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

배포 워크플로는 퍼즐 검증을 통과한 뒤 공개 파일만 묶어 배포합니다. 외부 패키지 설치가 필요하지 않습니다.

## 구현

`engine.js`: 격자·판정·제약 전파/탐색 해법·대칭 변환. `scripts/generate.js`: 단일 고리 생성과 숫자 제거, 유일해 검증. `app.js`: UI와 로컬 저장. `puzzles.json`: 검증된 퍼즐 데이터.

게임 구성과 조작 참고: https://playpendium.com/fences/ . UI·소스·퍼즐 데이터는 새로 구현했습니다.
