---
title: "로컬 LLM 연동: 스트리밍, 프리필, few-shot"
description: 로컬 qwen 계열 thinking 모델로 가계부 데일리 브리핑 문장을 만들면서 겪은 터널 524, 빈 content, 중국어 섞임을 각각 스트리밍, assistant 프리필, few-shot 예시로 해결했다.
date: 2026-08-04
tags: [llm, nestjs, backend, prompt]
keywords: [로컬 LLM, thinking 모델, qwen, assistant prefill, 프리필, few-shot, SSE 스트리밍, Cloudflare quick tunnel, 524 timeout, NestJS]
---

부부 가계부 앱 통통(NestJS 백엔드)의 데일리 브리핑은 서버가 SQL 로 계산한 숫자를 로컬 qwen 계열 thinking 모델이 문장으로 바꾼다. OpenAI 호환 게이트웨이에 `messages` 만 보내는 단순 호출은 거의 매번 실패했고, 스트리밍, assistant 프리필, few-shot 예시를 모두 지켜야 동작했다.

## 구조

1. 서버가 팩트(어제 거래, 최근 7일 평균, 이번 달 누적, 예산)를 계산하고, 규칙으로 인사이트 신호(카테고리 급증, 심야 지출, 숨은 구독 등)를 고른다.
2. LLM 에 내러티브(헤드라인, 본문, 전망) 1콜, 신호마다 카드 1콜을 보낸다.
3. 응답 JSON 을 검증하고 통과한 조각만 저장한다.

게이트웨이는 Cloudflare quick tunnel 로 노출되고, 앱 서버가 HTTP 로 부른다. 운영 서버는 유휴 시 잠드는 프리티어라 하루 한 번 GitHub Actions 가 내부 엔드포인트를 깨워 배치를 돌린다.

## 조건 1: 반드시 스트리밍

quick tunnel 은 origin 의 첫 응답을 100초까지만 기다리고 524 로 끊는다. 모델은 초당 약 17토큰, 즉 100초에 1,700토큰 정도를 낸다. 논스트리밍 호출은 답을 다 만든 뒤에야 첫 바이트가 나가므로 긴 응답은 524 가 된다. `stream: true` 면 첫 조각이 바로 나가 연결이 유지되고, 대신 SSE 본문을 직접 읽어야 한다.

```ts title="src/tongtong/ai-briefing/tt-briefing-llm.service.ts" {14-15}
private async readSse(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let finishReason: string | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // 마지막 조각은 잘렸을 수 있으니 버퍼에 남긴다.
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]' || payload.length === 0) continue;
      const choice = JSON.parse(payload).choices?.[0];
      if (choice?.delta?.content) content += choice.delta.content;
      if (choice?.finish_reason) finishReason = choice.finish_reason;
    }
  }
  return { content, finishReason };
}
```

네트워크 청크 경계는 SSE 라인 경계와 맞지 않으므로 마지막 줄은 버퍼에 남겨 다음 청크와 잇는다. `delta.content` 만 모으고 `delta.reasoning` 은 버린다. 실제 코드는 `JSON.parse` 를 try/catch 로 감싸 깨진 라인을 건너뛴다.

## 조건 2: 반드시 assistant 프리필

스트리밍으로 524 는 피했지만 content 가 빈 문자열로 왔다. thinking 모델이 `max_tokens` 4096 을 전부 reasoning 에 쓰고 `finish_reason='length'` 로 끝났고, 한 콜에 4분이 걸렸다. 생각을 크게 늘린 건 프롬프트의 부정 지시였다. "코드펜스 쓰지 마라", "한 줄로 써라" 같은 지시 때문에 compact/pretty, 펜스 여부를 14,000자나 되짚었다.

요청의 마지막 메시지를 assistant 역할로 두고 원하는 JSON 의 도입부를 미리 써 두면, 모델은 자기 발화를 이어 쓰는 상황으로 받아 thinking 없이 바로 쓴다. "JSON 으로 답해라"는 어떤 JSON 으로 시작할지를 모델에 맡기지만, 프리필은 그 결정을 없앤다.

