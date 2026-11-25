---
title: "React로 간단한 지뢰찾기 게임 만들기"
description: React와 TypeScript로 지뢰찾기를 만들었다. 보드 생성, 지뢰와 숫자 배치, 재귀로 빈칸 열기, 깃발과 숫자 클릭, 승패 판정까지 구현 과정을 정리했다.
date: 2023-12-10
tags: [react, typescript, game]
keywords: [지뢰찾기, Minesweeper, React 게임, 재귀 함수, flood fill, Math.random, useEffect]
---

> 1. 게임 보드
> 2. 지뢰와 숫자 설정
> 3. 게임 진행
>    - 숫자
>    - 깃발
>    - 빈칸
> 4. 종료

## 1. 게임 보드

난이도는 초급, 중급, 고급 3가지 중 하나를 선택할 수 있게 하였다. 설정은 각각 다음과 같다.

> - 초급: 9 X 9 지뢰 10개
> - 중급: 16 X 16 지뢰 40개
> - 고급: 16 X 30 지뢰 99개

게임이 시작되면 가로와 세로의 수만큼의 크기를 갖는 Array를 생성하고, 각각의 element 당 한 칸의 정사각형을 렌더링하였다.

```ts
// 가로 세로 길이만큼 array 생성
useEffect(() => {
  setRowFrame([]);
  setColFrame([]);
  for (let i = 1; i <= row; i++) {
    setRowFrame((prev) => [...prev, i]);
  }
  for (let i = 1; i <= col; i++) {
    setColFrame((prev) => [...prev, i]);
  }
}, [row, col]);
```

```tsx
// Array를 통한 Box 생성
{rowFrame.map((row) => (
  <Row key={row}>
    {colFrame.map((col) => <Box />)}
  </Row>
))}
```

## 2. 지뢰와 숫자 설정

지뢰찾기에서 각각의 칸은 `(지뢰, 숫자, 빈칸)` 중 하나의 값을 갖는다. 또한 게임이 한 번 시작되면 지뢰의 위치와 그에 따른 숫자의 위치가 고정되게 된다. 게임이 시작될 때마다 랜덤으로 지뢰를 생성하고, 이후에 숫자를 생성하는 방법으로 지뢰와 숫자를 배치하였다.

### 2-1 지뢰 배치

지뢰는 랜덤으로 배치하였다. `Math.random()` method를 이용하여 1부터 가로 X 세로까지의 숫자를 무작위로 줄 세운 후 앞에서부터 총 지뢰 개수까지를 각각의 지뢰의 위치로 설정하였다.

```ts
let temp = [];
for (let i = 1; i <= row * col; i++) temp.push(i);
temp.sort(() => Math.random() - 0.5);
let target = temp.slice(0, mine).map((e) => {
  return { row: Math.floor((e - 1) / col) + 1, col: e - Math.floor((e - 1) / col) * col };
});
setMineInfo(target);
```

```ts
mineInfo = [
  {row: 2, col: 5},
  {row: 3, col: 4},
  ...
]
```

### 2-2 숫자 배치

숫자는 지뢰의 위치에 따라 달라진다. 가로 X 세로 크기의 Array를 만든 후, 주변 8칸 중 존재하는 지뢰의 수를 element로 넣어주었다.

```ts
let infoTemp = new Array(row);
for (let i = 0; i < row; i++) {
  infoTemp[i] = new Array(col);
}

for (let i = 0; i < row; i++) {
  for (let j = 0; j < col; j++) {
    let cnt = 0;
    if (mineInfo.some((e) => e.row === i + 1 && e.col === j)) cnt++;
    if (mineInfo.some((e) => e.row === i + 1 && e.col === j + 2)) cnt++;
    if (mineInfo.some((e) => e.row === i + 2 && e.col === j)) cnt++;
    if (mineInfo.some((e) => e.row === i + 2 && e.col === j + 1)) cnt++;
    if (mineInfo.some((e) => e.row === i + 2 && e.col === j + 2)) cnt++;
    if (mineInfo.some((e) => e.row === i && e.col === j)) cnt++;
    if (mineInfo.some((e) => e.row === i && e.col === j + 1)) cnt++;
    if (mineInfo.some((e) => e.row === i && e.col === j + 2)) cnt++;
    infoTemp[i][j] = cnt;
  }
}

setInfo(infoTemp);
```

```ts
info = [
  [2,4,0,0,1,4,...]
 ,[1,2,5,0,0,0,...]
 ,[...]
 ,...
]
```

### 2-3 빈칸 배치

전체 칸 중 지뢰 혹은 숫자가 아닌 칸은 모두 빈칸이다. 따라서 가장 먼저 해당 칸에 지뢰가 있는지 체크하고, 없으면 숫자가 있는지 체크하고, 둘 다 없으면 빈칸을 생성해 주는 방식으로 전체 보드를 만들어 주었다.

