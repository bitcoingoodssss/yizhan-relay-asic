import type { NarrationId } from "../circuit/narrate.ts";
import type { ModelTier, RelayOutput } from "../circuit/types.ts";
import type { RoadScene } from "../vehicle/map.ts";

export type Locale = "zh" | "en";

export const CASE_NOTES = [
  "unpaid lite -> allow lite",
  "unpaid frontier -> refuse",
  "paid frontier -> allow",
  "burst -> degrade",
  "risk -> refuse",
  "ticket unlocks frontier",
] as const;

export type CaseNote = (typeof CASE_NOTES)[number];

type Action = RelayOutput["action"];
type LeverKey = "paid" | "burst" | "risk" | "ticketOk";
type LampKey = "allow" | "degrade" | "refuse" | "tierHi";

export interface Copy {
  title: string;
  lead: string;
  vehicle: {
    kicker: string;
    hand: string;
    road: string;
    car: string;
    play: string;
    playing: string;
    armed: string;
    denied: string;
    handNote: string;
    speed: string;
    rule: string;
    scenes: Record<RoadScene, string>;
  };
  langSwitch: string;
  request: string;
  route: string;
  tracks: string;
  netlist: string;
  truth: string;
  ticket: string;
  plaque: string;
  modelGroup: string;
  hi: string;
  lo: string;
  walk: string;
  walkPlay: string;
  stop: string;
  netlistLead: string;
  priority: string;
  priorityLines: [string, string, string];
  truthLead: string;
  showAll: string;
  hideAll: string;
  ticketLead: string;
  proofStart: string;
  proofRunning: string;
  proofOk: string;
  proofFail: string;
  processorNote: string;
  deployerNote: string;
  chainPending: string;
  chainTodo: string;
  tapeout: string;
  gateTitle: string;
  gateScene: string;
  gateDemo: string;
  gateProcessor: string;
  gateTape: string;
  pricePending: string;
  motto: string;
  disclaimer: string;
  connect: string;
  connecting: string;
  disconnect: string;
  switchChain: string;
  wrongChain: string;
  noWallet: string;
  frameHint: string;
  openTab: string;
  rejected: string;
  walletFailed: string;
  walletFact: string;
  walletFactNote: string;
  themeSwitch: string;
  day: string;
  night: string;
  sound: string;
  okx: string;
  foundry: string;
  foundryLead: string;
  stock: string;
  mintedLabel: string;
  priceLabel: string;
  feeLabel: string;
  payLabel: string;
  readFail: string;
  mint: string;
  minting: string;
  mintWait: string;
  mintOk: string;
  mintFail: string;
  mintRejected: string;
  run: string;
  running: string;
  runNeed: string;
  tapeRelay: string;
  tapeRelayLead: string;
  tapeRelayMint: string;
  tapeRelayWait: string;
  tapeRelayOk: string;
  tapeRelayFee: string;
  horns: Record<Action, string>;
  models: Record<ModelTier, string>;
  actions: Record<Action, string>;
  cases: Record<CaseNote, string>;
  levers: Record<LeverKey, { label: string; detail: string }>;
  lamps: Record<LampKey, string>;
  trackNames: Record<Action, string>;
  trackNotes: Record<Action, string>;
  narration: Record<NarrationId, string>;
}

