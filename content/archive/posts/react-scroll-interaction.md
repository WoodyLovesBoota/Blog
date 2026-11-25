---
title: "스크롤 값을 활용해 자연스러운 웹사이트 만들기"
description: window.scrollY를 state로 만들어 스크롤에 따라 바뀌는 Navigation Bar를 만들고, scrollIntoView와 scrollTo로 원하는 위치로 스크롤을 이동시킨다.
date: 2024-01-02
tags: [react, javascript, styled-components]
keywords: [scroll, 스크롤, scrollY, scrollIntoView, scrollTo, useRef, useEffect, Navigation Bar, 네비게이션 바, scroll event]
---

## 현재 위치 가져오기

현재 스크롤 위치는 `window.scrollY`로 읽는다.

```js
window.addEventListener("scroll", () => { console.log(window.scrollY) })
```

`useEffect`에서 scroll 이벤트를 구독해 state로 만들면 component에서 스크롤 위치를 쓸 수 있다.

```ts
const [scrollY, setScrollY] = useState(0);

useEffect(() => {
  const handleScroll = () => {
    setScrollY(window.scrollY);
  };
  window.addEventListener("scroll", handleScroll);
  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, []);
```

아래는 스크롤이 최상단에 있을 때 높이가 커지는 Navigation Bar다.

![](/images/react-scroll-interaction/01.webp)

```tsx
<Wrapper istop={scrollY === 0}>
...
</Wrapper>

const Wrapper = styled.div<{ istop: boolean }>`
  height: ${(props) => (props.istop ? "80px" : "60px")};
`;
```

## 스크롤 이동시키기

`useRef`로 DOM 요소를 참조하고 그 요소의 `scrollIntoView`를 호출하면 해당 컴포넌트로 스크롤이 이동한다.

```tsx
const boxRef = useRef<HTMLDivElement>(null);
const onClick = () => {
  boxRef.current?.scrollIntoView({ behavior: "smooth" });
};
...
<Box ref={boxRef} />
<Button onClick={onClick}>Box로 이동</Button>
```

### Method

옵션으로 정렬 위치(위, 아래, 중앙 등)와 스크롤 방식(smooth, instant)을 정할 수 있다([MDN](https://developer.mozilla.org/ko/docs/Web/API/Element/scrollIntoView)).

메뉴를 누르면 해당 섹션으로 이동하는 Navigation Bar 예시다.

![](/images/react-scroll-interaction/02.webp)

```tsx
const portfolioRef = useRef<HTMLDivElement>(null);
const onPortfolioClick = () => {
  portfolioRef.current?.scrollIntoView({ behavior: "smooth" });
};

<Content onClick={onPortfolioClick}>PORTFOLIO</Content>
...
<Portfolios ref={portfolioRef} />
```

`block: "center"`를 주면 컴포넌트의 중앙으로 이동한다.

![](/images/react-scroll-interaction/03.webp)

```tsx
const portfolioRef = useRef<HTMLDivElement>(null);
const onPortfolioClick = () => {
  portfolioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
};

<Content onClick={onPortfolioClick}>PORTFOLIO</Content>
...
<Portfolios ref={portfolioRef} />
```

## 컴포넌트에 도착하면 State 변화시키기

목표는 현재 보고 있는 섹션을 Navigation Bar에 표시하는 것이다. 섹션 수가 적어서, 위에서부터 각 섹션의 `scrollHeight`를 누적해 구간을 나누고 현재 `scrollY`가 어느 구간에 있는지 비교했다.

```tsx
useEffect(() => {
  if (scrollY < mainRef.current?.scrollHeight + 300) setIsnow(0);
  else if (
    scrollY > mainRef.current?.scrollHeight + 300 &&
    scrollY < mainRef.current?.scrollHeight + portfolioRef.current.scrollHeight + 300
  ) setIsnow(1);
  else if (
    scrollY > mainRef.current?.scrollHeight + portfolioRef.current.scrollHeight + 300 &&
    scrollY < mainRef.current?.scrollHeight + portfolioRef.current.scrollHeight + blogRef.current.scrollHeight + 300
  ) setIsnow(2);
  else if (scrollY > mainRef.current?.scrollHeight + portfolioRef.current.scrollHeight + blogRef.current.scrollHeight + 300) setIsnow(3);
}, [scrollY]);

...

<MainContent ref={mainRef} />
<Projects ref={portfolioRef} />
<Blog ref={blogRef} />
<Contact ref={contactRef} />
```

컴포넌트는 위에서부터 다음과 같이 배치되어 있다.

1. Main
2. Portfolio
3. Blog
4. Contact

예를 들어 `Main 높이 < scrollY < Main 높이 + Portfolio 높이`이면 `isnow`를 1(Portfolio)로 바꾼다. 코드의 `300`은 판정 구간을 조정하는 오프셋이다.

Navigation Bar는 `isnow`로 현재 섹션에 밑줄을 표시한다.

```tsx
<Content onClick={onBlogClick}>BLOG{isnow === 2 && <UnderBar />}</Content>
```

![](/images/react-scroll-interaction/04.webp)

## 고정된 위치로 스크롤 이동하기

특정 컴포넌트가 아니라 고정된 좌표로 이동할 때는 `window.scrollTo()`를 쓴다.

```tsx
<Button onClick={() => { window.scrollTo(0, 0); }}>BACK TO TOP</Button>
```

![](/images/react-scroll-interaction/05.webp)
