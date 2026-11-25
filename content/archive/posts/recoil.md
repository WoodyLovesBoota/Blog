---
title: "Recoil로 전역 상태 관리하고 localStorage에 저장하기"
description: props로 state를 하나하나 넘기던 번거로움을 Recoil로 해결하고, atom effects의 setSelf와 onSet으로 state가 바뀔 때마다 localStorage에 자동 저장해 새로고침 후에도 값이 남도록 만들었다.
date: 2023-09-11
updated: 2026-11-25
tags: [react, recoil, typescript]
keywords: [Recoil, 리코일, 전역 상태 관리, global state, atom, RecoilRoot, useRecoilState, useRecoilValue, useSetRecoilState, props drilling, localStorage, 로컬 스토리지, atom effects, setSelf, onSet, persist state]
---

## 왜 전역 state가 필요한가

여러 component에서 같은 state를 쓰려면 props로 넘겨줘야 한다.

```jsx
const App = () => <Word answer={answer} />;

const Word = ({ answer }) => <Letter answer={answer} />;
```

[Wordle](/posts/react-wordle)을 만들 때 이런 코드가 계속 늘어났다. 더 깊은 곳의 component가 state를 써야 하면, 중간 component는 쓰지도 않는 props를 받아서 아래로 넘겨주기만 한다(props drilling).

이 문제를 풀기 위해 state를 component 바깥에서 전역으로 관리하는 도구들이 있다. Redux와 Recoil이 많이 쓰이며, 여기서는 API가 단순한 Recoil을 사용했다.

## Recoil 기본 사용법

```bash
npm install recoil
```

모든 component가 `RecoilRoot` 안에 있어야 한다.

```tsx title="index.tsx"
import { RecoilRoot } from "recoil";

root.render(
  <RecoilRoot>
    <App />
  </RecoilRoot>
);
```

state는 `atom`으로 정의한다. `key`는 state를 구분하는 고유한 값이고, `default`는 초기값이다.

```ts title="atoms.ts"
import { atom } from "recoil";

export const nameState = atom({
  key: "name",
  default: "",
});
```

component에서는 `useState`와 거의 같은 모양으로 쓴다.

```ts
const [name, setName] = useRecoilState(nameState);

// 값만 필요할 때
const name = useRecoilValue(nameState);

// 바꾸는 함수만 필요할 때
const setName = useSetRecoilState(nameState);
```

아래 예제는 `Input`에서 state를 바꾸고 `App`에서 출력한다. 둘 사이에 props는 하나도 없다.

```tsx
function App() {
  const name = useRecoilValue(nameState);
  return (
    <form>
      <h1>My name is {name}</h1>
      <Input />
    </form>
  );
}

const Input = () => {
  const setName = useSetRecoilState(nameState);
  return <input onChange={(e) => setName(e.currentTarget.value)} />;
};
```

![](/images/recoil/01.webp)

입력하는 대로 `App`의 문장이 바로 바뀐다.

## 새로고침해도 값이 남게 하기: atom effects

전역 state도 새로고침하면 초기값으로 돌아간다. 값을 브라우저에 남기려면 localStorage에 저장해야 하는데, state를 바꾸는 곳마다 저장 코드를 넣는 건 번거롭다. Recoil의 atom `effects`를 쓰면 atom 정의 한곳에서 처리할 수 있다.

```ts title="atoms.ts"
import { atom, AtomEffect } from "recoil";

const localStorageEffect =
  (key: string): AtomEffect<string> =>
  ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) setSelf(JSON.parse(savedValue));

    onSet((newValue, _, isReset) => {
      isReset
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, JSON.stringify(newValue));
    });
  };

export const nameState = atom({
  key: "name",
  default: "",
  effects: [localStorageEffect("name")],
});
```

- `setSelf`: atom 자신의 값을 정한다. 앱이 처음 뜰 때 localStorage에 저장된 값이 있으면 그 값으로 초기화한다.
- `onSet`: state가 바뀔 때마다 실행할 handler를 등록한다. 새 값을 localStorage에 저장하고, reset되면 지운다.

이름을 입력하고 submit한 뒤 새로고침한 결과다.

![](/images/recoil/02.webp)

component 코드는 하나도 바꾸지 않았는데, 값이 바뀔 때마다 localStorage가 갱신되고 새로고침 후에도 이름이 남아 있다.
