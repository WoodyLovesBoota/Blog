---
title: "Building a dApp frontend with wagmi and viem"
description: How a dynamic NFT game frontend built on wagmi, viem and RainbowKit routes every write through one hook, resumes a pending confirmation after a page refresh, and finds owned NFTs without an indexer.
translatedFrom: ko
keywords: [wagmi, viem, RainbowKit, simulateContract, waitForTransactionReceipt, getLogs, multicall3, anvil, NFT frontend, transaction refresh]
---

Silo Pets is a dynamic NFT web game where a pet NFT changes appearance by level as you feed and train it (Foundry, Next.js 16 App Router, wagmi, viem, RainbowKit, TanStack Query). It has only run on a local anvil node and is not yet deployed to Base Sepolia.

## Structure: reads go through RPC, writes through the wallet

There is no backend database and no indexer. Level, hunger and rankings are all computed from on-chain values. There are two contracts: `PetNFT` (ERC-721) and an energy token `Energy` (ERC-20). Feeding burns 1 energy, training burns 3, and you refill once it runs out.

### Why the wagmi config is split into three files

To stop the "Connect wallet" button from flickering on refresh, the connection state lives in a cookie and is restored with `cookieToInitialState` in `layout.tsx` (server). Calling RainbowKit's `getDefaultConfig` on the server breaks the build, though. So the shared parts (chains, transports, cookie storage) live in `lib/chain.ts`, the client-only `getDefaultConfig` and wallet list in `lib/wagmi.ts`, and a wallet-less `createConfig` used only for cookie restoration in `lib/wagmiServer.ts`.

In the wagmi source, `cookieToInitialState` uses only `storage` from the config, and only to build the cookie name (`wagmi.store` and so on). As long as `storage` is the same, a wallet-less server config gives the same result. The cost is that reading `headers()` in the layout makes every page below it dynamically rendered. That is why `cacheComponents` is off and ISR on the ranking page does not work (a separate topic).

## Every write goes through usePetAction

There are four write actions: adopt (`adopt`), feed (`feed`), train (`train`) and refill (`refill`). To avoid repeating phase state, error handling and post-confirmation reads four times, they are collected in one hook. The flow is ① simulate → ② sign → ③ wait for confirmation → ④ parse events → ⑤ invalidate cache → ⑥ `onDone`. Button labels differ per step, so instead of `useMutation`'s `isPending` there is a separate `phase` (`"idle" | "simulating" | "signing" | "confirming"`).

```ts title="web/src/hooks/usePetAction.ts" {6,8,14,16}
const mutation = useMutation({
  mutationFn: async (args: PetActionArgs) => {
    setPhase("simulating");
    let txHash: Hash;
    if (args.fn === "feed" || args.fn === "train") {
      const { request } = await simulateContract(config, { ...petNft, functionName: args.fn, args: [args.petId] });
      setPhase("signing");
      txHash = await writeContractAsync(request);
    } else {
      const { request } = await simulateContract(config, { ...petNft, functionName: args.fn });
      setPhase("signing");
      txHash = await writeContractAsync(request);
    }
    savePending({ hash: txHash, args }); // handles refresh (explained below)
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

- If `simulateContract` reverts, it throws a custom error and the wallet prompt never opens.
- ① and ② are repeated in each branch because of types. Merging them as `const { request } = condition ? simA : simB` makes `request` a union that `writeContractAsync` won't accept. Signing inside each branch pins the type down. I chose duplication over casting.
- `onDone` is held in a ref, so if the parent passes a new function while confirmation is pending, the latest one is called.
- Simulation runs on the config's chain but signing goes to the wallet's chain, so when they differ the simulation passes and signing fails. When `chainId` from `useAccount()` differs, the action buttons are hidden and only a `useSwitchChain` switch button is shown.

### After confirmation: throw on reverted yourself

Steps ③–⑤ are extracted into `confirm` so they can be shared with refresh resumption.

```ts title="web/src/hooks/usePetAction.ts" {3,6,13}
async function confirm(config, queryClient, txHash: Hash, timeout?: number) {
  const receipt = await waitForTransactionReceipt(config, { hash: txHash, timeout });
  if (receipt.status === "reverted") throw new Error("TX_REVERTED");

  const events = parseEvents(receipt.logs);
  await queryClient.invalidateQueries();
  return { hash: txHash, events };
}

