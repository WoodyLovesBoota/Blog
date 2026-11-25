---
title: "react-hook-form 정리 - input 관리, 유효성 검사, useFieldArray, useRef 같이 쓰기"
description: react-hook-form의 useForm으로 input 하나와 여러 개를 다루고, formState.errors로 유효성 검사를, useFieldArray로 개수가 바뀌는 input을 관리한다. register와 useRef를 함께 쓰면 submit이 안 되는 원인과 callback ref로 해결하는 방법.
date: 2024-01-05
updated: 2026-11-25
tags: [react, react-hook-form, typescript]
keywords: [react-hook-form, useForm, useFieldArray, formState, errors, 유효성 검사, validation, input 관리, register, handleSubmit, useRef, ref, 동적 input, auto resize input, submit 안 됨]
---

## 기본: input 하나

`register`로 input을 form에 등록하고, `handleSubmit`에 submit됐을 때 실행할 함수를 넘긴다. 등록한 이름이 곧 결과 객체의 key가 된다.

```tsx
interface IForm {
  keyword: string;
}

const { register, handleSubmit, setValue } = useForm<IForm>();
const [inputData, setInputData] = useState("");

const onValid = (data: IForm) => {
  setInputData(data.keyword);
  setValue("keyword", "");
};

return (
  <Wrapper>
    <Form onSubmit={handleSubmit(onValid)}>
      <Input {...register("keyword", { required: true })} />
    </Form>
    <Result>Input Value is... {inputData && `"${inputData}"`}</Result>
  </Wrapper>
);
```

![](/images/react-hook-form/01.webp)

## input 여러 개

이름만 다르게 등록하면 여러 input을 한 form에서 다룰 수 있다. submit 후 `reset()`으로 한 번에 비운다.

```tsx
interface IForm {
  keyword1: string;
  keyword2: string;
  keyword3: string;
}

const { register, handleSubmit, reset } = useForm<IForm>();

const onValid = (data: IForm) => {
  setInputData(data);
  reset();
};

<Form onSubmit={handleSubmit(onValid)}>
  <Input {...register("keyword1", { required: true })} />
  <Input {...register("keyword2", { required: true })} />
  <Input {...register("keyword3", { required: true })} />
</Form>
```

![](/images/react-hook-form/02.webp)

## 유효성 검사: formState.errors

`register`에 넣은 조건(`required` 등)을 통과하지 못하면 `formState.errors`에 해당 이름으로 에러가 담긴다. 이걸로 에러 메시지를 조건부로 보여 준다.

```tsx
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<IForm>();

<Form onSubmit={handleSubmit(onValid)}>
  {errors.keyword1 && <Error>keyword1을 입력해주세요!</Error>}
  <Input {...register("keyword1", { required: true })} />
  {errors.keyword2 && <Error>keyword2를 입력해주세요!</Error>}
  <Input {...register("keyword2", { required: true })} />
  {errors.keyword3 && <Error>keyword3을 입력해주세요!</Error>}
  <Input {...register("keyword3", { required: true })} />
</Form>
```

![](/images/react-hook-form/03.webp)

## 개수가 바뀌는 input: useFieldArray

사용자가 행을 추가하고 지울 수 있는 input은 `useFieldArray`로 관리한다. `fields`를 map으로 그리고, `append`로 추가, `remove`로 삭제한다.

```tsx
interface IForm {
  multiValues: { value: string }[];
}

const { register, handleSubmit, control } = useForm<IForm>({
  defaultValues: { multiValues: [{ value: "" }] },
});

const { fields, append, remove } = useFieldArray({ control, name: "multiValues" });

{fields.map((field, index) => (
  <Multi key={field.id}>
    <Title>Value {index + 1}</Title>
    <Input {...register(`multiValues.${index}.value`, { required: true })} />
    <DeleteRowButton type="button" onClick={() => remove(index)}>
      <FontAwesomeIcon icon={faMinus} />
    </DeleteRowButton>
  </Multi>
))}
<AddRowButton type="button" onClick={() => append({ value: "" })}>추가</AddRowButton>
```

![](/images/react-hook-form/04.webp)

배열 원소를 객체로 두면 key-value처럼 input을 쌍으로 관리할 수도 있다.

```tsx
interface IForm {
  multiValues: { key: string; value: string }[];
}

<Input {...register(`multiValues.${index}.key`, { required: true })} />
<Input {...register(`multiValues.${index}.value`, { required: true })} />
```

![](/images/react-hook-form/05.webp)

## 주의: register와 useRef를 같이 쓰면 submit이 안 된다

입력한 글자 수만큼 가로로 길어지는 input을 만들기 위해 `useRef`로 DOM에 직접 접근했다.

```tsx
const inputRef = useRef<HTMLInputElement | null>(null);

const handleWidth = () => {
  if (inputRef.current) {
    inputRef.current.style.width = `${inputRef.current.value.length * 60 + 150}px`;
  }
};

<Form onSubmit={handleSubmit(onValid)}>
  <Input
    {...register("destination", { required: true })}
    ref={inputRef}
    onKeyDown={handleWidth}
    onKeyUp={handleWidth}
  />
</Form>
```

길이는 늘어나지만 **submit이 되지 않는다.** `register`와 `useRef`를 각각 따로 쓸 때는 문제가 없다.

원인은 `register`가 돌려주는 값에 이미 `ref`가 들어 있다는 것이다. [문서](https://react-hook-form.com/docs/useform/register)를 보면 `register`는 `{ onChange, onBlur, name, ref }`를 반환한다. react-hook-form은 이 `ref`로 input을 추적하는데, 뒤에 쓴 `ref={inputRef}`가 이를 덮어쓴다.

[FAQ](https://react-hook-form.com/faqs)에 나온 해결법은 `register`의 `ref`를 따로 꺼내고, callback ref 안에서 두 ref에 모두 연결하는 것이다.

```tsx
const { ref, ...rest } = register("destination", { required: true });

<Form onSubmit={handleSubmit(onValid)}>
  <Input
    {...rest}
    ref={(e) => {
      ref(e); // react-hook-form에 연결
      inputRef.current = e; // 내 ref에도 연결
    }}
    onKeyDown={handleWidth}
    onKeyUp={handleWidth}
  />
</Form>
```

이렇게 하면 길이 조절과 submit이 모두 동작한다.
