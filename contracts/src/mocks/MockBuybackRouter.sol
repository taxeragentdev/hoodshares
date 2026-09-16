// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "./MockERC20.sol";

/// @notice Stands in for a real DEX router in tests. Accepts ETH and sends
/// back a fixed amount of the mock token, so `Treasury.executeBuyback` can
/// be exercised end-to-end without depending on a live pool.
contract MockBuybackRouter {
    MockERC20 public immutable token;

    constructor(MockERC20 token_) {
        token = token_;
    }

    function swap(address to) external payable {
        require(msg.value > 0, "no eth sent");
        IERC20(token).transfer(to, msg.value * 1_000);
    }
}
