---
title: "Integrating a local LLM: streaming, prefill and few-shot prompting"
description: Generating daily household-budget briefings with a local qwen-family thinking model hit tunnel 524s, empty content and Chinese mixed into Korean output. Streaming, an assistant prefill and a few-shot example fixed each one.
keywords: [local LLM, thinking model, qwen, assistant prefill, prefill, few-shot, SSE streaming, Cloudflare quick tunnel, 524 timeout, NestJS]
translatedFrom: ko
---

In Tongtong, a household budget app for couples (NestJS backend), the daily briefing takes numbers the server computes in SQL and has a local qwen-family thinking model turn them into sentences. A plain call that only sends `messages` to the OpenAI-compatible gateway failed almost every time. It worked only once streaming, an assistant prefill and a few-shot example were all in place.

## Architecture

1. The server computes the facts (yesterday's transactions, the 7-day average, month-to-date totals, budget) and picks insight signals by rule (category spikes, late-night spending, hidden subscriptions, and so on).
2. It sends one LLM call for the narrative (headline, body, outlook) and one call per signal for a card.
3. It validates the response JSON and stores only the pieces that pass.

The gateway is exposed through a Cloudflare quick tunnel, and the app server calls it over HTTP. The production server is on a free tier that sleeps when idle, so once a day GitHub Actions wakes an internal endpoint to run the batch.

## Rule 1: always stream

A quick tunnel waits at most 100 seconds for the origin's first response, then cuts it with a 524. The model produces about 17 tokens per second, roughly 1,700 tokens in 100 seconds. A non-streaming call sends its first byte only after the whole answer is done, so long responses end in a 524. With `stream: true` the first chunk goes out immediately and the connection stays open, but you have to read the SSE body yourself.

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
    // The last piece may be cut off, so keep it in the buffer.
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

Network chunk boundaries don't line up with SSE line boundaries, so the last line stays in the buffer and gets joined with the next chunk. Only `delta.content` is collected; `delta.reasoning` is dropped. The real code wraps `JSON.parse` in try/catch to skip broken lines.

## Rule 2: always prefill the assistant turn

Streaming avoided the 524, but content came back as an empty string. The thinking model spent the whole `max_tokens` budget of 4096 on reasoning and stopped with `finish_reason='length'`, and a single call took 4 minutes. What inflated the thinking was the negative instructions in the prompt. Instructions like "don't use code fences" and "write it on one line" made it go back and forth over compact vs. pretty and fences vs. no fences for 14,000 characters.

If the last message of the request has the assistant role and already contains the opening of the desired JSON, the model treats it as continuing its own turn and writes straight away without thinking. "Answer in JSON" leaves it to the model to decide how the JSON starts; a prefill removes that decision.

```ts title="src/tongtong/ai-briefing/tt-briefing-llm.service.ts" {5}
const res = await fetch(url, {
  method: 'POST',
  body: JSON.stringify({
    // Put the last message as assistant so the model "continues" it.
    messages: [...messages, { role: 'assistant', content: prefill }],
    max_tokens: maxTokens,
    stream: true,
  }),
  signal: controller.signal,
});
```

The prefill differs per call type. The narrative starts with `{"mood":"` and insight cards with `{"skip":`. The response contains only what comes after the prefill, so the client returns `prefill + content` and the caller parses it as JSON directly.

Thinking dropped to 0 characters, and a call went from 4 minutes to under 10 seconds. The current default for `max_tokens` is 2048.

## Rule 3: always include one few-shot example

With a prefill but no example, Chinese got mixed into the Korean ("42,000원에达过半啦呢", roughly "already past half at 42,000 won"). Adding one example input/output pair of the same shape fixed both the language and the output shape, and every call now follows a five-part layout.

```ts title="src/tongtong/ai-briefing/tt-briefing.prompts.ts"
export const NARRATIVE_PREFILL = '{"mood":"';

export function narrativeMessages(m: BriefingMetrics): LlmChatMessage[] {
  return [
    { role: 'system', content: SYSTEM },                         // 1. tone and field descriptions
    { role: 'user', content: NARRATIVE_EXAMPLE_IN },             // 2. example input
    { role: 'assistant', content: NARRATIVE_EXAMPLE_OUT },       // 3. example output
    { role: 'user', content: renderNarrativeFacts(m) },          // 4. real input
  ];                                                             // 5. chat() appends the prefill
}
```

- The start of the example output must match the prefill character for character (`{"mood":"GOOD",...` ↔ `{"mood":"`).
- The real input is rendered as the same plain text as the example input. Prose lines like `어제 지출: 52,000원, 3건` ("Yesterday's spending: 52,000 won, 3 transactions") were easier for a small model to read than the whole facts JSON.
- Insight cards ask different things per signal type, so each type has its own example.
- Keep the system prompt short and minimize "don't do X". Handle shape with the example and the prefill, and content rules with post-validation.

## Failure is ok:false, not an exception

The local model can be down at any time. The LLM client never throws; timeouts, network errors, non-2xx responses and empty content all come back as a result object. Empty content is `ok: false` even with HTTP 200 (the Rule 2 case).

```ts title="src/tongtong/ai-briefing/tt-briefing-llm.service.ts"
// End of chat() — return type LlmResult
const { content, finishReason } = await this.readSse(res.body);
return {
  ok: content.length > 0,
  text: prefill + content,
  finishReason,
  latencyMs: Date.now() - started,
  error: content.length === 0 ? 'empty content' : undefined,
};
```

The caller retries or skips the card with `if (!res.ok) continue;`. The narrative is retried only once on validation failure; if that also fails, that day's briefing is left as `FAILED`. Infinite retries on a slow model would push back the whole batch. If an insight card fails, only that card is dropped.

The JSON is cut from the first `{` up to the point where brackets balance, tracking string literals along the way, and then parsed. If it was truncated with `finish_reason='length'`, the open brackets are closed and parsing is tried once more. Parsed sentences go through three checks.

- Amount check: every number in a sentence must be a value present in the facts. Skipping anything under 1,000 as "not an amount" dropped almost every amount for SGD households, which disabled the check, and a nonexistent "157 원" (157 won) got through.
- Tone: even with a polite-form (해요체) rule in the prompt, casual endings like "~지냈다" slipped in, so sentence-final endings are checked with a regex.
- Timeframe: the briefing covers yesterday, yet sentences like "오늘 저축으로 S$100을 분리하셨네요" ("You set aside S$100 into savings today") were common, so a past-tense paragraph containing "오늘" ("today") is discarded.

Sentences that fail are discarded, not rewritten. Trying to fix a number can produce a different wrong sentence.

## User refresh: don't hold the request

Users can generate yesterday's briefing themselves with a refresh (to fill in days the nightly batch missed because the server was asleep). One briefing takes 40–60 seconds, so the server immediately returns 202 with `PROCESSING` and generates it in the background, while the app polls `GET /briefings/{date}/status` every few seconds.

```ts title="src/tongtong/ai-briefing/tt-briefing-generator.service.ts"
if (!this.llm.enabled || !(await this.llm.health())) {
  throw new ServiceUnavailableException('Briefing generator unavailable');
}
// ... reset FAILED/SKIPPED rows back to PENDING

// Don't wait for the result — runOne never throws and records failures as FAILED.
void this.runOne(row.id, householdId, reportDate);
return { date, status: TtAiReportStatus.PROCESSING };
```

Exceptions from an async task fired with `void` have nowhere to go, so `runOne` wraps `generateOne` and absorbs every exception into `FAILED` in the DB. A briefing that is already `READY` is not regenerated (if overwriting it failed, the existing one would be lost too), the endpoint returns 503 when the gateway is down, and it leaves the row alone when another batch is processing it.

## Results

| Item | Before | After |
| --- | --- | --- |
| Tunnel 524 | On long responses | Connection kept open by streaming |
| Time per call | 4 min, empty content | Under 10 s |
| Thinking length | Used all of max_tokens 4096 | 0 characters |
| Language | Chinese mixed in | Fixed to Korean after few-shot |

The numbers are measurements left in code comments during development (call time was recorded as a 40x reduction).

## Later changes

The weekly and monthly summary briefings in the v2 API deliver fixed numbers in a fixed format, so they are built with SQL and templates, without an LLM. The same client (`TtBriefingLlmService.chat`) is reused to auto-categorize the "items to sort" list. Its prefill pins down even the shape of the first item, as in `{"results":[{"n":1,"category":"`. Giving only `{"results":[` sometimes produced a different shape or mixed-in Chinese and Japanese explanations, and the whole answer became unreadable. From the response, only lines with an intact shape are picked out one by one; category names not in the list are discarded and asked again in the next run.

## Remaining work

- There is a single model instance, so the batch runs sequentially and every call waits in line. Batch time grows with the number of households; for now a cap on households per batch holds it in check.
