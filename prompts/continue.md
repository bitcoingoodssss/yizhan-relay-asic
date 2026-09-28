你在实现 YiZhan Relay ASIC 黑客松 Demo。联锁台页面已经在跑。

硬约束：
1. 不要实现 $BEM 挖矿、不要发收益币、不要刷量。
2. evalRelay 逻辑不得改，除非同步改 README 真值表和 src/circuit/relay.test.ts 的黄金结果。
3. config 里 processor 必须是工厂创建的合约，不是钱包。
4. `/` 和 `/asic` 是同一张联锁台。手机能拨开关看到 allow / degrade / refuse。
5. 链上电路 eval：地址未知就保持 chainEvalReady 的未配置状态，不要假造返回值。地址写进 src/config.ts 之后，可以接 viem，仍要对着同一张真值表。
6. 资格证明只是本机 SHA-256 前缀，15 秒内完成才算票。不要把它做成矿机。

下一步只做这些：
- 在 tapeout.net 按同一张布尔流片，把 processor / circuit id / tx 填进 src/config.ts。
- 有真实地址后再读 X Layer chainId 196 的 eval。
