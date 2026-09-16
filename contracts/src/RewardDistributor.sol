// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @notice Pays out contest results without trusting a payout script. After
/// a session or a season closes, the Treasury funds one epoch here with a
/// Merkle root over every winner's payout; each winner then claims directly
/// and the full payout list stays publicly verifiable against the root.
contract RewardDistributor is Ownable, ReentrancyGuard {
    struct Epoch {
        bytes32 merkleRoot;
        uint256 totalFunded;
        uint256 totalClaimed;
        bool exists;
    }

    address public treasury;
    mapping(uint256 => Epoch) public epochs;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event TreasuryUpdated(address indexed treasury);
    event EpochFunded(uint256 indexed epochId, bytes32 merkleRoot, uint256 amount);
    event Claimed(uint256 indexed epochId, address indexed account, uint256 amount);

    constructor(address initialOwner, address treasury_) Ownable(initialOwner) {
        treasury = treasury_;
    }

    function setTreasury(address treasury_) external onlyOwner {
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    /// @notice Funds a new epoch. Only the Treasury contract can call this,
    /// paired with the ETH it sends in the same transaction.
    function fundEpoch(uint256 epochId, bytes32 merkleRoot) external payable {
        require(msg.sender == treasury, "not treasury");
        require(!epochs[epochId].exists, "epoch already funded");
        epochs[epochId] = Epoch({merkleRoot: merkleRoot, totalFunded: msg.value, totalClaimed: 0, exists: true});
        emit EpochFunded(epochId, merkleRoot, msg.value);
    }

    /// @notice Leaf shape: keccak256(abi.encode(account, epochId, amount)),
    /// double-hashed to match OpenZeppelin's recommended anti-second-preimage
    /// pattern. The off-chain scoring job publishes the full leaf set
    /// alongside the root so any winner can reconstruct their own proof.
    function claim(uint256 epochId, uint256 amount, bytes32[] calldata proof) external nonReentrant {
        Epoch storage epoch = epochs[epochId];
        require(epoch.exists, "unknown epoch");
        require(!claimed[epochId][msg.sender], "already claimed");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, epochId, amount))));
        require(MerkleProof.verify(proof, epoch.merkleRoot, leaf), "invalid proof");

        claimed[epochId][msg.sender] = true;
        epoch.totalClaimed += amount;
        require(epoch.totalClaimed <= epoch.totalFunded, "exceeds epoch funding");

        emit Claimed(epochId, msg.sender, amount);
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "transfer failed");
    }

    function isClaimed(uint256 epochId, address account) external view returns (bool) {
        return claimed[epochId][account];
    }
}
