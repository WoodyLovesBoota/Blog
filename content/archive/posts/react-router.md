---
title: "React Router로 새로고침 없이 화면 이동하기 (Nested Route 포함)"
description: React Router의 Routes, Route, Link로 새로고침 없는 화면 이동을 만들고, useParams로 URL 값을 꺼내 쓰고, 중첩 Route와 Outlet으로 화면 일부만 바꾸는 방법까지 정리했다.
date: 2023-08-30
updated: 2026-11-25
tags: [react, react-router]
keywords: [React Router, react-router-dom, Client Side Routing, 클라이언트 사이드 라우팅, Routes, Route, Link, useParams, Nested Routes, 중첩 라우팅, Outlet, SPA]
---

React Router는 React에서 client side routing을 해 주는 라이브러리다. [공식 문서](https://reactrouter.com/en/main/start/overview)의 설명을 옮기면 이렇다.

> Client side routing allows your app to update the URL from a link click without making another request for another document from the server.

링크를 눌러 URL이 바뀌어도 서버에 새 HTML을 요청하지 않고, React가 바로 새 화면을 그린다.

## 설치

```bash
npm i react-router-dom
```

> 글을 쓴 2023년 8월 기준 최신 버전인 v6을 사용했다.

## 화면 이동하기: Routes, Route, Link

`Route`로 경로와 보여 줄 component를 짝지어 두고, `Link`로 그 경로로 이동한다.

```jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/detail" element={<Detail />} />
      </Routes>
    </Router>
  );
}

const Home = () => (
  <div>
    <h1>This is Home Screen</h1>
    <Link to="/detail">Go to detail</Link>
  </div>
);

const Detail = () => (
  <div>
    <h3>This is Detail Screen</h3>
  </div>
);
```

![](/images/react-router/01.webp)

페이지가 새로고침되지 않고 화면만 바뀐다.

## URL 값 꺼내 쓰기: useParams

path를 `/detail/:id`처럼 지정하면 `:id` 자리에 들어온 값을 `useParams()`로 꺼낼 수 있다. 인물 카드 목록을 만들고, 카드를 누르면 그 카드의 번호를 Detail 화면에 보여 주도록 했다.

```jsx
const User = () => {
  const users = [
    { id: 1, name: "Garrett Taylor", age: 44, country: "Greece" },
    // ...
  ];

  return (
    <Container>
      {users.map((card) => (
        <Card key={card.id}>
          <Link to={`detail/${card.id}`}>
            <span>{card.id}</span>
            <span>{card.name}({card.age})</span>
            <span>{card.country}</span>
          </Link>
        </Card>
      ))}
    </Container>
  );
};
```

```jsx
const Detail = () => {
  const { id } = useParams();
  return (
    <div>
      <h3>This is Detail Screen</h3>
      <h2>You choose card no.{id}</h2>
    </div>
  );
};
```

![](/images/react-router/02.webp)

## 화면 일부만 바꾸기: Nested Route와 Outlet

위 예제에서는 카드를 누르면 화면 전체가 Detail로 바뀐다. 카드 목록은 그대로 두고 **아래쪽에만** 상세 정보를 보여 주려면 다른 구성이 필요하다.

![](/images/react-router/03.webp)

Detail 화면에 Home의 내용을 전부 다시 쓰면 코드가 중복된다. 이럴 때 Route 안에 Route를 넣는다.

```jsx
<Router>
  <Routes>
    <Route path="/" element={<Home />}>
      <Route path="detail/:id" element={<Detail />} />
    </Route>
  </Routes>
</Router>
```

이렇게만 하면 카드를 눌렀을 때 URL은 바뀌는데 Detail은 보이지 않는다. 부모 component가 자식 Route를 어디에 그릴지 모르기 때문이다. 그 자리를 `Outlet`으로 지정해 준다.

```jsx
import { Outlet } from "react-router-dom";

const Home = () => (
  <div>
    <h1>This is Home Screen</h1>
    <User />
    <Outlet />
  </div>
);
```

![](/images/react-router/04.webp)

`Outlet` 자리에 Detail이 그려진다. 목록은 그대로 있고 아래쪽 내용만 URL에 따라 바뀐다.
