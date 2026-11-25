---
title: "React로 Wordle 만들고 TypeScript로 다시 만들기"
description: React로 만든 Wordle. JavaScript 버전에서 겪은 form submit, 자식→부모 데이터 전달, 동적 class 문제와 해결 방법, 같은 게임을 TypeScript와 Recoil로 다시 만들면서 달라진 점.
date: 2023-09-03
updated: 2026-11-25
tags: [react, typescript, styled-components, recoil, game]
keywords: [Wordle, 워들, React 게임, TypeScript, 타입스크립트, create-react-app template typescript, interface, enum, Recoil, styled-components, props, 조건부 렌더링, 사이드 프로젝트]
---

Wordle을 JavaScript로 먼저 만들고, 며칠 뒤 같은 게임을 TypeScript와 Recoil로 다시 만들었다. 기본 개념은 [React 기초](/posts/react-basics)에 정리해 두었다.

## Wordle 규칙

Wordle은 숫자야구의 영어 단어 버전이다([wordlegame.org](https://wordlegame.org/)에서 해 볼 수 있다). 다섯 글자 단어를 입력하면 글자마다 색으로 힌트를 준다.

- 글자와 위치가 모두 맞으면 초록색
- 정답에 있는 글자지만 위치가 다르면 노란색
- 정답에 없는 글자면 회색

![](/images/react-wordle/01.webp)

## 1부. JavaScript로 만들기

create-react-app으로 만들었고 방침은 세 가지였다.

- 상태와 부수 효과는 state, props, useEffect로 처리
- 스타일은 styled-components로만 적용
- component별로 기능을 나눠 중복 코드를 줄임

### Component 구조

```text
App
├── Word        한 줄(5글자)을 입력하는 form
│   └── Letter  알파벳 한 글자를 입력하는 input
└── ResultPage  게임이 끝나면 보이는 결과 화면
```

### Letter: 한 글자 입력칸

- 한 글자만 들어가는 input: `attrs`로 `maxLength: 1`을 줬다.
- 커서 숨기기: `caret-color: transparent`
- 한 글자를 입력하면 다음 칸으로, backspace를 누르면 이전 칸으로 focus를 옮긴다.

```jsx
import { styled } from "styled-components";

const LetterInput = styled.input.attrs({ maxLength: 1, required: true })`
  width: 55px;
  height: 55px;
  border: none;
  border-radius: 10px;
  background-color: #dcdde1;
  font-size: 50px;
  text-align: center;
  text-transform: uppercase;
  color: white;
  caret-color: transparent;
  transition: background-color 1s ease-in-out;

  &:focus {
    outline: none;
  }
`;

const moveCursor = (e) => {
  if (e.keyCode === 8) {
    e.target.previousSibling?.focus();
  } else if (e.target.value.length === 1) {
    e.target.nextSibling?.focus();
  }
};

const Letter = ({ className }) => {
  return <LetterInput onKeyUp={moveCursor} className={className} />;
};

export default Letter;
```

![](/images/react-wordle/02.webp)

### Word: 정답 확인과 색 바꾸기

게임의 핵심 로직이다. submit되면 글자마다 정답 여부를 `G`(초록), `Y`(노랑), `B`(회색)로 기록하고, 이 배열을 state에 넣는다. state가 바뀌면 다시 그려지면서 각 `Letter`에 맞는 class가 붙는다.

```jsx
const [colors, setColors] = useState(["", "", "", "", ""]);

const onSubmit = (e) => {
  e.preventDefault();
  const checkArr = [];
  let green = 0;

  for (let i = 0; i < 5; i++) {
    const letter = e.target[i].value;
    if (letter === answer[i]) {
      green++;
      checkArr[i] = "G";
    } else if (answer.includes(letter)) {
      checkArr[i] = "Y";
    } else {
      checkArr[i] = "B";
    }
  }

  setColors(checkArr);
  if (green === 5) setSuccess(true);

  // 다음 줄 첫 칸으로 focus 이동
  e.target.nextElementSibling.firstElementChild.focus();
};

const classNames = { G: "green", Y: "yellow", B: "gray" };

return (
  <WordForm onSubmit={onSubmit}>
    {colors.map((color, index) => (
      <Letter key={index} className={classNames[color] ?? "normal"} />
    ))}
    <SubmitButton />
  </WordForm>
);
```

![](/images/react-wordle/03.webp)

### App: 정답 가져오기와 결과 화면

정답은 아무 다섯 글자가 아니라 실제로 있는 단어여야 해서 외부 API로 받아왔다. 게임마다 한 번만 부르면 되므로 `useEffect`의 dependency array를 비웠다.

```jsx
const getWord = async () => {
  const res = await axios("https://random-word-api.herokuapp.com/word?length=5");
  setAnswer(res.data[0]);
};

useEffect(() => {
  getWord();
}, []);
```

게임이 끝났는지(`isFinish`)와 이겼는지(`isWin`)에 따라 결과 화면을 조건부로 렌더링했다.

```jsx
<Container>
  {isFinish ? (
    <ResultPage answer={answer} isWin={isWin} />
  ) : (
    <>
      <Title>Wordle</Title>
      {words}
    </>
  )}
</Container>
```

`ResultPage`는 승패에 따라 문구를 바꾸고 정답을 보여 준다. restart 버튼은 `keyframes`로 마우스를 올리면 도는 화살표를 만들고, 누르면 페이지를 새로고침하게 했다.

![](/images/react-wordle/04.webp)

### 막혔던 문제 세 가지

**1. Enter를 눌러도 submit이 안 된다**

하나의 form에 input이 여러 개 있으면 Enter로 submit되지 않는다. form 안에 submit 버튼이 있어야 Enter가 동작해서, 버튼을 만들고 숨겼다.

```jsx
const SubmitButton = styled.button.attrs({ type: "submit" })`
  display: none;
`;
```

**2. 자식 component에서 부모로 값 전달하기**

정답 여부는 `Word`가 알지만 결과 화면을 그리는 것은 부모인 `App`이다. 부모 → 자식은 props로 넘기면 되고, 반대 방향은 부모가 state를 바꾸는 **함수**를 props로 넘겨 자식이 그 함수를 호출하게 했다.

```jsx title="App.js"
const [isFinish, setIsFinish] = useState(false);
const [isWin, setIsWin] = useState(false);

<Word answer={answer} checkResult={setIsFinish} checkIsWin={setIsWin} />
```

```jsx title="Word.js"
const Word = ({ answer, checkResult, checkIsWin }) => {
  useEffect(() => {
    if (success) {
      checkResult(true);
      checkIsWin(true);
    }
  }, [success]);
  // ...
};
```

**3. classList로 class를 붙이면 적용되지 않는다**

처음에는 Vanilla JS 방식대로 DOM에 직접 class를 붙였다.

```js
document.querySelector("...").classList.add("green");
```

React는 자기가 관리하는 virtual DOM을 기준으로 화면을 그린다. DOM을 직접 고치면 React가 그 변화를 모르기 때문에 다음 렌더링 때 덮어써질 수 있다([관련 질문](https://stackoverflow.com/questions/65010686/adding-and-removing-a-classlist-in-react-js)). 그래서 위의 `Word` 코드처럼 **state에 색을 저장하고, 렌더링할 때 class를 정하는** 방식으로 바꿨다.

![](/images/react-wordle/05.webp)

작업 시간은 이틀간 7~8시간 정도였고, 대부분 2번과 3번에 들었다.

## 2부. TypeScript로 다시 만들기

같은 게임을 TypeScript로 옮겼다. 상태는 Recoil로, 고정된 값은 enum으로 바꿨다.

### 프로젝트 만들기

create-react-app은 TypeScript 템플릿을 지원한다.

```bash
npx create-react-app my-app --template typescript
```

JavaScript 코드를 그대로 옮기면 props에서 바로 에러가 난다. props의 타입을 알려 주지 않았기 때문이다.

![](/images/react-wordle/07.webp)

`interface`(또는 `type`)로 props 타입을 지정하면 해결된다.

```tsx
interface IWordProps {
  answer: string;
}

const Word = ({ answer }: IWordProps) => {
  // ...
};
```

이제 `answer`에 string이 아닌 값을 넘기면 실행 전에 에러가 난다.

### 달라진 점 1: 색은 class 대신 props로

구조(`App > Word > Letter`, `ResultPage`)는 그대로 두고, 기회는 7번으로 정했다.

![](/images/react-wordle/08.webp)

JS 버전에서는 class를 붙였다 떼는 방식으로 색을 바꿨는데, 이번에는 배경색을 props로 넘겼다. class를 관리할 필요가 없어서 코드가 단순해진다.

```tsx
const COLOR = { G: "#539165", Y: "#F7C04A", B: "gray" } as const;

{colors.map((color, index) => (
  <Letter key={index} bgcolor={COLOR[color] ?? "#dcdde1"} />
))}
```

```tsx
interface IColor {
  bgcolor: string;
}

const Letter = ({ bgcolor }: IColor) => {
  return <Input bgcolor={bgcolor} />;
};

const Input = styled.input<IColor>`
  background-color: ${(props) => props.bgcolor};
`;
```

interface 덕분에 `Letter`가 받는 props는 `bgcolor` 하나이고 그 타입은 string이라는 것이 보장된다. 다른 props를 넘기거나 숫자를 넘기면 컴파일 단계에서 막힌다.

### 달라진 점 2: 게임 상태는 Recoil과 enum으로

JS 버전에서는 `isFinish`, `isWin`을 props로 이리저리 넘겼다. 이번에는 정답과 게임 상태를 [Recoil](/posts/recoil)로 전역 state에 두었다. 게임 상태는 enum으로 정의해서 세 값 중 하나만 갖게 했다.

```ts
import { atom } from "recoil";

export enum STATUS {
  NOT_FINISHED,
  WIN,
  LOSE,
}

export const answerState = atom({
  key: "answer",
  default: "",
});

export const isFinishState = atom<STATUS>({
  key: "isFinish",
  default: STATUS.NOT_FINISHED,
});
```

- 다섯 칸이 모두 초록색이면 `WIN`
- 7번 안에 못 맞히면 `LOSE`
- 아직 기회가 남아 있으면 `NOT_FINISHED`

`isFinish`와 `isWin` 두 개의 boolean을 조합하던 것보다 상태가 분명해졌다. `ResultPage`는 `NOT_FINISHED`일 때 화면 위로 숨겨 두고, 상태가 바뀌면 내려오게 했다.

```ts
top: ${(props) => (props.result === STATUS.NOT_FINISHED ? "-100vh" : 0)};
```

![](/images/react-wordle/09.webp)

## 정리

- JavaScript 버전에서 시간이 가장 많이 든 부분은 component 사이의 값 전달과, DOM을 직접 건드리지 않고 state로 화면을 바꾸는 부분이었다.
- TypeScript 버전은 props 타입을 interface로 고정해 잘못된 값을 컴파일 단계에서 막는다.
- 게임 상태를 Recoil로 옮겨 props로 setter 함수를 넘기던 코드가 없어졌고, boolean 두 개(`isFinish`, `isWin`) 대신 enum 하나로 상태를 표현한다.
