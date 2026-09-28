# YiZhan Relay ASIC

X Layer TapeOut hackathon entry. 驿站联锁台。

This processor does not mine official $BEM.
Transistors are tape-out materials only.
对照灯，不对照币价。

请求字决定模型进路：慢车免票，风险否决一切，拥塞只把非慢车压进侧线。页面上的灯、股道和网表都调用 `evalRelay`，不另写一套答案。

## On-chain

流片完成后只改 `src/config.ts`。

| 字段 | 现在 |
| --- | --- |
| Chain | X Layer · 196 |
| Name / symbol | Yuan Station · YZST |
| Processor（电路合约，详情页蓝地址） | `0x7F2D3131A76D9aEfb49F44657DA6e1AcAC334687` |
| Transistors | `0xd32eDFD4385653e906c414BaB8B59483C752f362` |
| Deploy wallet | `0x0A9102cbaADEc6C2593Fb86f271A0431281e3E12` |
| Create tx | `0x2b9ec5d182eb6a443f01fb991d16b4d2de4eccaa66bb5c71bd8caed4759bfe69` |
| Supply / mint price | 32768 · 0.0001 OKB |
| Relay circuit id | `PENDING` |
| Tape-out tx | `0xPENDING` |

Processor 是工厂 `CPUCreated` 事件里的 circuits 合约，不是部署钱包。创建交易已在 X Layer 主网成功。电路数仍是 0，还不能算完成黑客松资格。详情页：https://tapeout.net/#l2/xlayer/0x7F2D3131A76D9aEfb49F44657DA6e1AcAC334687

## Boolean

```text
pass     = paid ∨ (model = 0) ∨ ticket_ok
allow    = ¬risk ∧ pass
degrade  = allow ∧ burst ∧ (model ≠ 0)
refuse   = ¬allow
tier_hi  = allow ∧ ¬degrade ∧ (model = 2)
action   = degraded if allow ∧ degrade
           else lite | std | frontier by model
           else refuse
ticket   = ok ∧ mobile
```

`tier_hi` 只在特快、放行、且没有被拥塞降级时点亮。降级后的动作是 `degraded`，不再叫 frontier。

## Relay truth table

来源：`src/circuit/relay.ts` 的 `RELAY_TRUTH_CASES`。测试锁在 `src/circuit/relay.test.ts`。

| model | paid | burst | risk | ticket | allow | degrade | refuse | tier_hi | action | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | lite | 空车慢车 |
| 2 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | refuse | 空车特快 |
| 2 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | frontier | 付费特快 |
| 2 | 1 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | degraded | 拥塞降级 |
| 2 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | refuse | 风险锁闭 |
| 2 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | frontier | 资格票打开特快 |

48 个请求字（3 档 × 4 个开关）由 `enumerateRelay()` 在页面上现算。

## 资格证明

`src/pow/mobileProof.ts` 在本机寻找 `SHA-256("yizhan:" + nonce)` 以 `000` 开头的 nonce。15 秒内找到，`evalTicket({ ok, mobile: true })` 才有效，并拨上 `ticket_ok`。

这不是挖矿。没有奖励，不出块，不能挖官方 $BEM。

## Run demo

打开联锁台（`/` 或 `/asic`）。右上角切换 **中文 / EN**，电路名词（allow、lite、frontier）两种语言都保留。

1. 台上默认是「空车特快」，refuse 灯亮。
2. 拨到慢车，或打开已付费，灯会换成放行。
3. 付费特快再打开突发，动作变成侧线，`tier_hi` 熄灭。
4. 打开风险，无论付费与否都锁闭。
5. 「按规格走一遍」会依次点亮上面六行。
6. 「跑本机资格证明」通过后自动拨上资格票。
7. 「连接钱包」请求 OKX Wallet 或 MetaMask，并切到 X Layer（196）。预览框里插件进不来时，用「在新标签打开」。灯仍由本机 `evalRelay` 点亮。

流片网表必须对同一组请求字点亮同一组灯。

## Not in this repo

- 不挖 $BEM，不发收益，不刷量。
- 不在地址未填时假装读到了链上 eval。
