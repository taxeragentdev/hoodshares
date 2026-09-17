import { PACK_PRICE_HOOD_LABEL, PACK_TOKEN_SYMBOL } from "@/lib/packs";
import { DEMO_TICKET_PRICE_ETH } from "@/lib/ticket";
import { ROUND_ENTRY_LABEL, TOKEN_SYMBOL } from "@/lib/token";
import { Section, SectionHeading } from "./ui/Section";

const QUESTIONS = [
  {
    q: "Does owning a card give me exposure to the stock?",
    a: "No. Cards are collectibles. They give you no ownership, dividend, or price exposure. The share price is only used to score the game, the same way a real match scores fantasy sports.",
  },
  {
    q: "How do I start?",
    a: `Mint one HoodPass on OpenSea. This wallet gets one included pack on HoodShares, even if OpenSea let you mint more than one pass. Extra packs mint on this site for ${PACK_PRICE_HOOD_LABEL} ${PACK_TOKEN_SYMBOL}. Then take five cards into Daily Lineup. Each round costs ${ROUND_ENTRY_LABEL} ${TOKEN_SYMBOL}.`,
  },
  {
    q: "Can I pull the same stock five times?",
    a: "Yes. Every slot in a pack is a fresh draw from the 30-name roster. Five of the same name can happen. Playing them all in one lineup is usually a bad idea.",
  },
  {
    q: "When does a round start and end?",
    a: "US market hours: 09:30 to 16:00 New York time, weekdays only. Lineups lock at the open. No Daily Lineup on weekends or US market holidays.",
  },
  {
    q: "How is a card scored?",
    a: "Points equal that stock's percent move from the official open, times 100. Every ticker scores the same. UP pays on a rise. DOWN pays on a fall. Lock anytime to freeze that percent. If you never lock, you take the 16:00 ET close.",
  },
  {
    q: "Do rare foils help me win?",
    a: "No. Foil is just how the card looks. Repeating the same ticker is what changes the score: extra copies keep less of a win and lose more on a miss.",
  },
  {
    q: "What does it cost to play, and what do I win?",
    a: `A HoodPass is ${DEMO_TICKET_PRICE_ETH} ETH on OpenSea and includes one pack. Extra packs are ${PACK_PRICE_HOOD_LABEL} ${PACK_TOKEN_SYMBOL} on HoodShares. Each Daily Lineup round costs ${ROUND_ENTRY_LABEL} ${TOKEN_SYMBOL} from Season 1. After Friday's close, the top ten split a weekly ${TOKEN_SYMBOL} pool.`,
  },
  {
    q: "Which network do I need?",
    a: "Robinhood Chain, chain ID 4663. Gas is ETH. Any Ethereum wallet works once you add the network.",
  },
  {
    q: "Where do trade fees go?",
    a: `Half of every ${TOKEN_SYMBOL} trade fee goes to the prize pool. Round entry fees go there in full. ETH from the HoodPass mint splits 60 percent prize, 30 percent buyback and burn, 5 percent development, 5 percent growth.`,
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Common questions" />

      <div className="mt-12 divide-y divide-[#242424] border-y border-[#242424]">
        {QUESTIONS.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
              <span className="text-ink group-hover:text-acid text-base font-semibold transition-colors">
                {item.q}
              </span>
              <span className="border-line text-ink-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-transform duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-ink-2 max-w-3xl pb-6 text-sm leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
