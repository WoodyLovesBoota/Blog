---
title: "wagmi, viem 프론트엔드"
description: wagmi·viem·RainbowKit 다이내믹 NFT 게임 프론트에서 쓰기를 훅 하나로 모으고, 확정 대기 중 새로고침을 이어받고, 인덱서 없이 보유 NFT 를 찾은 방법.
date: 2026-11-25
updated: 2026-11-28
tags: [wagmi, viem, web3, nextjs, react]
keywords: [wagmi, viem, RainbowKit, simulateContract, waitForTransactionReceipt, ownerOf, multicall3, anvil, NFT 프론트엔드, 트랜잭션 새로고침]
---

Mochimals 는 펫 NFT 에 밥을 주고 훈련시키면 레벨에 따라 모습이 바뀌는 다이내믹 NFT 웹게임이다(Foundry, Next.js 16 App Router, wagmi, viem, RainbowKit, TanStack Query). 로컬 anvil 에서 만들고 Base Sepolia 에 배포해 [mochimals.woodylovesboota.xyz](https://mochimals.woodylovesboota.xyz) 에서 돌아간다.

## 구조: 읽기는 RPC, 쓰기는 지갑

백엔드 DB 도 인덱서도 없이 레벨, 배고픔, 랭킹을 전부 체인 값에서 계산한다. 컨트랙트는 `PetNFT`(ERC-721)와 활동력 토큰 `Energy`(ERC-20) 두 개다. 밥은 활동력 1, 훈련은 3 을 태우고, 다 쓰면 충전한다.

### wagmi 설정을 세 파일로 나눈 이유

새로고침 시 "지갑 연결" 버튼 깜빡임을 없애려고 연결 상태를 쿠키에 두고 `layout.tsx`(서버)에서 `cookieToInitialState` 로 복원한다. 그런데 RainbowKit `getDefaultConfig` 를 서버에서 부르면 빌드가 실패해서, 공통 부분(체인, transports, 쿠키 storage)은 `lib/chain.ts`, 클라이언트 전용 `getDefaultConfig` 와 지갑 목록은 `lib/wagmi.ts`, 쿠키 복원 전용으로 지갑 없는 `createConfig` 는 `lib/wagmiServer.ts` 에 뒀다.

wagmi 소스상 `cookieToInitialState` 는 config 에서 `storage` 만, 그것도 쿠키 이름(`wagmi.store` 등)을 만드는 데만 쓴다. `storage` 가 같으면 지갑 없는 서버 config 로도 결과가 같다. 대가로 layout 에서 `headers()` 를 읽으면 그 아래 모든 페이지가 동적 렌더링이 된다. 그래서 `cacheComponents` 를 껐고 랭킹 페이지 ISR 도 동작하지 않는다(별도 주제).

## 모든 쓰기를 usePetAction 하나로

쓰기 행동은 입양(`adopt`), 밥(`feed`), 훈련(`train`), 충전(`refill`) 넷이다. 단계 상태, 에러 처리, 확정 후 다시 읽기를 네 번 반복하지 않도록 훅 하나로 모았다. 흐름은 ① 시뮬레이션 → ② 서명 → ③ 확정 대기 → ④ 이벤트 해석 → ⑤ 캐시 무효화 → ⑥ `onDone` 이다. 버튼 문구가 단계마다 달라서 `useMutation` 의 `isPending` 대신 `phase`(`"idle" | "simulating" | "signing" | "confirming"`)를 따로 둔다.

```ts title="web/src/hooks/usePetAction.ts" {6-10,12,21,23}
const mutation = useMutation({
  mutationFn: async (args: PetActionArgs) => {
    setPhase("simulating");
    let txHash: Hash;
    if (args.fn === "feed" || args.fn === "train") {
      const { request } = await simulateContract(config, {
        ...petNft,
        functionName: args.fn,
        args: [args.petId],
      });
      setPhase("signing");
      txHash = await writeContractAsync(request);
    } else {
      const { request } = await simulateContract(config, {
        ...petNft,
        functionName: args.fn,
      });
      setPhase("signing");
      txHash = await writeContractAsync(request);
    }
    savePending({ hash: txHash, args }); // 새로고침 대응 (뒤에서 설명)
    setPhase("confirming");
    return await confirm(config, queryClient, txHash);
  },
  onSuccess: (result, args) => onDoneRef.current?.(result, args),
  onSettled: () => {
    setPhase("idle");
    clearPending();
  },
});
```

- `simulateContract` 에서 revert 하면 커스텀 에러로 throw 되고 지갑 창이 뜨지 않는다.
- ①②를 갈래마다 반복한 건 타입 때문이다. `const { request } = 조건 ? 시뮬A : 시뮬B` 로 합치면 `request` 가 유니온이 되어 `writeContractAsync` 가 받지 못한다. 갈래 안에서 서명하면 타입이 하나로 정해진다. 캐스팅보다 중복을 택했다.
- `onDone` 은 ref 로 들고 있어, 확정 대기 중 부모가 새 함수를 넘겨도 최신 함수를 부른다.
- 시뮬레이션은 config 체인으로 돌지만 서명은 지갑의 체인으로 가서, 체인이 다르면 시뮬레이션은 통과하고 서명에서 실패한다. 그래서 `useAccount()` 의 `chainId` 가 다르면 행동 버튼을 숨기고 `useSwitchChain` 전환 버튼만 보인다.

### 확정 이후: reverted 는 직접 throw

③~⑤는 새로고침 이어받기와 공유하려고 `confirm` 으로 뺐다.

```ts title="web/src/hooks/usePetAction.ts" {6,9,16-18}
async function confirm(config, queryClient, txHash: Hash, timeout?: number) {
  const receipt = await waitForTransactionReceipt(config, {
    hash: txHash,
    timeout,
  });
  if (receipt.status === "reverted") throw new Error("TX_REVERTED");

  const events = parseEvents(receipt.logs);
  await queryClient.invalidateQueries();
  return { hash: txHash, events };
}

function parseEvents(logs) {
  return parseEventLogs({
    abi: petNft.abi,
    logs: logs.filter(
      (l) => l.address && isAddressEqual(l.address, petNft.address),
    ),
  });
}
```

- 시뮬레이션과 실행 사이에 상태가 바뀌면(다른 탭에서 먼저 충전 등) receipt 가 `reverted` 여도 viem 은 throw 하지 않으므로 직접 던진다.
- 훈련 한 번에 `Energy` 의 `Transfer` 로그도 찍히므로 `PetNFT` 주소 로그만 `isAddressEqual` 로 거른다. 여기서 나온 `LevelUp`, `Trained` 가 연출 입력이다.
- 행동 하나가 펫(XP, 레벨)과 잔액을 함께 바꾸고 wagmi 쿼리 키가 복잡해서 캐시는 전부 무효화한다. 이 규모에서는 재요청이 몇 개 안 된다. 무효화를 `await` 한 뒤 `onDone` 을 불러 XP 바와 `+40` 연출이 새 값에서 동시에 시작한다.

### 커스텀 에러를 화면 문구로

```ts title="web/src/lib/errors.ts"
const MESSAGES: Record<string, string> = {
  ERC20InsufficientBalance: "활동력이 부족해요. 충전하고 다시 해보세요",
  StillHasEnergy: "활동력을 다 쓴 뒤에 충전할 수 있어요",
  // ...
};

export function toErrorMessage(error: unknown): string | null {
  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) return null;
    const reverted = error.walk(
      (e) => e instanceof ContractFunctionRevertedError,
    );
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && name in MESSAGES) return MESSAGES[name];
    }
  }
  return "처리하지 못했어요. 다시 시도해주세요";
}
```

- viem 에러는 원인을 `cause` 로 겹겹이 감싸서 `walk` 로 사슬을 내려간다. 사용자 거절은 `null`(문구 없이 버튼만 복귀)이다. 활동력 부족 revert 는 `PetNFT` 가 부른 `Energy.burn` 에서 나고, `ERC20InsufficientBalance` 는 `PetNFT` ABI 에 없다. ABI 에 없으면 `errorName` 이 비어 기본 문구로 떨어진다. 그래서 `lib/contracts.ts` 에서 `Energy` ABI 의 에러 항목만 타입 가드 `filter` 로 골라 `abi: [...petNftAbi, ...energyErrors]` 로 합쳤다.
- `errors.ts` 는 React·wagmi 의존이 없어 단위 테스트 5개로 검증한다(에러 ABI 를 합치지 않으면 기본 문구로 떨어지는 케이스 포함).

## 확정을 기다리다 새로고침하면?

새로고침해도 트랜잭션은 취소되지 않지만 `phase` 와 해시는 메모리에만 있어 사라지고, 버튼이 다시 열린다. 충전에서는 확정 전이라 활동력이 0 으로 보여 사용자가 또 누르고, 두 번째 충전은 첫 번째 확정 뒤 `StillHasEnergy` 로 revert 해 가스비만 날린다. 레벨업 연출도 사라진다.

지갑·RainbowKit 의 대기 트랜잭션 표시는 표시만 하고 버튼 잠금이나 연출 복원은 못 한다. 인덱서는 서버를 따로 운영해야 해서 범위 밖이다. 그래서 RainbowKit 최근 트랜잭션(`showRecentTransactions` + `useAddRecentTransaction`)으로 헤더에 스피너와 목록을 띄우고, 버튼 잠금과 연출 복원은 해시를 브라우저 저장소에 적어 두고 다시 열린 페이지가 영수증을 기다리는 방식으로 처리한다. 같은 브라우저에서만 되고 저장 형식과 정리를 직접 관리해야 한다는 한계가 있다.

### sessionStorage 에 해시 저장

```ts title="web/src/lib/pendingTx.ts"
const KEY = "silo-pets:pending-tx";
type Stored = { hash: string; fn: PetActionArgs["fn"]; petId?: string };

export function savePending({ hash, args }: PendingTx): void {
  const stored: Stored = {
    hash,
    fn: args.fn,
    petId: "petId" in args ? args.petId.toString() : undefined,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // 저장이 막혀도 행동 자체는 계속된다 (새로고침 대응만 빠진다)
  }
}

```

- sessionStorage 는 탭 단위다. localStorage 면 다른 탭의 같은 페이지가 대기 상태를 이어받아 버튼을 잠근다. 새로고침은 같은 탭이라 충분하다.
- `petId` 는 bigint 라 `JSON.stringify` 에서 TypeError 가 나므로 문자열로 저장하고 읽을 때 `BigInt` 로 되돌린다. 저장소 값은 조작 가능하니 `readPending` 에서 `isHash` 와 `/^\d+$/` 로 검사하고 이상하면 `null` 로 친다.

### 이어서 기다리기

페이지가 열리면 기록을 읽고, 화면이 `resumeIf` 로 상관있다고 판단한 행동이면 ③부터 다시 기다린다. 펫 화면은 그 펫의 밥/훈련과 충전, 홈은 입양만 이어받는다.

```ts title="web/src/hooks/usePetAction.ts" {4,9}
const RESUME_TIMEOUT_MS = 120_000;

const resume = useCallback(async () => {
  if (resumingRef.current) return; // StrictMode 의 effect 두 번 실행 방지
  const pending = readPending();
  if (!pending || !resumeIfRef.current?.(pending.args)) return;
  resumingRef.current = true;
  setResumed(pending.args);
  setPhase("confirming"); // 버튼 잠금
  try {
    const result = await confirm(
      config,
      queryClient,
      pending.hash,
      RESUME_TIMEOUT_MS,
    );
    onDoneRef.current?.(result, pending.args); // 연출도 그대로
  } catch {
    void queryClient.invalidateQueries(); // 실패나 시간 초과는 조용히, 화면만 실제 값으로
  } finally {
    clearPending();
    setPhase("idle");
    setResumed(undefined);
    resumingRef.current = false;
  }
}, [config, queryClient]);
```

- `phase` 를 `"confirming"` 으로 두면 버튼이 일반 흐름과 똑같이 잠긴다. 눌린 버튼은 `mutation.variables` 대신 `resumed` 로 알린다.
- 이어받은 행동은 `mutate` 를 거치지 않아 호출별 `onSuccess` 가 없다. 그래서 `onDone` 을 훅 옵션으로 받아 두 경로에서 같은 연출을 낸다.
- `resumingRef` 는 StrictMode 의 effect 이중 실행으로 같은 해시를 두 번 기다리고 연출이 두 번 나오는 것을 막는다. anvil 재시작 시 해시가 사라져 영원히 기다릴 수 있어 이어받기에만 2분 timeout 을 둔다. 일반 흐름은 방금 보낸 트랜잭션이라 제한이 없다.

## 인덱서 없이 내 NFT 찾기

펫은 전송될 수 있으니 홈의 "내 펫 목록"은 "지금 가진 펫 0마리 이상"이어야 한다. ERC721Enumerable 은 전송마다 가스가 크게 늘어서 컨트랙트에 주소별 목록을 두지 않고, 읽기에서 찾는다.

펫 번호는 1부터 `totalSupply` 까지 빈칸 없이 이어지므로, 모든 펫의 `ownerOf` 를 200개씩 묶어 읽고 주인이 나인 번호만 남긴다.

```ts title="web/src/hooks/useMyPets.ts"
async function findMyPets(
  client: PublicClient,
  me: Address,
): Promise<bigint[]> {
  // 펫 번호는 1부터 totalSupply까지 빈칸 없이 이어진다
  // (adopt의 petId = ++totalSupply, 소각 없음)
  const total = await client.readContract({
    ...petNft,
    functionName: "totalSupply",
  });
  const ids = Array.from({ length: Number(total) }, (_, i) => BigInt(i + 1));

  const mine: bigint[] = [];
  for (let start = 0; start < ids.length; start += CHUNK) {
    const chunk = ids.slice(start, start + CHUNK); // CHUNK = 200
    const owners = await readMany(
      client,
      chunk.map(
        (id) => ({ ...petNft, functionName: "ownerOf", args: [id] }) as const,
      ),
    );
    chunk.forEach((id, i) => {
      if (isAddressEqual(owners[i] as Address, me)) mine.push(id);
    });
  }
  return mine;
}
```

- 들어온 `Transfer` 로그(`getLogs`)로 찾지 않는 이유: Base Sepolia RPC 는 `getLogs` 한 번의 블록 범위를 10~200블록으로 막고, 블록은 2초마다 쌓인다. 배포 블록부터 훑으면 요청이 수천 개가 된다. `ownerOf` 조회는 블록 수가 아니라 펫 수에 비례하고, multicall3 가 있는 체인에서는 200마리당 요청 한 번이다.
- 쿼리 키에 주소를 넣어 지갑 전환 시 새로 읽고, 입양 뒤에는 전체 무효화로 갱신된다. 입양 직후 이동은 영수증의 `Adopted` 이벤트에서 새 펫 번호를 꺼내 `/pet/<id>` 로 보낸다.

### anvil 에는 multicall3 가 없다

viem 의 `foundry` 체인 정의에는 multicall3 주소가 없고, `client.multicall` 은 주소가 없으면 바로 에러를 낸다. wagmi 의 `useReadContracts` 는 multicall 실패 시 개별 읽기로 폴백해서 `usePet` 은 anvil 에서도 동작했지만, viem 을 직접 쓰는 곳(서버의 랭킹·메타데이터, `useMyPets`)에는 그런 처리가 없다. 그래서 `readMany` 를 두었다. `client.chain?.contracts?.multicall3` 가 있으면 `client.multicall({ contracts, allowFailure: false })`, 없으면 `Promise.all` 로 `client.readContract` 를 각각 부른다.


Base·Base Sepolia 에서는 요청 한 번, anvil 에서만 여러 번 나간다. 개별 읽기는 같은 블록 기준이 보장되지 않아 XP 는 새 값, 레벨은 옛 값인 순간이 생길 수 있다. anvil 은 트랜잭션이 없으면 블록이 바뀌지 않아 실제로는 거의 어긋나지 않고, 로컬 개발에만 해당해서 받아들였다.

## 결과

버튼 쪽(`PetActions`, `HomeView`)은 문구, `onDone`, `resumeIf` 만 정한다. 웹 단위 테스트 176개 중 이 글 범위는 에러 문구 변환 5개다. 훅과 화면 흐름은 개발 중 Playwright 로 anvil 계정이 바로 서명하는 테스트용 EIP-1193 지갑을 주입해 입양, 밥, 훈련, 레벨업, 충전, 새로고침 이어받기, 전송받은 펫을 확인했다(테스트 지갑은 저장소에 없음).

## 남은 과제

- 내 펫 찾기가 전체 펫 수에 비례한다. 펫이 수만 마리가 되면 인덱서(The Graph, Ponder 등)로 옮겨야 한다.
- 행동 뒤 전체 캐시 무효화는 지금 규모에서만 유효하다. 읽는 화면이 늘면 키 단위로 무효화해야 한다.
- 이어서 기다리기는 같은 탭에서만 된다. 다른 기기·탭의 대기 상태까지 보이려면 인덱서 같은 서버 쪽 기록이 필요하다.
