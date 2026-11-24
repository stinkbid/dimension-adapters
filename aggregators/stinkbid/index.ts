// STINKBID — stink-bid (limit buy) volume on Robinhood Chain.
//
// STINKBID (https://stinkbid.pro) lets a wallet sign a buy order for a tokenized stock well under today's price.
// The USDG stays in the maker's wallet; when the pool reaches the level, anyone (usually the STINKBID keeper)
// calls fill() on the StinkBid contract, which pulls exactly the signed USDG through Permit2, swaps it on
// Uniswap v3 (SwapRouter02) and sends the stock token straight to the maker, reverting if the maker would get
// less than the signed minimum. Source (verified on Sourcify, exact match):
//   https://github.com/stinkbid/stinkbid/blob/main/contracts/src/StinkBid.sol
//   https://robinhoodchain.blockscout.com/address/0x362917b506695C2096e361Fc032D4315f2439760
//
// Every fill emits Filled(maker, nonce, tokenOut, amountIn, amountOut, filler) from the contract, with amountIn
// in USDG. dailyVolume is the USDG spent by filled stink bids. Reverted fills emit nothing and are not counted.
// The swap itself also shows in the Uniswap v3 adapter; this is the volume routed through STINKBID.
//
// Fees: none. The contract has no fee and no owner; the maker pays only the Uniswap pool fee inside the swap,
// which is Uniswap's, not STINKBID's. So no fee or revenue dimensions are returned.
import { FetchOptions, SimpleAdapter } from "../../adapters/types";
import ADDRESSES from "../../helpers/coreAssets.json";
import { CHAIN } from "../../helpers/chains";

const STINKBID = "0x362917b506695C2096e361Fc032D4315f2439760";
const FILLED = "event Filled(address indexed maker, uint256 indexed nonce, address indexed tokenOut, uint256 amountIn, uint256 amountOut, address filler)";

const fetch = async (options: FetchOptions) => {
  const dailyVolume = options.createBalances();
  const fills = await options.getLogs({ target: STINKBID, eventAbi: FILLED });
  for (const fill of fills) dailyVolume.add(ADDRESSES.robinhood.USDG, fill.amountIn);
  return { dailyVolume };
};

const adapter: SimpleAdapter = {
  version: 2,
  pullHourly: true,
  fetch,
  chains: [CHAIN.ROBINHOOD],
  start: "2026-11-21",
  methodology: {
    Volume: "USDG spent by filled stink bids, read from the Filled events of the StinkBid contract on Robinhood Chain.",
  },
};

export default adapter;
