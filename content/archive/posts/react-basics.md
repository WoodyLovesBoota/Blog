---
title: "React 기초 정리 - JSX부터 State, Props, useEffect, 스타일링까지"
description: 버튼을 누르면 숫자가 올라가는 counter 하나를 Vanilla JS, JSX, create-react-app 순서로 다시 만들면서 state, props, useEffect, 그리고 React에서 스타일을 적용하는 네 가지 방법을 정리했다.
date: 2023-08-22
updated: 2026-11-25
tags: [react, javascript, jsx, create-react-app, styled-components]
keywords: [React 기초, Vanilla JS, JSX, createElement, create-react-app, CRA, useState, props, useEffect, dependency array, 의존성 배열, inline style, CSS Module, styled-components]
---

## 1. Vanilla JS로 만든 counter

HTML과 JS만으로 화면을 만들려면 세 단계를 거친다.

1. HTML에 element를 만든다.
2. JS에서 `getElementById()`, `querySelector()`로 element를 불러온다.
3. `addEventListener()`로 event handler를 붙이고, 값이 바뀔 때마다 직접 화면을 고친다.

```html
<body>
  <span>Total clicks: 0</span>
  <button id="btn">Click me</button>
  <script>
    let counter = 0;
    const button = document.getElementById("btn");
    const span = document.querySelector("span");
    button.addEventListener("click", () => {
      counter++;
      span.innerText = `Total clicks: ${counter}`;
    });
  </script>
</body>
```

![](/images/react-basics/01.webp)

예제가 작을 때는 문제가 없지만, 화면이 커지면 두 가지가 불편해진다.

- **읽기 어렵다.** 반복되는 코드가 많아지고 element 구조를 한눈에 파악하기 힘들다. (아래 이미지는 GitHub 메인 페이지의 HTML이다.)
- **고치기 어렵다.** 버튼이 1000개라면 속성 하나를 바꿀 때 같은 작업을 1000번 해야 한다. HTML과 JS를 계속 오가야 하는 것도 번거롭다.

![](/images/react-basics/02.webp)

## 2. React로 옮기기: createElement에서 JSX로

같은 화면을 React로 만든다. CDN으로 React와 ReactDOM을 불러오고, element를 HTML이 아니라 JS에서 만든다.

```html
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@17.0.2/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js"></script>
  <script>
    const root = document.getElementById("root");
    const span = React.createElement("span", null, "Total clicks: 0");
    const btn = React.createElement(
      "button",
      { onClick: () => console.log("clicked!") },
      "Click me"
    );
    const container = React.createElement("div", null, [span, btn]);
    ReactDOM.render(container, root);
  </script>
</body>
```

> 숫자를 화면에 반영하려면 state가 필요해서, 여기서는 클릭하면 `console.log`만 찍는다. state는 4장에서 다룬다.

HTML은 `root` div 하나만 남고, event handler를 element를 만들 때 같이 넘길 수 있게 되었다. 하지만 `createElement`를 줄줄이 부르는 코드는 여전히 읽기 쉽지 않다.

이 문제를 JSX가 해결한다. JSX는 JS 안에서 HTML처럼 element를 쓸 수 있게 해 주는 문법이고, 브라우저에서 실행되기 전에 babel이 일반 JS로 바꿔 준다.

```html
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel">
  const root = document.getElementById("root");
  const Title = () => <span>Total clicks: 0</span>;
  const Button = () => <button onClick={() => console.log("clicked!")}>Click me</button>;
  const Container = (
    <div>
      <Title />
      <Button />
    </div>
  );
  ReactDOM.render(Container, root);
</script>
```

![](/images/react-basics/03.webp)

`div` 안에 `Title`과 `Button`이 하나씩 있다는 것이 바로 보인다. 버튼의 동작을 바꾸고 싶으면 `Button` 하나만 고치면 모든 버튼에 반영된다.

## 3. create-react-app으로 프로젝트 만들기