function parseEvents(logs) {
  return parseEventLogs({
    abi: petNft.abi,
    logs: logs.filter((l) => l.address && isAddressEqual(l.address, petNft.address)),
  });
}
```

- If state changes between simulation and execution (say, a refill went through first in another tab), viem does not throw even when the receipt is `reverted`, so the hook throws itself.
- A single training also emits an `Energy` `Transfer` log, so only logs from the `PetNFT` address are kept with `isAddressEqual`. The resulting `LevelUp` and `Trained` events drive the animations.
- One action changes both the pet (XP, level) and the balance, and wagmi's query keys are complicated, so the whole cache is invalidated. At this scale that is only a few refetches. `onDone` is called after awaiting the invalidation, so the XP bar and the `+40` animation start together from the new values.

### Mapping custom errors to UI messages

```ts title="web/src/lib/errors.ts"
const MESSAGES: Record<string, string> = {
  ERC20InsufficientBalance: "활동력이 부족해요. 충전하고 다시 해보세요", // "Not enough energy. Refill and try again"
  StillHasEnergy: "활동력을 다 쓴 뒤에 충전할 수 있어요", // "You can refill after using up your energy"
  // ...
};

export function toErrorMessage(error: unknown): string | null {
  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) return null;
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && name in MESSAGES) return MESSAGES[name];
    }
  }
  return "처리하지 못했어요. 다시 시도해주세요"; // "Something went wrong. Please try again"
}
```

- viem wraps the underlying cause in layers of `cause`, so `walk` goes down the chain. A user rejection returns `null` (the button resets with no message). The out-of-energy revert comes from `Energy.burn`, called by `PetNFT`, and `ERC20InsufficientBalance` is not in the `PetNFT` ABI. If it is not in the ABI, `errorName` is empty and the default message is shown. So `lib/contracts.ts` picks only the error entries from the `Energy` ABI with a type-guard `filter` and merges them as `abi: [...petNftAbi, ...energyErrors]`.
- `errors.ts` has no React or wagmi dependency and is covered by 5 unit tests (including the case where the default message appears if the error ABI is not merged).

## What if the page is refreshed while waiting for confirmation?

A refresh does not cancel the transaction, but `phase` and the hash live only in memory, so they are lost and the buttons unlock. For a refill, the energy still shows 0 before confirmation, so the user presses again, and the second refill reverts with `StillHasEnergy` after the first one confirms, wasting gas. The level-up animation is lost too.

Pending-transaction indicators in the wallet and RainbowKit only display status; they cannot lock buttons or restore animations. An indexer means running a separate server, which is out of scope. So RainbowKit's recent transactions (`showRecentTransactions` + `useAddRecentTransaction`) show a spinner and list in the header, while button locking and animation restoration are handled by writing the hash to browser storage and having the reopened page wait for the receipt. The limits: it works only in the same browser, and the storage format and cleanup have to be managed by hand.

### Storing the hash in sessionStorage

```ts title="web/src/lib/pendingTx.ts"
const KEY = "silo-pets:pending-tx";
type Stored = { hash: string; fn: PetActionArgs["fn"]; petId?: string };

export function savePending({ hash, args }: PendingTx): void {
  const stored: Stored = { hash, fn: args.fn, petId: "petId" in args ? args.petId.toString() : undefined };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // If storage is blocked, the action still proceeds (only refresh handling is lost)
  }
}

```

- sessionStorage is per tab. With localStorage, the same page in another tab would pick up the pending state and lock its buttons. A refresh stays in the same tab, so per-tab is enough.
- `petId` is a bigint, and `JSON.stringify` throws a TypeError on it, so it is stored as a string and turned back with `BigInt` on read. Stored values can be tampered with, so `readPending` checks them with `isHash` and `/^\d+$/` and treats anything odd as `null`.

### Resuming the wait

When the page opens, it reads the record, and if the screen's `resumeIf` decides the action is relevant, it waits again from step ③. A pet screen resumes feeding/training for that pet and refills; the home screen resumes only adoption.

```ts title="web/src/hooks/usePetAction.ts" {4,9}
const RESUME_TIMEOUT_MS = 120_000;