```ts title="src/tongtong/ai-briefing/tt-briefing-llm.service.ts" {5}
const res = await fetch(url, {
  method: 'POST',
  body: JSON.stringify({
    // 마지막 메시지를 assistant 로 넣어 모델이 "이어쓰기"를 하게 만든다.
    messages: [...messages, { role: 'assistant', content: prefill }],
    max_tokens: maxTokens,
    stream: true,
  }),
  signal: controller.signal,
});
```

프리필은 콜 종류마다 다르다. 내러티브는 `{"mood":"`, 인사이트 카드는 `{"skip":` 로 시작한다. 응답에는 프리필 뒤의 내용만 오므로 클라이언트가 `prefill + content` 로 붙여 돌려주고, 호출하는 쪽은 바로 JSON 으로 파싱한다.

thinking 은 0자, 호출은 4분에서 10초 이내가 됐다. 현재 `max_tokens` 기본값은 2048 이다.

## 조건 3: 반드시 few-shot 예시 하나

프리필만 있고 예시가 없으면 한국어 사이에 중국어가 섞였다("42,000원에达过半啦呢"). 같은 형태의 문답 예시 한 쌍을 넣자 언어와 출력 형태가 함께 고정됐고, 모든 콜을 다섯 단으로 맞췄다.

```ts title="src/tongtong/ai-briefing/tt-briefing.prompts.ts"
export const NARRATIVE_PREFILL = '{"mood":"';

export function narrativeMessages(m: BriefingMetrics): LlmChatMessage[] {
  return [
    { role: 'system', content: SYSTEM },                         // 1. 톤과 필드 설명
    { role: 'user', content: NARRATIVE_EXAMPLE_IN },             // 2. 예시 입력
    { role: 'assistant', content: NARRATIVE_EXAMPLE_OUT },       // 3. 예시 출력
    { role: 'user', content: renderNarrativeFacts(m) },          // 4. 실제 입력
  ];                                                             // 5. 프리필은 chat() 이 붙인다
}
```

- 예시 출력의 앞부분은 프리필과 글자 하나까지 같아야 한다(`{"mood":"GOOD",...` ↔ `{"mood":"`).
- 실제 입력은 예시 입력과 같은 평문으로 렌더링한다. 팩트 JSON 통째보다 `어제 지출: 52,000원, 3건` 같은 줄글이 작은 모델에게 잘 읽혔다.
- 인사이트 카드는 신호 타입마다 묻는 내용이 달라 타입별 예시를 둔다.
- 시스템 프롬프트는 짧게, "~하지 마라"는 최소화한다. 형태는 예시와 프리필로, 내용 규칙은 사후 검증으로 처리한다.

## 실패는 예외가 아니라 ok:false

로컬 모델은 언제든 꺼져 있을 수 있다. LLM 클라이언트는 throw 하지 않고 타임아웃, 네트워크 오류, 비 2xx, 빈 content 를 모두 결과 객체로 돌려준다. 빈 content 는 HTTP 200 이어도 `ok: false` 다(조건 2 의 경우).

```ts title="src/tongtong/ai-briefing/tt-briefing-llm.service.ts"
// chat() 의 끝부분 — 반환 타입 LlmResult
const { content, finishReason } = await this.readSse(res.body);
return {
  ok: content.length > 0,
  text: prefill + content,
  finishReason,
  latencyMs: Date.now() - started,
  error: content.length === 0 ? 'empty content' : undefined,
};
```

호출 쪽은 `if (!res.ok) continue;` 로 재시도하거나 카드를 건너뛴다. 내러티브는 검증 실패 시 한 번만 다시 부르고, 그래도 안 되면 그 날 브리핑을 `FAILED` 로 남긴다. 느린 모델에 무한 재시도를 걸면 배치 전체가 밀린다. 인사이트 카드는 실패하면 그 카드만 빠진다.

