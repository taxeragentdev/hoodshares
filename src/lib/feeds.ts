/**
 * Chainlink tokenized-equity feed proxies on Robinhood Chain (4663).
 * Proxies taken from https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json
 * Tickers without a proxy are filled from Robinhood's Stock Token quote API
 * so every card in the roster still scores on live USD.
 */
export const CHAINLINK_FEEDS: Partial<Record<string, `0x${string}`>> = {
  tsla: "0x4A1166a659A55625345e9515b32adECea5547C38",
  nvda: "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15",
  aapl: "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0",
  gme: "0x27C71df6A64fB476468EdF256CF72c038baB5B67",
  amzn: "0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C",
  msft: "0x45C3C877C15E6BA2EBB19eA114Ea508d14C1Af2E",
  pltr: "0x820ABedFF239034956B7A9d2F0a331f9F075eB4c",
  coin: "0xA3a468A452940B7D6b69991207B508c609a98Ef2",
  amd: "0x943A29E7ae51A4798823ca9eEd2ed533B2A22C72",
  meta: "0x7C38C00C30BEe9378381E7B6135d7283356D71b1",
  mstr: "0x396118bdFB181e6240E74D243F266B061c0edc3D",
  ionq: "0x22EfeC4919baf55F360E0EDee4AbEB26DE4971eb",
  googl: "0xF6f373a037c30F0e5010d854385cA89185AE638b",
  intc: "0x3f390C5C24628Ac7C489515402235FeAD71D1913",
  mu: "0x425EEFdCf05ed6526C3cE61Af99429A228a6d596",
  crcl: "0x6652eDf64bA3731C4F2D3ce821A0Fb1f1f6b482a",
  spcx: "0xB265810950ba6c5C0Ff821c9963014a56fD8Bffb",
  sndk: "0xfb133Fa4B7b385802B693a293606682Df47109A3",
  baba: "0x62Cc8F9b5f56a33c9C8A60c8B92779f523c4E984",
};

export const AGGREGATOR_V3_ABI = [
  {
    type: "function",
    name: "latestRoundData",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;
