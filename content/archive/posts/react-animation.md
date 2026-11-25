---
title: "Framer Motion으로 React 애니메이션 만들기 - Lottie 띄우기, 반복 애니메이션, 숫자 롤링"
description: react-lottie-player로 Lottie 애니메이션을 띄우고 framer-motion으로 움직인다. 애니메이션을 반복하는 두 가지 방법(repeat Infinity와 key 변경)을 비교하고, overflow hidden과 framer-motion으로 숫자가 굴러가다 멈추는 롤링 애니메이션을 만든다.
date: 2024-01-26
updated: 2026-11-25
tags: [react, nextjs, animation]
keywords: [framer-motion, Framer Motion, motion.div, variants, repeat Infinity, key, 애니메이션 반복, Lottie, react-lottie-player, 숫자 롤링, 숫자 룰렛, rolling number, overflow hidden]
---

## 1. Lottie 띄우기

Lottie는 웹과 모바일에서 벡터 애니메이션을 재생하는 형식이다. [LottieFiles](https://lottiefiles.com/featured)에서 무료 애니메이션을 JSON으로 받을 수 있고, React에서는 [react-lottie-player](https://www.npmjs.com/package/react-lottie-player)로 띄운다.

```bash
npm install --save react-lottie-player
```

받은 JSON 파일을 `src` 아래에 두고 import한다.

```tsx
import Lottie from "react-lottie-player";
import animationData from "../animationData.json";

const App = () => (
  <Lottie
    animationData={animationData}
    style={{ width: "200px", height: "200px" }}
    loop
    play
    speed={5}
  />
);
```

![](/images/react-animation/01.webp)

## 2. framer-motion으로 움직이기

Lottie 자체는 제자리에서 재생된다. 화면 왼쪽 끝에서 오른쪽 끝까지 양이 걸어가게 하려고, Lottie를 `motion.div`로 감싸고 `variants`로 시작과 끝 상태를 정했다.

```tsx
import { motion } from "framer-motion";

const sheepVar = {
  initial: { x: -200 },
  animate: { x: "100vw", transition: { duration: 5 } },
};

<motion.div variants={sheepVar} initial="initial" animate="animate">
  <Lottie
    animationData={animationData}
    style={{ width: "200px", height: "200px", transform: "rotateY(180deg)" }}
    loop
    play
    speed={5}
  />
</motion.div>
```

![](/images/react-animation/02.webp)

## 3. 애니메이션을 계속 반복하는 두 가지 방법

### repeat: Infinity

가장 간단한 방법은 transition에 `repeat: Infinity`를 넣는 것이다.

```tsx
const sheepVar = {
  initial: { x: -200 },
  animate: { x: "100vw", transition: { duration: 5, repeat: Infinity } },
};
```

애니메이션 하나를 단순히 반복할 때는 이걸로 충분하다.

### key 바꾸기

React는 key가 다르면 다른 component로 보고 새로 만든다. 일정 주기마다 key를 바꾸면 component가 새로 생기면서 애니메이션이 처음부터 다시 시작된다.

```tsx
const [sheepCount, setSheepCount] = useState(1);

useEffect(() => {
  const timer = setInterval(() => setSheepCount((prev) => prev + 1), 7000);
  return () => clearInterval(timer);
}, []);

<motion.div key={sheepCount} variants={sheepVar} initial="initial" animate="animate">
  <Lottie ... />
</motion.div>
```

7초마다 새 양이 출발점에서 다시 출발한다. `AnimatePresence`와 `exit`를 같이 쓸 때는 이 방식이 이어지는 애니메이션을 만들기 더 쉽다.

### 여러 개를 동시에 움직일 때

양 여러 마리를 움직이면 두 방법의 차이가 분명해진다.

**각자 다른 주기로 움직이게 하려면** `repeat: Infinity`가 편하다. 양마다 `duration`과 `delay`만 다르게 주면 된다.

```tsx
const sheepSecondVar = {
  initial: { x: -500 },
  animate: { x: "100vw", transition: { duration: 7, delay: 2, repeat: Infinity } },
};

const sheepThirdVar = {
  initial: { x: -500 },
  animate: { x: "100vw", transition: { duration: 8, delay: 4, repeat: Infinity } },
};
```

![](/images/react-animation/03.webp)

**다 같이 도착을 기다렸다가 한꺼번에 다시 출발하게 하려면** key 방식이 낫다. `repeat: Infinity`로 하려면 양마다 duration과 delay를 계산해서 `repeatDelay`를 따로 맞춰야 한다. key 방식은 공통 count 하나로 모든 양의 주기를 한 번에 정할 수 있다.

```tsx
<motion.div key={sheepCount + "first"} variants={sheepVar} initial="initial" animate="animate">
  <Lottie ... />
</motion.div>
<motion.div key={sheepCount + "second"} variants={sheepSecondVar} initial="initial" animate="animate">
  <Lottie ... />
</motion.div>
<motion.div key={sheepCount + "third"} variants={sheepThirdVar} initial="initial" animate="animate">
  <Lottie ... />
</motion.div>
```

![](/images/react-animation/04.webp)

## 4. 숫자 롤링 애니메이션

숫자가 슬롯머신처럼 굴러가다가 목표 숫자에서 멈추는 애니메이션이다. Next.js 프로젝트에서 만들었지만 Next.js에 의존하는 부분은 없다.

### 원리

한 자리 숫자를 보여 주는 칸에 숫자 다섯 개를 세로로 쌓는다. 층을 1~9층이라 하면, 처음에는 숫자가 1~5층에 있고 `overflow: hidden`으로 5층만 보인다.

- 최종적으로 보여 줄 목표 숫자는 1층에 둔다.
- 나머지 2~5층에는 랜덤 숫자를 둔다.
- 모든 숫자를 동시에 4층씩 아래로 내린다.

그러면 랜덤 숫자들이 차례로 5층을 지나가고, 마지막에 1층에 있던 목표 숫자가 5층에 도착해 멈춘다.

![](/images/react-animation/05.webp)

### 코드

한 층의 높이를 30px로 잡고, 각 숫자를 `y`로 120px(4층)씩 내렸다. 자릿수마다 굴러가는 시간을 랜덤으로 줘서 멈추는 순간이 조금씩 다르게 했다.

```tsx
const Roulette = ({ target }: { target: string }) => {
  /** 애니메이션에 걸리는 시간 (자릿수마다 다르게) */
  const duration = Math.random() + 0.1;
  const random = () => Math.floor(Math.random() * 10);

  return (
    <div className="Wrapper">
      <div className="Focused">
        {/* 5층 → 9층 */}
        <motion.div initial={{ y: 0 }} animate={{ y: 120, transition: { duration } }} className="Number">
          {random()}
        </motion.div>
        {/* 4층 → 8층 */}
        <motion.div initial={{ y: -30 }} animate={{ y: 90, transition: { duration } }} className="Number">
          {random()}
        </motion.div>
        {/* 3층 → 7층 */}
        <motion.div initial={{ y: -60 }} animate={{ y: 60, transition: { duration } }} className="Number">
          {random()}
        </motion.div>
        {/* 2층 → 6층 */}
        <motion.div initial={{ y: -90 }} animate={{ y: 30, transition: { duration } }} className="Number">
          {random()}
        </motion.div>
        {/* 1층 → 5층: 목표 숫자 */}
        <motion.div initial={{ y: -120 }} animate={{ y: 0, transition: { duration } }} className="Number">
          {target}
        </motion.div>
      </div>
    </div>
  );
};

export default Roulette;
```

숫자를 자릿수로 쪼개서 자리마다 `Roulette`을 하나씩 붙인다.

```tsx
{targetNum.toString().split("").map((digit, i) => (
  <Roulette key={i} target={digit} />
))}
```

![](/images/react-animation/06.webp)
