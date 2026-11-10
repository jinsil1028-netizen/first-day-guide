# 첫 출근 전 공지 작성

직원별 첫 출근 공지를 작성하고 공유하는 웹 앱입니다.

## 실행과 배포

- 로컬에서는 `python3 -m http.server 8765 --directory dist`를 실행한 뒤 `http://localhost:8765`를 엽니다.
- Vercel에서 저장소를 가져오면 `vercel.json`에 따라 `dist`가 정적 웹으로 배포됩니다. 설치와 빌드 명령은 필요하지 않습니다.
- 배포본은 Supabase의 `firstday-guide-kr` 프로젝트와 `guide-links` Edge Function을 사용합니다. 공개용 anon 키만 웹 코드에 포함합니다.

## 공지 저장

공유 링크를 만들면 브라우저가 공지를 AES-GCM으로 암호화합니다. Supabase에는 암호화된 공지, 링크 ID, 생성 시간이 저장됩니다. 복호화 키는 발급된 링크의 주소 조각에 포함됩니다. 직원 체크 상태는 해당 탭의 세션 저장소에 남고, 초안은 브라우저의 로컬 저장소에 남습니다. 기존 형식의 링크도 열 수 있습니다.

새 Supabase 프로젝트로 옮길 때는 `supabase/schema.sql`을 한 번 실행하고, `supabase/functions/guide-links`를 JWT 검증을 켠 상태로 배포한 뒤 `dist/index.html`의 프로젝트 URL과 공개용 anon 키를 바꿉니다. Edge Function의 서비스 역할 키는 Supabase 런타임에서 제공됩니다.