```tsx
// 지뢰 확인
mineInfo.some((e) => e.row === row && e.col === col) ? (
  <Box key={col + "mine"}>
    <Bomb>
      <FontAwesomeIcon icon={faCertificate} />
    </Bomb>
  </Box>
) :
// 숫자 확인
info[row - 1][col - 1] !== 0 ? (
  <Box
    key={String(col) + String(row) + "number"}
    onClick={() => {
      onNumberClick(row, col);
    }}
  >
    {info[row - 1][col - 1]}
  </Box>
) :
// 빈칸
(
  <Box key={String(col) + String(row) + "blank"}></Box>
)
```

지뢰와 숫자, 빈칸을 배치한 모습은 다음과 같다.

![](/images/react-minesweeper/01.webp)

## 3. 게임 진행

가장 먼저 보드를 가려주어야 한다. opened라는 Array를 통해 열린 칸과 열리지 않은 칸을 구분해 주었다. opened에 속해 있지 않은 칸은 Cover를 렌더링하였다.

```tsx
// opened 에 속해있는지 확인
opened.some((e) => e.row === row && e.col === col) ? (
  // 속해있으면 (지뢰, 숫자, 빈칸) 중 하나 렌더링
  mineInfo.some((e) => e.row === row && e.col === col) ? (
    ...
  )
)
// 속해있지 않으면 Cover 렌더링
: <Cover />
...
```

```ts
opened = [
  {row: 1, col: 1},
  {row: 5, col: 7},
  ...
]
```

사용자가 게임을 진행하며 할 수 있는 행동은 다음과 같다.

> 1. Cover 클릭
> 2. 깃발 세우기 (Cover 우클릭)
> 3. 숫자 클릭

eventlistener를 통해 각 행동에 event를 만들어 주었다.

### 3-1 Cover 클릭

Cover를 클릭하면 해당 칸이 지뢰인지 숫자인지 빈칸인지 확인해 주어야 한다.

**(1) 지뢰일 때**

게임이 종료된다. player는 패배한다.

```ts
if (mineInfo.some((e) => e.row === row && e.col === col)) {
  setIsFinish(true);
  setIsWin(false);
}
```

**(2) 숫자일 때**

해당 숫자를 player에게 보여준다. 해당 칸은 opened에 추가시키고, 따라서 Cover 대신 숫자를 렌더링하여 화면에 보여준다.

```ts
setOpened((prev) => [...prev, { row: row, col: col }]);
```

**(3) 빈칸일 때**

가장 먼저 숫자와 같이 해당 칸을 opened에 추가시키고 Cover 대신 빈칸을 렌더링해 준다. 하지만 빈칸은 숫자와 다르게 자기 주변 8칸 중 숫자가 아닌 칸(지뢰 주변은 모두 숫자가 감싸고 있기 때문에 지뢰일 수는 없다)을 모두 열어줘야 한다. 따라서 재귀 함수를 이용하여 열 수 있는 모든 칸을 열어주는 함수를 구현하였다.

```ts
const findBlank = async (rowA: number, colA: number, his: number[][]) => {
  // 주변 8칸
  let temp = [
    [rowA + 1, colA + 1],
    [rowA + 1, colA - 1],
    [rowA - 1, colA + 1],
    [rowA - 1, colA - 1],
    [rowA - 1, colA],
    [rowA, colA - 1],
    [rowA, colA + 1],
    [rowA + 1, colA],
  ];
  // 무한루프를 방지하기 위한 history
  his.push([rowA, colA]);

  for (let i = 0; i < temp.length; i++) {
    let [nRow, nCol] = temp[i];
    if (his.some((e) => e[0] === nRow && e[1] === nCol)) {
      continue;
    } else {
      // 주변 칸이 지뢰가 아니고 아직 열리지 않은 경우
      if (
        !mineInfo.some((e) => e.row === nRow && e.col === nCol) &&
        !opened.some((e) => e.row === nRow && e.col === nCol)
      ) {
        // 존재하지 않는 칸(경계)이 아닐 경우
        if (nRow > 0 && nCol > 0 && nRow < row + 1 && nCol < col + 1) {
          if (info[nRow - 1][nCol - 1] !== 0) {
            // 주변 칸이 숫자이면 해당 칸 open
            setOpened((prev) => [...prev, { row: nRow, col: nCol }]);
          } else {
            // 주변 칸이 빈칸이면 해당 칸 open && 해당 칸에서 다시 재귀함수 실행
            setOpened((prev) => [...prev, { row: nRow, col: nCol }]);
            findBlank(nRow, nCol, his);
          }
        }
      }
    }
  }
};
```

![](/images/react-minesweeper/02.webp)