export const COPY: Record<Locale, Copy> = {
  zh: {
    title: "元站车载联锁",
    lead: "人工智能汽车的请求先过这道联锁。本地辅助免订阅，危险工况锁死，路况拥塞只把高档请求降级。不是挖矿。",
    vehicle: {
      kicker: "车端",
      hand: "手拨",
      road: "路测",
      car: "本机",
      play: "播放这段路",
      playing: "路测进行中",
      armed: "手机就是车端。摇晃超过急刹，危险位锁闭两秒。车速来自定位，没有定位就不编拥塞。",
      denied: "这台设备没有开放运动传感器。路测回放照样能走完。",
      handNote: "手拨只用于对真值表。车上由车速、加速度和请求档生成同一份请求字。",
      speed: "车速",
      rule: "智驾请求低于 50 km/h 记为拥塞，只降级。加速度超过 6 m/s² 或横摆过猛，整车锁闭。联锁不碰方向盘。",
      scenes: { park: "起步", city: "城市", highway: "高速", jam: "拥塞", hazard: "急刹", recover: "接管" },
    },
    langSwitch: "语言",
    request: "车端请求",
    route: "放行灯",
    tracks: "车道",
    netlist: "网表",
    truth: "真值表",
    ticket: "资格票",
    plaque: "链上铭牌",
    modelGroup: "车次档",
    hi: "高",
    lo: "低",
    walk: "规格走查",
    walkPlay: "按规格走一遍",
    stop: "停止",
    netlistLead: "下面每一盏都由 evalRelay 点亮。图和函数必须是同一张布尔。",
    priority: "action 优先级",
    priorityLines: ["1. allow 且 degrade → degraded", "2. 否则按档位 lite / std / frontier", "3. 否则 refuse"],
    truthLead: "点一行，联锁台跟着拨。48 态在页面上现算，不另写一套答案。",
    showAll: "展开 48 态",
    hideAll: "收起 48 态",
    ticketLead: "找 SHA-256(yizhan:nonce) 以 000 开头的 nonce。15 秒内找到，票才有效。没有奖励，不出块，不挖官方 $BEM。",
    proofStart: "跑本机资格证明",
    proofRunning: "正在证明…",
    proofOk: "资格票有效，ticket_ok 已拨上。",
    proofFail: "证明未在时限内完成，资格票无效。",
    processorNote: "必须是工厂创建的处理器合约，不是钱包。",
    deployerNote: "部署钱包。不能填进 processor。",
    chainPending: "处理器已经在 X Layer。电路还没流片，所以这里不读链上的灯，也不编造结果。",
    chainTodo: "联锁 3.2.250 已在 X Layer：27 门，6 入 4 出。台上的灯仍用本机 evalRelay，不把链上缓冲位画成放行灯。",
    tapeout: "打开 Yuan Station",
    gateTitle: "车载联锁已经流片",
    gateScene: "场景：人工智能汽车的模型请求",
    gateDemo: "演示：拨开关，灯由 evalRelay 点亮",
    gateProcessor: "Processor 已在 X Layer 主网",
    gateTape: "3.2.250 是这张 27 门联锁。1.2.250 是示例加法，2.2.250 是与非门。",
    pricePending: "流片后填写",
    motto: "对照灯，不对照币价。",
    disclaimer: "黑客松原型。不是投资建议。这颗 X Layer 处理器不能挖官方 $BEM。",
    connect: "连接钱包",
    connecting: "连接中…",
    disconnect: "断开",
    switchChain: "切到 X Layer",
    wrongChain: "不在 X Layer",
    noWallet: "没检测到钱包。请安装 OKX Wallet 或 MetaMask，再打开这个页面。",
    frameHint: "预览框拦着钱包插件。在新标签打开后，再点连接。",
    openTab: "在新标签打开",
    rejected: "已取消连接。",
    walletFailed: "钱包没有完成切换或读余额。再试一次。",
    walletFact: "本机钱包",
    walletFactNote: "连上后是你的 X Layer 地址。灯仍由本机 evalRelay 点亮，不会编造链上结果。",
    themeSwitch: "外观",
    day: "白天",
    night: "夜片",
    sound: "声音",
    okx: "X Layer · OKX 链 · Gas 为 OKB",
    foundry: "晶圆",
    foundryLead: "铸造进入 Yuan Station 的晶体管合约。单价、协议费和持有量从 X Layer 读出。签名时钱包里的金额必须等于本次合计。",
    stock: "链上 NAND",
    mintedLabel: "已铸造",
    priceLabel: "单价",
    feeLabel: "协议费",
    payLabel: "本次支付",
    readFail: "没读到链上库存。不发送猜测金额。",
    mint: "铸造 1 枚 NAND",
    minting: "等钱包确认…",
    mintWait: "等 X Layer 回执…",
    mintOk: "NAND 已铸到当前地址。",
    mintFail: "交易失败，没有入账。",
    mintRejected: "你取消了支付。",
    run: "按车道走一遍",
    running: "正在走车道",
    runNeed: "链上 NAND 为 0。先铸造，才能按车道演示。动画不消耗晶体管。",
    tapeRelay: "按修正引脚再流一次",
    tapeRelayLead: "3.2.250 已经上链。这一键只在要修正四个输出引脚时再用，会再付铸造和 0.0013 OKB 流片费。",
    tapeRelayMint: "先铸造缺少的 NAND…",
    tapeRelayWait: "流片交易已发出…",
    tapeRelayOk: "联锁已上链",
    tapeRelayFee: "链上的流片费和 0.0013 OKB 不一致，没有发送。",
    horns: {
      lite: "辅助低鸣",
      std: "巡航双鸣",
      frontier: "高速尖笛",
      degraded: "降级短鸣",
      refuse: "制动放气",
    },
    models: { 0: "本地辅助", 1: "城市巡航", 2: "高速智驾" },
    actions: {
      lite: "辅助放行",
      std: "巡航放行",
      frontier: "智驾放行",
      degraded: "降级接管",
      refuse: "安全锁闭",
    },
    cases: {
      "unpaid lite -> allow lite": "无订阅辅助",
      "unpaid frontier -> refuse": "无订阅智驾",
      "paid frontier -> allow": "已订阅智驾",
      "burst -> degrade": "拥塞降级",
      "risk -> refuse": "危险锁闭",
      "ticket unlocks frontier": "资格票智驾",
    },
    levers: {
      paid: { label: "已订阅", detail: "高档请求要这一位。本地辅助不看。" },
      burst: { label: "路况拥塞", detail: "只把巡航和智驾降级。" },
      risk: { label: "危险工况", detail: "一票否决。订阅和资格票都无效。" },
      ticketOk: { label: "驾驶员资格", detail: "可手拨。本机证明通过会自动拨上。" },
    },
    lamps: { allow: "放行", degrade: "降级", refuse: "锁闭", tierHi: "智驾" },
    trackNames: { lite: "辅助", std: "巡航", frontier: "智驾", degraded: "降级", refuse: "锁闭" },
    trackNotes: {
      lite: "免订阅。拥塞也不降级。",
      std: "已订阅或有资格，且路况正常。",
      frontier: "已订阅或有资格，且路况正常。点亮智驾灯。",
      degraded: "高档请求被拥塞压成接管。不再叫智驾。",
      refuse: "危险工况，或高档既没订阅也没资格。",
    },
    narration: {
      riskLite: "本地辅助本来免费，但危险工况为高，请求仍然锁闭。",
      risk: "危险工况为高，整车请求锁闭。订阅和资格票都越不过这一闸。",
      unpaidFrontier: "高速智驾未订阅，资格也无效。空请求只能走本地辅助。",
      unpaidStd: "城市巡航未订阅，资格也无效。空请求只能走本地辅助。",
      degradeFrontier: "智驾被放行，但路况拥塞把它降成接管。名字不再是智驾，智驾灯熄灭。",
      degradeStd: "巡航被放行，但路况拥塞把它降成接管。本地辅助不会这样降级。",
      liteBurst: "本地辅助免订阅，拥塞也不降级。拥塞位亮着，降级灯保持熄灭。",
      lite: "本地辅助直行。不看订阅，也不点亮智驾灯。",
      stdTicket: "没有订阅，驾驶员资格把巡航打开了。",
      std: "已订阅巡航，路况正常，直行。",
      frontierTicket: "没有订阅，驾驶员资格把智驾打开了。智驾灯点亮。",
      frontier: "已订阅智驾，无危险，无拥塞。智驾灯点亮。",
      computed: "请求已计算。",
    },
  },
  en: {
    title: "Yuan Station",
    lead: "An AI car's model request passes this interlock first. Local assist is free. A hazard locks everything. Congestion only degrades the higher tiers. Not a miner.",
    vehicle: {
      kicker: "VEHICLE",
      hand: "Manual",
      road: "Road test",
      car: "This device",
      play: "Play this road",
      playing: "Road test running",
      armed: "This phone is the car. A shake harder than a panic stop locks risk for two seconds. Speed comes from location. No fix, no invented jam.",
      denied: "Motion sensors are blocked on this device. The recorded road still runs.",
      handNote: "Manual levers check the truth table. In a car, speed, acceleration, and the requested tier build the same word.",
      speed: "Speed",
      rule: "A highway request under 50 km/h is congestion and only degrades. Acceleration past 6 m/s², or a hard yaw, locks the car. The interlock never steers.",
      scenes: { park: "Park", city: "City", highway: "Highway", jam: "Jam", hazard: "Brake", recover: "Assist" },
    },
    langSwitch: "Language",
    request: "Vehicle request",
    route: "Clearance",
    tracks: "Lanes",
    netlist: "Netlist",
    truth: "Truth table",
    ticket: "Ticket",
    plaque: "Tape-out plate",
    modelGroup: "Model tier",
    hi: "HI",
    lo: "LO",
    walk: "Spec pass",
    walkPlay: "Step the spec",
    stop: "Stop",
    netlistLead: "Every lamp is lit by evalRelay. The drawing and the function are the same boolean.",
    priority: "action priority",
    priorityLines: ["1. allow and degrade → degraded", "2. else lite / std / frontier by model", "3. else refuse"],
    truthLead: "Tap a row and the desk follows. All 48 words are evaluated here. There is no second answer key.",
    showAll: "Show all 48",
    hideAll: "Hide all 48",
    ticketLead: "Find a nonce where SHA-256(yizhan:nonce) starts with 000. The ticket is valid only if that happens within 15 seconds. No reward, no block, and it cannot mine official $BEM.",
    proofStart: "Run this device's proof",
    proofRunning: "Proving…",
    proofOk: "Ticket valid. ticket_ok is on.",
    proofFail: "Proof missed the time box. Ticket invalid.",
    processorNote: "Must be the factory-created processor contract, not a wallet.",
    deployerNote: "Deploy wallet. Do not put this in processor.",
    chainPending: "The processor is on X Layer. No circuit is taped out yet, so this page does not read or invent on-chain lamps.",
    chainTodo: "Relay 3.2.250 is on X Layer: 27 gates, 6 inputs, 4 outputs. Desk lamps still use local evalRelay. Buffer bits are not drawn as clearance lamps.",
    tapeout: "Open Yuan Station",
    gateTitle: "The vehicle relay is taped out",
    gateScene: "Scenario: an AI car's model request",
    gateDemo: "Demo: levers light evalRelay",
    gateProcessor: "Processor is on X Layer mainnet",
    gateTape: "3.2.250 is this 27-gate relay. 1.2.250 is the sample adder. 2.2.250 is a NAND.",
    pricePending: "Set after tape-out",
    motto: "Check the lamps, not the price.",
    disclaimer: "Hackathon prototype. Not investment advice. This X Layer processor cannot mine official $BEM.",
    connect: "Connect wallet",
    connecting: "Connecting…",
    disconnect: "Disconnect",
    switchChain: "Switch to X Layer",
    wrongChain: "Not on X Layer",
    noWallet: "No wallet found. Install OKX Wallet or MetaMask, then open this page.",
    frameHint: "The preview frame blocks wallet extensions. Open a new tab, then connect.",
    openTab: "Open in a new tab",
    rejected: "Connection cancelled.",
    walletFailed: "The wallet did not finish the switch or the balance read. Try again.",
    walletFact: "This wallet",
    walletFactNote: "Your X Layer address after connect. Lamps still come from local evalRelay. No invented chain result.",
    themeSwitch: "Appearance",
    day: "Day",
    night: "Night",
    sound: "Sound",
    okx: "X Layer · OKX chain · gas in OKB",
    foundry: "Wafer",
    foundryLead: "Minting calls the Yuan Station transistor contract. Unit price, protocol fee, and balances are read from X Layer. The wallet amount must match this total.",
    stock: "On-chain NAND",
    mintedLabel: "Minted",
    priceLabel: "Unit price",
    feeLabel: "Protocol fee",
    payLabel: "This payment",
    readFail: "Chain balances did not load. No guessed amount is sent.",
    mint: "Mint 1 NAND",
    minting: "Waiting for the wallet…",
    mintWait: "Waiting for the X Layer receipt…",
    mintOk: "NAND minted to the connected address.",
    mintFail: "The transaction failed. Nothing was credited.",
    mintRejected: "Payment cancelled.",
    run: "Drive the lanes",
    running: "Driving",
    runNeed: "On-chain NAND is 0. Mint one before the lane demo. The animation does not spend a transistor.",
    tapeRelay: "Tape out corrected pins",
    tapeRelayLead: "3.2.250 is already on-chain. Use this only to retape the four output pins. It charges another mint and the 0.0013 OKB fee.",
    tapeRelayMint: "Minting the missing NAND…",
    tapeRelayWait: "Tape-out sent…",
    tapeRelayOk: "Relay is on-chain",
    tapeRelayFee: "The on-chain tape-out fee is not 0.0013 OKB. Nothing was sent.",
    horns: {
      lite: "freight horn",
      std: "passenger horn",
      frontier: "express horn",
      degraded: "shunter toot",
      refuse: "brake air",
    },
    models: { 0: "Assist", 1: "Cruise", 2: "Highway" },
    actions: {
      lite: "Assist clear",
      std: "Cruise clear",
      frontier: "Highway clear",
      degraded: "Fallback",
      refuse: "Safety lock",
    },
    cases: {
      "unpaid lite -> allow lite": "Unsubscribed assist",
      "unpaid frontier -> refuse": "Unsubscribed highway",
      "paid frontier -> allow": "Subscribed highway",
      "burst -> degrade": "Congestion fallback",
      "risk -> refuse": "Hazard lock",
      "ticket unlocks frontier": "Qualified highway",
    },
    levers: {
      paid: { label: "Subscribed", detail: "Required for cruise and highway. Assist ignores it." },
      burst: { label: "Congestion", detail: "Degrades cruise and highway only." },
      risk: { label: "Hazard", detail: "Veto. A subscription or ticket cannot override it." },
      ticketOk: { label: "Driver ticket", detail: "Throw it by hand, or let a passing proof throw it." },
    },
    lamps: { allow: "clear", degrade: "fallback", refuse: "lock", tierHi: "highway" },
    trackNames: { lite: "Assist", std: "Cruise", frontier: "Highway", degraded: "Fallback", refuse: "Locked" },
    trackNotes: {
      lite: "Free. Congestion does not degrade it.",
      std: "Subscribed or ticketed, and the road is clear.",
      frontier: "Subscribed or ticketed, and the road is clear. Lights the highway lamp.",
      degraded: "A higher tier pulled down by congestion. No longer highway.",
      refuse: "Hazard, or a higher tier with neither subscription nor ticket.",
    },
    narration: {
      riskLite: "The slow train is normally free, but risk is high, so the route stays locked.",
      risk: "Risk is high. The whole route is locked. Payment and a ticket cannot override that gate.",
      unpaidFrontier: "Express is unpaid and the ticket is invalid. An empty request can only take the slow train.",
      unpaidStd: "The main line is unpaid and the ticket is invalid. An empty request can only take the slow train.",
      degradeFrontier: "Express is allowed, but a burst pushes it onto the siding. The name is no longer frontier, and tier_hi stays dark.",
      degradeStd: "The main line is allowed, but a burst pushes it onto the siding. The slow train is never degraded this way.",
      liteBurst: "The slow train is free and is not degraded by congestion. Burst is high, but the siding lamp stays dark.",
      lite: "Slow train runs free. Payment is ignored, and tier_hi stays dark.",
      stdTicket: "No payment. The ticket opened the main line.",
      std: "Paid main line, no congestion. Straight through.",
      frontierTicket: "No payment. The ticket opened express. tier_hi is lit.",
      frontier: "Paid express, no risk, no congestion. tier_hi is lit.",
      computed: "Route computed.",
    },
  },
};