CDN으로 React를 불러오는 방식은 동작 원리를 이해하는 데는 좋지만 실제로는 잘 쓰지 않는다. 보통은 [Node.js](https://nodejs.org/ko)를 설치한 뒤 create-react-app으로 프로젝트를 만든다.

```bash
npx create-react-app my-app
cd my-app
npm start
```

![](/images/react-basics/04.webp)

만들어진 폴더 구조는 다음과 같다.

```text
my-app/
  package.json
  public/
    index.html
  src/
    App.js
    index.js
    ...
```

[공식 문서](https://create-react-app.dev/docs/folder-structure)에 따르면 `src`에는 JS와 CSS를 넣고, 빌드하면 `public/index.html`이 이 파일들을 품고 브라우저에 뜬다. 불필요한 코드를 지우면 핵심은 세 파일이다.

```html title="public/index.html"
<body>
  <div id="root"></div>
</body>
```

```jsx title="src/index.js"
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
```

```jsx title="src/App.js"
function App() {
  return <div>Hi!</div>;
}

export default App;
```

`App`이 return한 것을 `index.js`가 `index.html`의 `root` div에 그린다. 2장에서 CDN으로 하던 일을 도구가 대신 해 주는 것이다.

## 4. State: 값이 바뀌어도 화면이 그대로인 이유

가장 단순한 방법은 변수를 하나 두고 클릭할 때마다 늘리는 것이다.

```jsx
function App() {
  let counter = 0;

  return (
    <div>
      <h2>Total clicks: {counter}</h2>
      <button onClick={() => counter++}>click me</button>
    </div>
  );
}
```

버튼을 눌러도 화면의 숫자는 0 그대로다. `console.log`로 찍어 보면 `counter` 값 자체는 올라가고 있다.

![](/images/react-basics/05.webp)

값은 바뀌었지만 React가 화면을 다시 그리지 않았기 때문이다. React는 **state가 바뀔 때** component를 다시 그린다(re-rendering). state는 `useState` Hook으로 만든다.

```jsx
const [counter, setCounter] = useState(0);
```

- 인자는 초기값이다.
- 반환값은 `[현재 값, 값을 바꾸는 함수]` 배열이다.

`setCounter`로 값을 바꾸면 `App`이 다시 그려지면서 화면도 바뀐다.

```jsx
import { useState } from "react";

function App() {
  const [counter, setCounter] = useState(0);

  return (
    <div>
      <h2>Total clicks: {counter}</h2>
      <button onClick={() => setCounter((prev) => prev + 1)}>click me</button>
    </div>
  );
}
```

![](/images/react-basics/06.webp)

## 5. Props: component에 값과 함수 넘기기

[React 문서](https://legacy.reactjs.org/docs/components-and-props.html)는 component를 "props라는 입력을 받아 화면에 보일 React element를 반환하는 함수"라고 설명한다. 즉 props는 **component의 입력값**이다.

증가 버튼과 감소 버튼이 필요한 경우, `ButtonIncrease`, `ButtonDecrease`를 따로 만들 수도 있지만, 버튼이 늘어날 때마다 component를 새로 만들어야 한다. 대신 `Button` 하나를 만들고 다른 부분만 props로 넘긴다.

```jsx
<Button name="increase" />
```

이렇게 쓰면 `Button`은 `{ name: "increase" }` 객체를 props로 받는다.

![](/images/react-basics/07.webp)

props에는 값뿐 아니라 함수도 넘길 수 있다. 클릭했을 때 실행할 함수까지 넘기면 counter가 완성된다.

```jsx
import { useState } from "react";

const Button = (props) => {
  return <button onClick={props.func}>{props.name}</button>;
};

function App() {
  const [counter, setCounter] = useState(0);

  const increaseCounter = () => setCounter(counter + 1);
  const decreaseCounter = () => setCounter(counter - 1);

  return (
    <div>
      <h2>Total clicks: {counter}</h2>
      <Button name="increase" func={increaseCounter} />
      <Button name="decrease" func={decreaseCounter} />
    </div>
  );
}

export default App;
```

![](/images/react-basics/08.webp)

## 6. useEffect: 코드가 실행되는 시점 정하기

state가 바뀌면 component 함수 전체가 다시 실행된다. 대부분은 이게 편하지만, 처음 한 번만 실행하면 되는 코드도 있다. 대표적인 것이 API 호출이다. 버튼을 누르거나 글자를 칠 때마다 API를 다시 부르면 쓸데없는 요청이 쌓이고 화면도 느려진다.

`useEffect`를 쓰면 특정 코드를 언제 실행할지 정할 수 있다.

```jsx
useEffect(() => {
  console.log("I ran!");
}, [age]);
```

- 첫 번째 인자는 실행할 함수다.
- 두 번째 인자(dependency array)는 실행 조건이다. 배열에 넣은 state가 바뀔 때만 함수가 다시 실행된다.
  - 빈 배열 `[]`이면 처음 render될 때 한 번만 실행된다.
  - 두 번째 인자를 아예 빼면 render될 때마다 실행되니 주의해야 한다.

아래 예제는 `name`과 `age` 두 state를 두고, `age`가 바뀔 때만 현재 위치의 날씨를 다시 불러온다.

```jsx
import { useState, useEffect } from "react";

const API_KEY = "...";

function App() {
  const [name, setName] = useState("Not woody");
  const [age, setAge] = useState(0);
  const [city, setCity] = useState("");
  const [temp, setTemp] = useState(0);

  const getWeather = async ({ coords }) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`;
    const data = await (await fetch(url)).json();
    setCity(data.name);
    setTemp(data.main.temp);
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(getWeather, console.error);
  }, [age]);

  return (
    <div>
      <h1>You are in {city}</h1>
      <h1>Temperature: {temp}</h1>
      <h1>I am {name}</h1>
      <h2>I am {age} years old</h2>
      <button onClick={() => setName(name === "woody" ? "Not woody" : "woody")}>change name</button>
      <button onClick={() => setAge(age + 1)}>change age</button>
    </div>
  );
}
```

![](/images/react-basics/09.webp)

처음 render될 때와 `age`가 바뀔 때는 API가 호출되고, `name`이 바뀔 때는 호출되지 않는다.

## 7. 스타일 적용하는 네 가지 방법

주황색 원과 파란색 원을 나란히 그리는 예제로 네 가지 방법을 비교했다.

### Inline style

```jsx
<div style={{ display: "flex" }}>
  <div style={{ backgroundColor: "orange", width: "200px", height: "200px", borderRadius: "100px" }} />
  <div style={{ backgroundColor: "blue", width: "200px", height: "200px", borderRadius: "100px" }} />
