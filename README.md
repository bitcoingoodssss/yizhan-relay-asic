# 元站车载联锁 · Yuan Station

X Layer 上的人工智能汽车请求联锁。处理器不挖官方 $BEM，晶体管只用于流片。

## 链上

- 链：X Layer，196
- 处理器：`0x7F2D3131A76D9aEfb49F44657DA6e1AcAC334687`
- 晶体管：`0xd32eDFD4385653e906c414BaB8B59483C752f362`
- 创建者：`0x0A9102cbaADEc6C2593Fb86f271A0431281e3E12`
- 联锁电路：`3.2.250`（6 入 / 4 出 / 27 NAND）
- 流片交易：`0x7229d125d85f7edd1cd83f712fb9a9e27b06d0f0bef92aac55205244749faf5e`

`evalRelay` 在 `src/circuit/relay.ts`。车速和急刹由 `src/vehicle/map.ts` 收成同一份请求字。联锁不控制方向盘。

## 本地

```bash
npm install
npm run dev
```

## DeWeb

`deweb-dist/` 是静态站，根上有 `index.html`。上传这个文件夹或它的 zip。单个文件都小于 8.4 MB。网关没有 Node 服务器，所以不要传仓库源码。