JSON 은 첫 `{` 부터 문자열 리터럴을 인식하며 괄호 균형이 맞는 곳까지만 잘라 파싱하고, `finish_reason='length'` 로 잘렸으면 열린 괄호를 닫아 한 번 더 시도한다. 파싱한 문장은 세 가지 검사를 거친다.

- 금액 대조: 문장의 모든 수가 팩트에 있는 값인지 확인한다. 1,000 미만을 금액이 아니라고 건너뛰면 SGD 가구에서는 거의 모든 금액이 빠져 검사가 무력화되고, 실제로 없는 "157 원"이 통과했다.
- 말투: 해요체 규칙을 넣어도 "~지냈다" 같은 반말이 섞여, 문장 끝 어미를 정규식으로 확인한다.
- 시점: 브리핑은 어제를 다루는데 "오늘 저축으로 S$100을 분리하셨네요" 같은 문장이 잦아, 과거 서술 문단에 "오늘"이 있으면 버린다.

걸린 문장은 고쳐 쓰지 않고 버린다. 숫자를 바로잡으려다 다른 틀린 문장을 만들 수 있다.

## 사용자 새로고침: 요청을 붙잡지 않는다

사용자가 새로고침으로 어제 브리핑을 직접 만들 수 있다(서버가 잠들어 야간 배치가 놓친 날 보충용). 한 장에 40~60초가 걸리므로 202 와 `PROCESSING` 을 바로 돌려주고 백그라운드에서 생성하며, 앱은 `GET /briefings/{date}/status` 를 몇 초 간격으로 폴링한다.

```ts title="src/tongtong/ai-briefing/tt-briefing-generator.service.ts"
if (!this.llm.enabled || !(await this.llm.health())) {
  throw new ServiceUnavailableException('Briefing generator unavailable');
}
// ... FAILED/SKIPPED 행을 PENDING 으로 되돌린다

// 응답을 기다리지 않는다 — runOne 은 throw 하지 않고 실패를 FAILED 로 남긴다.
void this.runOne(row.id, householdId, reportDate);
return { date, status: TtAiReportStatus.PROCESSING };
```

`void` 로 던진 비동기 작업의 예외는 갈 곳이 없으므로, `runOne` 이 `generateOne` 을 감싸 모든 예외를 DB 의 `FAILED` 로 흡수한다. 이미 `READY` 인 브리핑은 다시 만들지 않고(덮어쓰다 실패하면 있던 것까지 잃는다), 게이트웨이가 꺼져 있으면 503, 다른 배치가 처리 중이면 건드리지 않는다.

## 결과

| 항목 | 이전 | 이후 |
| --- | --- | --- |
| 터널 524 | 긴 응답에서 발생 | 스트리밍으로 연결 유지 |
| 한 콜 소요 | 4분, content 빈 문자열 | 10초 이내 |
| thinking 길이 | max_tokens 4096 전부 소진 | 0자 |
| 언어 | 중국어 섞임 | few-shot 이후 한국어로 고정 |

수치는 개발 중 코드 주석에 남긴 실측값이다(호출 시간은 40배 단축으로 기록).

## 이후 변경

v2 API 의 주간·월간 결산 브리핑은 정해진 숫자를 정해진 틀로 전하는 글이라 LLM 없이 SQL 과 템플릿으로 만든다. 같은 클라이언트(`TtBriefingLlmService.chat`)는 "정리할 내역" 자동 분류에 재사용된다. 프리필은 `{"results":[{"n":1,"category":"` 처럼 첫 항목의 모양까지 박아 둔다. `{"results":[` 까지만 주면 가끔 다른 모양이나 중국어·일본어 설명이 섞여 답 전체를 못 읽었다. 응답은 모양이 멀쩡한 줄만 하나씩 건지고, 목록에 없는 카테고리 이름은 버리고 다음 회차에 다시 묻는다.

## 남은 과제

- 모델 인스턴스가 하나라 배치는 순차로 돌고 모든 호출이 줄을 선다. 가구가 늘면 배치 시간도 그대로 늘어나며, 지금은 배치당 처리 가구 수 상한으로 버틴다.
