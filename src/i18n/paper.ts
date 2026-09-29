import type { Locale } from "./copy";

export interface PaperTable {
  headers: [string, string];
  rows: [string, string][];
}

export interface PaperSection {
  heading: string;
  paragraphs?: string[];
  table?: PaperTable;
  formula?: string[];
}

export interface PaperDoc {
  desk: string;
  paper: string;
  kicker: string;
  title: string;
  date: string;
  lede: string;
  sections: PaperSection[];
}

const ZH: PaperDoc = {
  desk: "联锁",
  paper: "白皮书",
  kicker: "YUAN STATION · X LAYER",
  title: "元站车载联锁",
  date: "2026年9月29日",
  lede: "元站是一台建在 X Layer 上的请求联锁。它不训练模型，不控制方向盘、油门或刹车，也不挖官方 $BEM。它只回答一件事：人工智能汽车此刻申请的这一档能力，允不允许交给执行器。",
  sections: [
    {
      heading: "要解决的问题",
      paragraphs: [
        "人工智能汽车的危险，常常不是模型不够大，而是模型可以自己要求更高的权限。高速智驾在堵车、急刹、方向盘猛打，或者驾驶者没有资格时，不该继续生效。",
        "现在常见的做法是把这层判断写进模型提示词、云端策略或闭源车机软件。旁人无法核对。同一组输入，换一次软件版本，灯就可能变了。",
        "元站把判断从模型里拿出来，收成一张固定的布尔电路。五个输入永远对应四盏灯。车厂、审计、车上软件和链上 eval 用的是同一张表。",
      ],
    },
    {
      heading: "从 TapeOut 借来的路径",
      paragraphs: [
        "TapeOut 把计算还原成 NAND。任何数字逻辑都可以只用这一种门搭出来。处理器发行晶体管，电路把晶体管消耗掉，流片之后网表公开，任何人可以调用 eval 得到同一结果。电路还可以升级成容器，用来存放网站。",
        "我们沿用的是这套生产方法，不是它的某一枚现成电路。Genesis CPU 的 11347.0.tape 只负责放网页，不能代替元站的联锁，也不能挖官方 $BEM。",
      ],
      table: {
        headers: ["借来的", "我们怎么用"],
        rows: [
          ["NAND 作为唯一门", "联锁先写成布尔式，再收成 NAND 网表"],
          ["处理器与晶体管", "在 X Layer 上创建自己的处理器，而不是只去别人的处理器上占一个编号"],
          ["流片后公开 eval", "3.2.250 上链后，灯的结果可以对照，不允许另写一套答案"],
          ["电路容器与 DeWeb", "用 Genesis CPU #11347 把演示台放到 BNB 上，不必再租服务器"],
        ],
      },
    },
    {
      heading: "创新从哪一步开始",
      paragraphs: [
        "借用停止在「会流片」。创新从这个问题开始：流片的对象不是示例加法器，而是人工智能汽车的放行字。",
        "1.2.250 是加法器，2.2.250 是一枚 NAND，只证明工厂能工作。产品是 3.2.250：6 个输入，4 个输出，27 个 NAND。多出来的门是输出缓冲，逻辑本身是联锁。",
        "选择 X Layer，是因为晶体管以 OKB 计价，钱包优先接 OKX Wallet，链号 196。网页所在的 BNB Chain 是另一条链，另一件工作。",
      ],
    },
    {
      heading: "X Layer 上的技术路径",
      paragraphs: [
        "第一步，创建处理器。元站不是钱包地址，而是工厂创建的电路合约。代号 YZST，供应上限 32768，单价 0.0001 OKB，另加协议费。铸造得到的是 NAND 或 LATCH，是流片材料，不是车企股权。",
        "第二步，把策略写成不可改口的布尔式。代码、电路和台上的灯是同一张表。",
        "第三步，把连续的车况收成这五个位。这一步在车上或手机上完成，不进电路。加速度达到 6 m/s²，或偏航角速度达到 0.8 rad/s，记为危险。高速智驾低于 50 km/h 记为拥塞，城市巡航的低速线是 15 km/h。危险优先于拥塞。",
        "第四步，流片得到 3.2.250。任何人可以用同一组输入调用 eval。台上的灯由同一函数在本地点亮，用来和链上结果对照。",
        "第五步，路测走完停车、城市、高速、拥堵、急刹、恢复。资格证明是本机在时限内寻找一个哈希前缀。没有奖励，不出块。",
      ],
      formula: [
        "allow   = 非危险 且（已付费 或 本地辅助 或 资格通过）",
        "degrade = 放行 且 拥塞 且 不是本地辅助",
        "refuse  = 不放行",
        "tierHi  = 放行 且 不降级 且 申请的是高速智驾",
      ],
    },
    {
      heading: "功能以及它解决什么",
      table: {
        headers: ["功能", "解决什么"],
        rows: [
          ["车端请求字", "把档位、付费、拥塞、危险、资格收成五个位。模型不能再自带一套解释"],
          ["放行灯", "allow、degrade、refuse、tier_hi 决定辅助、巡航、智驾、降级或锁闭"],
          ["拥塞规则", "高速请求在 50 km/h 以下只降级。城市巡航的低速线是 15 km/h"],
          ["危险锁", "急刹或猛打方向超过阈值时，付费和资格都无效，直接拒绝"],
          ["资格证明", "没有订阅时，本机算出凭证才能申请更高档。这不是挖矿"],
          ["路测回放", "同一段路反复得到同一组灯，便于审计"],
          ["真值表", "全部请求组合当场计算，没有第二套答案"],
          ["X Layer 3.2.250", "这张表已经流成公开电路，链上 eval 可被任何人调用"],
          ["晶体管", "给后续改版提供 NAND 和 LATCH，对应一次真实流片"],
          ["DeWeb 11347.0.tape", "演示台不必再租服务器。容器归电路持有人"],
        ],
      },
    },
    {
      heading: "五档动作",
      table: {
        headers: ["动作", "含义"],
        rows: [
          ["lite", "本地辅助。未付费、无资格也可以用"],
          ["std", "城市巡航。需要付费或资格，且没有危险和拥塞降级"],
          ["frontier", "高速智驾。需要付费或资格，并且 tier_hi 亮起"],
          ["degraded", "已放行，但路况不配当前档，只给降级后的能力"],
          ["refuse", "不交给执行器"],
        ],
      },
    },
    {
      heading: "在人工智能里的位置",
      paragraphs: [
        "元站没有提出新的驾驶模型，也没有贡献训练集。它的贡献在模型和控制之间，补了一层又小又硬的接口。",
        "可分离。模型可以更换，联锁不换。可拒绝。模型的输出只是申请，不是批准。可降级。拥塞时不是直接熄火，而是收回高档。可核对。请求组合都能事先算完，链上电路和本地函数必须点亮同一组灯。",
        "贡献不是更聪明的车，而是给智能车一个公开的权限边界。模型负责提议，联锁负责批准，执行器只听批准。",
        "这仍然是原型。它没有经过 ISO 26262，没有接入量产车的 CAN 或线控，也不能替代制动系统。",
      ],
    },
    {
      heading: "使用者得到什么",
      paragraphs: [
        "打开网站的人得到一台可以拨动、可以回放、可以对着真值表看的联锁，不是收益。",
        "开发者得到一份可以接车机的契约。车端只要送出五个位，并答应执行器不听从模型的原始请求。",
        "铸造晶体管的人得到流片材料。货款按创建处理器时写死的规则进入创建者账户。这不是分红，不是持有网站就产生的利息，也不是官方 $BEM。",
        "谁持有 11347 这枚电路，谁就能更新 DeWeb 上的页面。卖掉电路，网站的管理权跟着走。",
      ],
    },
    {
      heading: "链上记录",
      table: {
        headers: ["项", "值"],
        rows: [
          ["联锁所在链", "X Layer，链号 196"],
          ["处理器", "0x7F2D3131A76D9aEfb49F44657DA6e1AcAC334687"],
          ["晶体管", "0xd32eDFD4385653e906c414BaB8B59483C752f362"],
          ["联锁电路", "3.2.250，6 入 / 4 出 / 27 NAND"],
          ["网页容器", "BNB Chain，11347.0.tape"],
          ["网页入口", "11347-0.tapekit.org"],
        ],
      },
    },
    {
      heading: "现在还不是什么",
      paragraphs: [
        "元站不是量产自动驾驶，不是投资产品，不是矿机。晶体管不是股票。DeWeb 上的页面不是车端控制器。",
        "装进真实车辆只有一个条件：车机继续送这五个位，执行器只执行放行结果，并且用实车数据重新标定阈值。改规则必须连电路和真值表一起改，不允许只改网页上的灯。",
      ],
    },
    {
      heading: "结论",
      paragraphs: [
        "TapeOut 提供了把逻辑做成公开电路的路。元站沿着这条路，在 X Layer 上把人工智能汽车的档位申请，收成一张谁也不能私下改口的联锁。",
        "使用者得到的是可核对的放行，不是收益。人工智能得到的是一个位于模型之外的批准层。车什么时候能听模型的，由这张表决定，不由模型自己决定。",
      ],
    },
  ],
};

