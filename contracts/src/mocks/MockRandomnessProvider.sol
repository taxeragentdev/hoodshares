// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IRandomnessProvider, IRandomnessConsumer} from "../interfaces/IRandomnessProvider.sol";

/// @notice Deterministic-but-unpredictable-at-request-time stand-in for
/// Chainlink VRF, used on local networks and testnet so the reveal flow can
/// be exercised end to end without a funded VRF subscription.
///
/// NEVER deploy this on mainnet: `block.prevrandao` and future block data are
/// influenceable by the block builder, which defeats the entire point of the
/// reveal being unpredictable. The mainnet deployment must point
/// `SealedPack` (and the legacy collection, if used) at a real
/// `VRFConsumerBaseV2Plus` adapter instead.
contract MockRandomnessProvider is IRandomnessProvider {
    uint256 private nextRequestId = 1;
    mapping(uint256 => address) public requesterOf;

    event RandomnessRequested(uint256 indexed requestId, address indexed requester);
    event RandomnessFulfilled(uint256 indexed requestId, uint256 randomWord);

    function requestRandomness(address requester) external override returns (uint256 requestId) {
        requestId = nextRequestId++;
        requesterOf[requestId] = requester;
        emit RandomnessRequested(requestId, requester);
    }

    /// @notice Anyone can settle a pending request on testnet — there is no
    /// operator trust to protect here, only a fairness property that does
    /// not apply until the real VRF adapter is in place.
    function fulfillLatest(uint256 requestId) external {
        address requester = requesterOf[requestId];
        require(requester != address(0), "unknown request");
        uint256 randomWord = uint256(
            keccak256(abi.encode(blockhash(block.number - 1), block.prevrandao, requestId, address(this)))
        );
        emit RandomnessFulfilled(requestId, randomWord);
        IRandomnessConsumer(requester).fulfillRandomness(requestId, randomWord);
    }
}
