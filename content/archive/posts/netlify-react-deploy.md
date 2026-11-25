---
title: "Netlify로 React 프로젝트 배포하기"
description: gh-pages 대신 Netlify로 React 프로젝트를 배포한다. GitHub 연동, 빌드 설정과 환경 변수, SPA 라우팅용 netlify.toml, 가비아에서 산 커스텀 도메인 연결.
date: 2023-11-29
tags: [react, deploy]
keywords: [Netlify, 넷리파이, 배포, deploy, gh-pages, netlify.toml, redirects, CI=, 커스텀 도메인, custom domain, 가비아, 네임서버, DNS]
---

gh-pages로 배포하던 방식 그대로 새 프로젝트를 올렸더니 CORS를 포함한 여러 에러로 결과물이 제대로 배포되지 않았다. 그래서 Netlify로 배포 방식을 바꿨다.

## Netlify

Netlify는 정적 웹사이트 배포·호스팅 플랫폼이다. GitHub 등과 연동해 커밋마다 자동 배포하고, 브랜치 배포와 CDN 등을 지원한다([Netlify](https://www.netlify.com/)).

### 시작하기

GitHub과 연동할 것이므로 GitHub 계정으로 로그인한다.

![](/images/netlify-react-deploy/01.webp)

`Sites -> Add new site`에서 배포 방식을 고른다. GitHub에 있는 코드를 배포하므로 `Import an existing project`를 선택한다.

![](/images/netlify-react-deploy/02.webp)

`Deploy with Github`를 선택하면 GitHub repository 목록이 나온다. 예시로는 강의에서 만든 Netflix clone 페이지를 배포했다.

### 배포하기

repository를 선택하면 build setting 화면이 나온다.

![](/images/netlify-react-deploy/03.webp)

> 이때 Build command를 `CI= npm run build`로 바꿔 주어야 한다. Netlify는 빌드할 때 `CI=true` 환경 변수를 설정하는데, create-react-app은 CI 환경에서 ESLint 경고를 에러로 처리해서 경고가 하나라도 있으면 빌드가 실패한다. `CI=`로 값을 비워 주면 이를 피할 수 있다. 띄어쓰기까지 똑같이 `CI= npm run build`로 해 주어야 한다.

배포할 branch, build command 등을 설정하고, `.gitignore`로 GitHub에 올라가지 않는 API_KEY 같은 값은 `Add environment variables`에서 따로 넣는다. 보통 `.env`에 있는 변수를 모두 넣어야 한다.

![](/images/netlify-react-deploy/04.webp)

Router를 쓰는 SPA라면 프로젝트 루트(package.json, tsconfig와 같은 위치)에 `netlify.toml`을 만들고 다음 내용을 추가한다.

```toml title="netlify.toml"
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

새로고침 등으로 어떤 경로로 들어오든 200 status로 `index.html`을 응답한다는 뜻이다.

설정을 마치고 Deploy "프로젝트 명" 버튼을 누르면 배포가 시작된다. 2~3분 정도 걸렸다. 완료되면 Open production deploy에서 배포된 사이트를 확인할 수 있다.

[Netflix_Clone 사이트 (https://main--moonlit-cocada-e0073b.netlify.app/)](https://main--moonlit-cocada-e0073b.netlify.app/)에 배포되었다. 원하는 도메인을 따로 구매해 연결할 수도 있다.

## (추가) 커스텀 도메인

Netlify가 제공하는 도메인을 그대로 써도 되지만, 커스텀 도메인도 연결했다. 도메인은 [가비아](https://domain.gabia.com/)에서 샀다. 다른 등록 업체여도 과정은 같다.

![](/images/netlify-react-deploy/05.webp)

가격은 1년 구독 기준이다.

도메인을 Netlify와 연결하려면 네임서버를 설정해야 한다. 소유한 도메인은 MY 가비아에서 관리한다.

![](/images/netlify-react-deploy/06.webp)

스크린샷은 이미 네임서버를 설정한 상태다. 새로 연결하는 경우 Netlify의 Domain Management에서 확인한 네임서버를 여기에 설정한다.

먼저 Netlify에 구매한 도메인을 등록한다.

![](/images/netlify-react-deploy/07.webp)

Add a domain으로 도메인을 등록하면 도메인을 관리할 수 있다.

![](/images/netlify-react-deploy/08.webp)

등록이 끝나면 `Netlify DNS`, 아직 연결되지 않았으면 `Awaiting External DNS`로 표시된다.

Options - Go to DNS Panel에서 사이트의 네임서버를 확인할 수 있다.

![](/images/netlify-react-deploy/09.webp)

이 네임서버를 가비아의 도메인 관리 창에 추가하면 연결된다. 반영까지 최대 24시간이 걸릴 수 있고, 이때는 5시간 정도 걸렸다.