const resume = useCallback(async () => {
  if (resumingRef.current) return; // guard against StrictMode running the effect twice
  const pending = readPending();
  if (!pending || !resumeIfRef.current?.(pending.args)) return;
  resumingRef.current = true;
  setResumed(pending.args);
  setPhase("confirming"); // lock buttons
  try {
    const result = await confirm(config, queryClient, pending.hash, RESUME_TIMEOUT_MS);
    onDoneRef.current?.(result, pending.args); // same animations as usual
  } catch {
    void queryClient.invalidateQueries(); // failures and timeouts stay silent; just show real values
  } finally {
    clearPending();
    setPhase("idle");
    setResumed(undefined);
    resumingRef.current = false;
  }
}, [config, queryClient]);
```

- Setting `phase` to `"confirming"` locks the buttons exactly as in the normal flow. The pressed button is signaled with `resumed` instead of `mutation.variables`.
- A resumed action does not go through `mutate`, so there is no per-call `onSuccess`. That is why `onDone` is taken as a hook option, so both paths produce the same animations.
- `resumingRef` prevents StrictMode's double effect run from waiting on the same hash twice and playing the animation twice. When anvil restarts the hash disappears and the wait could last forever, so a 2-minute timeout applies to resumption only. The normal flow has no limit, since the transaction was just sent.

## Finding my NFTs without an indexer

Pets can be transferred, so the home screen's "My pets" list must show "the zero or more pets I own right now". ERC721Enumerable adds a lot of gas to every transfer, so writes are kept cheap and reads find pets through logs.

It collects `Transfer` logs addressed to me (adoption `0x0 → me`, receipt `someone → me`) and keeps only those pets whose `ownerOf` is still me.

```ts title="web/src/hooks/useMyPets.ts"
const TRANSFER = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)");

async function findMyPets(client: PublicClient, me: Address): Promise<bigint[]> {
  const latest = await client.getBlockNumber();
  const received = await receivedIds(client, me, DEPLOY_BLOCK, latest);
  const ids = [...new Set(received)]; // receiving, sending and receiving again leaves multiple logs
  if (ids.length === 0) return [];

  const owners = await readMany(client, ids.map((id) => ({ ...petNft, functionName: "ownerOf", args: [id] }) as const));
  return ids.filter((_, i) => isAddressEqual(owners[i] as Address, me));
}
```

- `args: { to: me }` lets the node do the filtering. The start block is the deployment block printed by the deploy script, passed in through env. Starting from 0 is slow or rejected on public RPCs.
- The address is part of the query key, so switching wallets triggers a fresh read, and after adoption the full invalidation refreshes it. Right after adoption, the new pet's ID is taken from the receipt's `Adopted` event and the user is sent to `/pet/<id>`.

### Halving the range when getLogs is rejected

RPC providers each have different block-range and result-count limits for `getLogs`, so it is hard to pick a fixed number. The hook calls once with the full range and, if rejected, splits it in half and recurses.

```ts title="web/src/hooks/useMyPets.ts" {11-14}
async function receivedIds(client: PublicClient, me: Address, from: bigint, to: bigint): Promise<bigint[]> {
  try {
    const logs = await client.getLogs({
      address: petNft.address,
      event: TRANSFER,
      args: { to: me },
      fromBlock: from,
      toBlock: to,
    });
    return logs.map((l) => l.args.tokenId!);
  } catch (error) {
    if (from >= to) throw error; // if even a single block fails, the range is not the problem
    const mid = (from + to) / 2n;
    return [...(await receivedIds(client, me, from, mid)), ...(await receivedIds(client, me, mid + 1n, to))];
  }
}
```

On anvil or an RPC that allows wide ranges, finishing in one call is fastest, and splitting only on rejection adapts to any RPC's limits.

### anvil has no multicall3

viem's `foundry` chain definition has no multicall3 address, and `client.multicall` errors immediately without one. wagmi's `useReadContracts` falls back to individual reads when multicall fails, so `usePet` worked on anvil, but places that use viem directly (server-side rankings and metadata, `useMyPets`) have no such handling. Hence `readMany`: if `client.chain?.contracts?.multicall3` exists it calls `client.multicall({ contracts, allowFailure: false })`, otherwise it calls `client.readContract` for each one with `Promise.all`.


On Base and Base Sepolia this is a single request; only on anvil does it fan out. Individual reads are not guaranteed to hit the same block, so there can be a moment where XP is new and level is stale. anvil does not advance blocks without transactions, so in practice they rarely diverge, and since this only affects local development I accepted it.

## Results

The button side (`PetActions`, `HomeView`) only defines labels, `onDone` and `resumeIf`. Of the 176 web unit tests, the 5 for error-message mapping are in this post's scope. The hooks and screen flows were checked during development with Playwright by injecting a test EIP-1193 wallet that signs immediately with an anvil account, covering adoption, feeding, training, level-up, refill, refresh resumption and received pets (the test wallet is not in the repository).

## Remaining work

- Verified only on local anvil. How often `getLogs` splits on a public RPC has to be checked after deploying to Base Sepolia. The split ranges are called sequentially, so frequent rejections could make it slow.
- Invalidating the whole cache after each action only holds at the current scale. As more screens read data, invalidation will need to be per key.
- Resuming the wait only works in the same tab. Showing pending state across devices and tabs would need a server-side record such as an indexer.
