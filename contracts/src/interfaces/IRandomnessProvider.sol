// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Minimal randomness request/callback shape shared by every provider
/// this protocol can plug in. `MockRandomnessProvider` implements it for
/// local development and tests; the mainnet deployment swaps in an adapter
/// that wraps Chainlink VRF v2.5 (`VRFConsumerBaseV2Plus`) behind the same
/// two functions, so `HoodSharesCollection` never has to change.
interface IRandomnessProvider {
    /// @notice Requests one random word for `requester`. Returns a request id
    /// the provider will echo back in `fulfillRandomness`.
    function requestRandomness(address requester) external returns (uint256 requestId);
}

/// @notice Callback surface implemented by any contract that consumes
/// randomness from an `IRandomnessProvider`.
interface IRandomnessConsumer {
    function fulfillRandomness(uint256 requestId, uint256 randomWord) external;
}
