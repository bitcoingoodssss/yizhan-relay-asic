import type { NarrationId } from "../circuit/narrate.ts";
import type { ModelTier, RelayOutput } from "../circuit/types.ts";

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
    title: "驿站联锁台",
    lead: "不是矿机。请求字进来，路由字出去。慢车免票，风险否决一切，拥塞只把高档压进侧线。晶体管只用于流片。",
    langSwitch: "语言",
    request: "请求字",
    route: "路由字",
    tracks: "股道",
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
    chainPending: "处理器、电路号或流片交易还是占位。软件真值表就是规格。这里不会编造链上的灯。",
    chainTodo: "地址已写入。读链上 eval 仍是 TODO，在接上真实调用之前不显示假灯。",
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
    models: { 0: "慢车", 1: "正线", 2: "特快" },
    actions: {
      lite: "慢车放行",
      std: "正线放行",
      frontier: "特快放行",
      degraded: "侧线降级",
      refuse: "进路锁闭",
    },
    cases: {
      "unpaid lite -> allow lite": "空车慢车",
      "unpaid frontier -> refuse": "空车特快",
      "paid frontier -> allow": "付费特快",
      "burst -> degrade": "拥塞降级",
      "risk -> refuse": "风险锁闭",
      "ticket unlocks frontier": "资格票特快",
    },
    levers: {
      paid: { label: "已付费", detail: "高档票。慢车不看这一位。" },
      burst: { label: "突发拥塞", detail: "只把非慢车压进侧线。" },
      risk: { label: "风险", detail: "一票否决，付费和资格票都无效。" },
      ticketOk: { label: "资格票", detail: "可手拨。本机证明通过会自动拨上。" },
    },
    lamps: { allow: "放行", degrade: "降级", refuse: "锁闭", tierHi: "高档" },
    trackNames: { lite: "慢车", std: "正线", frontier: "特快", degraded: "侧线", refuse: "锁闭" },
    trackNotes: {
      lite: "免票。拥塞也不降级。",
      std: "付费或资格票，且没有拥塞。",
      frontier: "付费或资格票，且没有拥塞。点亮 tier_hi。",
      degraded: "高档请求被突发压下来。不再叫 frontier。",
      refuse: "风险，或高档既没付钱也没票。",
    },
    narration: {
      riskLite: "慢车本来免票，但风险位为高，进路仍然锁闭。",
      risk: "风险位为高，整条进路锁闭。付费和资格票都越不过这一闸。",
      unpaidFrontier: "特快未付费，资格票也无效。空车只能走慢车。",
      unpaidStd: "正线未付费，资格票也无效。空车只能走慢车。",
      degradeFrontier: "特快被放行，但突发拥塞把它压进侧线。名字不再是 frontier，tier_hi 熄灭。",
      degradeStd: "正线被放行，但突发拥塞把它压进侧线。慢车不会被这样降级。",
      liteBurst: "慢车免票，拥塞也不降级。突发位亮着，侧线灯保持熄灭。",
      lite: "慢车免票直行。不看付费，也不点亮 tier_hi。",
      stdTicket: "没有付钱，资格票把正线打开了。",
      std: "已付费正线，无拥塞，直行。",
      frontierTicket: "没有付钱，资格票把特快打开了。tier_hi 点亮。",
      frontier: "已付费特快，无风险，无拥塞。tier_hi 点亮。",
      computed: "进路已计算。",
    },
  },
  en: {
    title: "YiZhan Desk",
    lead: "Not a miner. A request word in, a route word out. The slow train is free, risk vetoes everything, and congestion only pushes higher tiers onto the siding. Transistors are for tape-out.",
    langSwitch: "Language",
    request: "Request",
    route: "Route",
    tracks: "Tracks",
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
    chainPending: "Processor, circuit id, or tape-out tx is still a placeholder. The software truth table is the spec. No invented on-chain lamps.",
    chainTodo: "Addresses are filled in. Reading on-chain eval is still TODO. No fake lamps until a real call exists.",
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
    models: { 0: "Slow", 1: "Main", 2: "Express" },
    actions: {
      lite: "Slow clear",
      std: "Main clear",
      frontier: "Express clear",
      degraded: "Siding",
      refuse: "Locked",
    },
    cases: {
      "unpaid lite -> allow lite": "Empty slow",
      "unpaid frontier -> refuse": "Empty express",
      "paid frontier -> allow": "Paid express",
      "burst -> degrade": "Burst siding",
      "risk -> refuse": "Risk lock",
      "ticket unlocks frontier": "Ticket express",
    },
    levers: {
      paid: { label: "Paid", detail: "Fare for a higher tier. The slow train ignores this." },
      burst: { label: "Burst", detail: "Pushes non-slow trains onto the siding." },
      risk: { label: "Risk", detail: "Veto. Payment and a ticket cannot override it." },
      ticketOk: { label: "Ticket", detail: "You can throw it by hand. A passing proof throws it for you." },
    },
    lamps: { allow: "clear", degrade: "degrade", refuse: "lock", tierHi: "high tier" },
    trackNames: { lite: "Slow", std: "Main", frontier: "Express", degraded: "Siding", refuse: "Locked" },
    trackNotes: {
      lite: "Free. Congestion does not degrade it.",
      std: "Paid or ticket, and no congestion.",
      frontier: "Paid or ticket, and no congestion. Lights tier_hi.",
      degraded: "A higher tier squeezed by a burst. No longer frontier.",
      refuse: "Risk, or a higher tier with neither fare nor ticket.",
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