const EN: PaperDoc = {
  desk: "Desk",
  paper: "Paper",
  kicker: "YUAN STATION · X LAYER",
  title: "Yuan Station vehicle interlock",
  date: "29 September 2026",
  lede: "Yuan Station is a request interlock on X Layer. It does not train a model, steer, accelerate, brake, or mine official $BEM. It answers one question: may this capability tier, requested by the car's AI, be handed to the actuators?",
  sections: [
    {
      heading: "The problem",
      paragraphs: [
        "The danger in an AI car is often not that the model is too small. It is that the model can ask for more authority. Highway autonomy should not stay active in a jam, a hard brake, a sharp yaw, or when the driver has no qualification.",
        "That decision is usually buried in a prompt, a cloud policy, or closed vehicle software. Outsiders cannot check it. The same inputs can light different lamps after a software change.",
        "Yuan Station lifts the decision out of the model and freezes it as a boolean circuit. Five inputs always produce the same four lamps. The carmaker, an auditor, the vehicle computer, and on-chain eval share one table.",
      ],
    },
    {
      heading: "What we took from TapeOut",
      paragraphs: [
        "TapeOut reduces computation to NAND. Any digital logic can be built from that one gate. A processor issues transistors, a circuit consumes them, and after tape-out anyone can call eval and get the same result. A circuit can also be opened as a container that stores a website.",
        "We kept that production method, not someone else's finished circuit. Genesis CPU 11347.0.tape only hosts the page. It does not replace the interlock, and it cannot mine official $BEM.",
      ],
      table: {
        headers: ["Borrowed", "How we use it"],
        rows: [
          ["NAND as the only gate", "Write the interlock as boolean logic, then fold it into a NAND netlist"],
          ["Processor and transistors", "Create our own processor on X Layer, instead of only taking a number on someone else's"],
          ["Public eval after tape-out", "Once 3.2.250 is on chain, the lamps can be checked. There is no second answer"],
          ["Circuit container and DeWeb", "Genesis CPU #11347 publishes the desk on BNB, with no rented server"],
        ],
      },
    },
    {
      heading: "Where the invention starts",
      paragraphs: [
        "Borrowing stops at knowing how to tape out. The invention is what gets taped out: not a sample adder, but the clearance word of an AI car.",
        "1.2.250 is an adder and 2.2.250 is a single NAND. They only prove the factory works. The product is 3.2.250: 6 inputs, 4 outputs, 27 NANDs. The extra gates are output buffers. The logic is the interlock.",
        "X Layer is the chain because transistors are priced in OKB and the wallet prefers OKX Wallet, chain 196. The page lives on BNB Chain. That is a different chain and a different job.",
      ],
    },
    {
      heading: "The path on X Layer",
      paragraphs: [
        "First, create the processor. Yuan Station is not a wallet. It is a circuit contract from the factory. Symbol YZST, supply cap 32,768, unit price 0.0001 OKB plus the protocol fee. A mint yields NAND or LATCH: tape-out material, not equity in a car company.",
        "Second, freeze the policy as boolean logic. The code, the circuit, and the lamps on the desk are one table.",
        "Third, fold continuous vehicle signals into those five bits. This happens on the car or the phone, not inside the circuit. Acceleration of 6 m/s², or yaw of 0.8 rad/s, is risk. A highway request below 50 km/h is congestion. City cruise uses 15 km/h. Risk wins over congestion.",
        "Fourth, tape out 3.2.250. Anyone can call eval with the same inputs. The desk lamps run the same function locally, so they can be checked against the chain.",
        "Fifth, the road test walks park, city, highway, jam, hazard, and recovery. Qualification is a local timed hash prefix. There is no reward and no block.",
      ],
      formula: [
        "allow   = not risk AND (paid OR local assist OR ticket)",
        "degrade = allow AND congestion AND not local assist",
        "refuse  = not allow",
        "tierHi  = allow AND not degrade AND highway requested",
      ],
    },
    {
      heading: "What each function solves",
      table: {
        headers: ["Function", "What it solves"],
        rows: [
          ["Request word", "Packs tier, payment, congestion, hazard, and qualification into five bits. The model cannot bring its own explanation"],
          ["Clearance lamps", "allow, degrade, refuse, and tier_hi choose assist, cruise, highway, fallback, or lock"],
          ["Congestion rule", "A highway request below 50 km/h only degrades. City cruise uses 15 km/h"],
          ["Hazard lock", "Past the brake or yaw threshold, payment and qualification do not matter. The request is refused"],
          ["Qualification", "Without a subscription, a local proof is required for a higher tier. This is not mining"],
          ["Road replay", "The same road lights the same lamps, so an audit does not depend on luck"],
          ["Truth table", "Every request is computed in place. There is no second answer"],
          ["X Layer 3.2.250", "The table is a public circuit. Anyone can call eval"],
          ["Transistors", "NAND and LATCH for a later revision, spent on a real tape-out"],
          ["DeWeb 11347.0.tape", "The desk needs no rented server. The container belongs to the circuit holder"],
        ],
      },
    },
    {
      heading: "Five actions",
      table: {
        headers: ["Action", "Meaning"],
        rows: [
          ["lite", "Local assist. Usable without payment or a ticket"],
          ["std", "City cruise. Needs payment or a ticket, and no hazard or congestion fallback"],
          ["frontier", "Highway autonomy. Needs payment or a ticket, and tier_hi lit"],
          ["degraded", "Cleared, but the road does not match the requested tier"],
          ["refuse", "Not handed to the actuators"],
        ],
      },
    },
    {
      heading: "Where this sits in AI",
      paragraphs: [
        "Yuan Station does not propose a new driving model and does not contribute a training set. Its contribution sits between the model and the controls: a small, hard interface.",
        "Separable: the model can change and the interlock stays. Refusable: a model output is a request, not an approval. Degradable: congestion does not stall the car, it withdraws the higher tier. Checkable: the request space can be enumerated, and the chain and the local function must light the same lamps.",
        "The contribution is not a smarter car. It is a public permission boundary. The model proposes, the interlock approves, and the actuators obey the approval.",
        "It is still a prototype. It is not ISO 26262, it is not on a production CAN or by-wire bus, and it does not replace the brakes.",
      ],
    },
    {
      heading: "What a user receives",
      paragraphs: [
        "Someone who opens the site gets an interlock they can switch, replay, and read against the truth table. They do not receive a yield.",
        "A developer gets a contract a vehicle computer can call. The car sends five bits and promises that the actuators will not obey the model's raw request.",
        "Someone who mints transistors receives tape-out material. Payment follows the rule frozen when the processor was created. That is not a dividend, not interest for holding the site, and not official $BEM.",
        "Whoever holds circuit 11347 can update the DeWeb page. Sell the circuit, and administration of the site goes with it.",
      ],
    },
    {
      heading: "On-chain record",
      table: {
        headers: ["Item", "Value"],
        rows: [
          ["Interlock chain", "X Layer, chain 196"],
          ["Processor", "0x7F2D3131A76D9aEfb49F44657DA6e1AcAC334687"],
          ["Transistors", "0xd32eDFD4385653e906c414BaB8B59483C752f362"],
          ["Circuit", "3.2.250, 6 in / 4 out / 27 NAND"],
          ["Page container", "BNB Chain, 11347.0.tape"],
          ["Page", "11347-0.tapekit.org"],
        ],
      },
    },
    {
      heading: "What it is not",
      paragraphs: [
        "Yuan Station is not production autonomy, not an investment product, and not a miner. A transistor is not a share. The DeWeb page is not the in-car controller.",
        "It enters a real vehicle on one condition: the vehicle computer keeps sending these five bits, the actuators obey only the clearance, and the thresholds are recalibrated on real data. A rule change must change the circuit and the truth table together. Changing only the lamps on the page is not allowed.",
      ],
    },
    {
      heading: "Conclusion",
      paragraphs: [
        "TapeOut supplied the road that turns logic into a public circuit. Along that road, on X Layer, Yuan Station turned an AI car's tier request into an interlock that cannot be quietly reworded.",
        "Users receive a clearance they can check, not a yield. AI receives an approval layer outside the model. When the car may listen is decided by this table, not by the model itself.",
      ],
    },
  ],
};

export const PAPER: Record<Locale, PaperDoc> = { zh: ZH, en: EN };