</div>
```

따로 파일이 필요 없어 쓰기는 편하다. 하지만 색만 다른 원 두 개인데도 나머지 스타일을 똑같이 두 번 써야 한다. 코드가 커지면 중복이 감당이 안 된다.

### CSS 파일 (stylesheet)

```jsx
<div className="main">
  <div className="circle circle__orange" />
  <div className="circle circle__blue" />
</div>
```

```css
.main { display: flex; }
.circle { width: 200px; height: 200px; border-radius: 200px; }
.circle__orange { background-color: orange; }
.circle__blue { background-color: blue; }
```

class 이름만 봐도 무슨 원인지 알 수 있고, 같은 스타일은 class를 붙이기만 하면 된다. 다만 React 프로젝트에는 component가 많고, 모두 같은 CSS를 공유하니 component마다 class 이름이 겹치지 않게 신경 써야 한다. A component에만 작은 원이 필요하면 `circle__small` 같은 이름을 또 만들어야 한다.

### CSS Module

component마다 `*.module.css` 파일을 따로 두는 방법이다.

```jsx title="CircleOrange.js"
import styles from "./CircleOrange.module.css";

const CircleOrange = () => <div className={styles.circle} />;
export default CircleOrange;
```

```css title="CircleOrange.module.css"
.circle {
  width: 200px;
  height: 200px;
  border-radius: 100px;
  background-color: orange;
}
```

`CircleBlue`도 같은 방식으로 만들고 class 이름을 똑같이 `circle`로 줘도 색이 각각 다르게 나온다. 빌드할 때 파일 이름과 해시를 붙인 고유한 class 이름이 자동으로 만들어지기 때문이다.

![](/images/react-basics/10.webp)

### styled-components

```bash
npm i styled-components
```

스타일이 입혀진 component를 JS 안에서 바로 만든다. CSS 파일을 따로 관리할 필요가 없고, props로 스타일을 바꿀 수 있어서 중복도 줄어든다.

```jsx
import styled from "styled-components";

const Main = styled.div`
  display: flex;
`;

const Circle = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 100px;
  background-color: ${(props) => props.bgColor};
`;

function App() {
  return (
    <Main>
      <Circle bgColor="orange" />
      <Circle bgColor="blue" />
    </Main>
  );
}
```

![](/images/react-basics/11.webp)

자주 쓰는 기능은 다음과 같다.

```jsx
// as: 스타일은 그대로 두고 태그만 바꾼다 (div → a)
<Circle as="a" href="#" bgColor="orange" />

// attrs: element 속성을 미리 지정한다
const Input = styled.input.attrs({ placeholder: "add your name" })`
  height: 30px;
`;

// 자식 선택자와 &로 hover 같은 상태를 한곳에 쓴다
const Circle = styled.div`
  span {
    color: white;
    font-size: 36px;
    &:hover {
      font-size: 100px;
    }
  }
`;
```

이후 프로젝트([Wordle](/posts/react-wordle) 등)에서는 스타일링에 주로 styled-components를 썼다.