### 3-2 깃발 세우기 (Cover 우클릭)

깃발은 사용자가 지뢰일 것이라고 확신하는 지역에 설치하는 도구이다. 깃발을 지뢰가 아닌 구역에 세운 후 다른 Cover를 열게 되면 player는 패배하게 된다.

```ts
const onCoverRightClick = (row: number, col: number, event: MouseEvent<HTMLDivElement>) => {
  event.preventDefault();
  setFlag((prev) => [...prev, { row: row, col: col }]);
};
```

깃발을 제거하는 함수 또한 만들었다(깃발 우클릭).

```ts
const onFlagRightClick = (row: number, col: number, event: MouseEvent<HTMLDivElement>) => {
  event.preventDefault();
  let index = flag.findIndex((e, i) => {
    return e.row === row && e.col === col;
  });
  setFlag((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
};
```

### 3-3 숫자 클릭

숫자를 클릭하게 되면 두 가지를 확인하게 된다.

> 1. 현재 잘못 설치된 깃발이 있는지
>    -> 있으면 패배
> 2. 숫자 주위 지뢰 수 = 숫자 주위 깃발 수인지
>    -> 일치하면 숫자 주위 모든 칸 open

**(1) 잘못 설치된 깃발**

지뢰의 위치가 저장된 mineInfo와 깃발의 위치가 저장된 flag를 이용하여 이를 확인할 수 있다. flag의 모든 원소 중 mineInfo에 존재하지 않는 원소가 있는지 확인하는 방식으로 기능을 구현하였다.

```ts
for (let e of flag) {
  if (!mineInfo.some((ele) => ele.row === e.row && ele.col === e.col)) {
    setIsFinish(true);
    setIsWin(false);
    mineInfo.forEach((e) => setOpened((prev) => [...prev, { row: e.row, col: e.col }]));
  }
}
```

**(2) 숫자 주위 지뢰 수 = 숫자 주위 깃발 수**

클릭한 숫자 주위 8칸 중 flag에 존재하는 칸의 수와 클릭한 칸의 숫자를 비교하는 방식으로 구현하였다(**지뢰의 수와 다른 경우는 (1)에서 걸러지기 때문에 구현하지 않았다**). 만약 두 수가 같다면 이전에 구현한 `findBlank()` 함수를 이용하여 주변 모든 빈칸을 열어주었다.

```ts
let target = info[rowA - 1][colA - 1];
let flagNum = 0;
for (let e of flag) {
  if (e.row + 1 === rowA && e.col === colA) flagNum++;
  else if (e.row + 1 === rowA && e.col + 1 === colA) flagNum++;
  else if (e.row + 1 === rowA && e.col - 1 === colA) flagNum++;
  else if (e.row === rowA && e.col + 1 === colA) flagNum++;
  else if (e.row === rowA && e.col - 1 === colA) flagNum++;
  else if (e.row - 1 === rowA && e.col + 1 === colA) flagNum++;
  else if (e.row - 1 === rowA && e.col === colA) flagNum++;
  else if (e.row - 1 === rowA && e.col - 1 === colA) flagNum++;
}
if (target === flagNum) {
  findBlank(rowA, colA, [[0, 0]]);
}
```

![](/images/react-minesweeper/03.webp)

## 4. 종료

### 4-1 패배

패배 조건은 3. 게임 진행을 구현할 때 모두 구현하였다. 각각 다음과 같다.

> - 지뢰를 열었을 때
> - 깃발을 잘못 설치했을 때

### 4-2 승리

승리 조건은 다음과 같다.

> - 지뢰를 제외한 모든 칸을 열었을 때
> - 모든 지뢰에 깃발을 설치했을 때

**(1) 지뢰를 제외한 모든 칸을 열었을 때**

```ts
useEffect(() => {
  let unique: { row: number; col: number }[] = [];
  opened.forEach((e) => {
    if (!unique.some((ele) => e.row === ele.row && e.col === ele.col)) {
      unique.push(e);
    }
  });
  if (unique.length === row * col - mine) {
    setIsFinish(true);
    setIsWin(true);
  }
}, [opened]);
```

useEffect Hook을 이용하여 Cover를 클릭하거나 숫자를 클릭하여 opened가 변할 때마다 지뢰를 제외한 모든 칸을 open했는지 여부를 판단하였다.

**(2) 모든 지뢰에 깃발을 설치했을 때**

이 경우 이론적으로 (1)에 포함되게 된다. 모든 지뢰에 깃발을 설치했더라도 깃발을 설치한 순간이 아니라 Cover 혹은 숫자를 누르며 opened를 새로고침시키는 순간 승리가 확정되기 때문에 해당 기능을 따로 구현하지 않았다.

![](/images/react-minesweeper/04.webp)
