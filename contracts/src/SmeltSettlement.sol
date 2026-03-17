// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SmeltSettlement
 * @notice Settlement contract for the SMELT Protocol.
 *
 * Drillers (foremen) stake $SMELT to access foundry zones, solve scrap
 * analysis challenges, and earn on-chain credits redeemable for epoch rewards.
 *
 * Flow:
 *   1. Miner calls stake(amount) — stakes $SMELT, tier assigned off-chain
 *      by coordinator based on staked balance.
 *   2. Coordinator issues EIP-712 signed receipts after lot refinement.
 *   3. Miner calls submitReceipt(...) — credits recorded on-chain.
 *   4. Operator calls fundEpoch(epochId, amount) — deposits rewards.
 *   5. Miner calls claim(epochIds) — proportional rewards distributed.
 */
contract SmeltSettlement is EIP712, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant SCOUT_THRESHOLD    = 25_000_000 * 1e18;
    uint256 public constant OPERATOR_THRESHOLD = 50_000_000 * 1e18;
    uint256 public constant OVERSEER_THRESHOLD = 100_000_000 * 1e18;
    uint256 public constant UNSTAKE_COOLDOWN   = 24 hours;

    bytes32 private constant RECEIPT_TYPEHASH = keccak256(
        "SmeltReceipt(address miner,uint256 epochId,bytes32 siteId,bytes32 challengeId,uint256 credits,uint256 solveIndex,bytes32 nonce)"
    );

    // ─── State ─────────────────────────────────────────────────────────────────
    IERC20 public immutable smeltToken;
    address public coordinator;

    struct StakeInfo {
        uint256 amount;
        uint256 unstakeRequestedAt;
        bool    unstakePending;
    }

    struct EpochInfo {
        uint256 totalCredits;
        uint256 rewardAmount;
        bool    funded;
    }

    struct MinerEpochInfo {
        uint256 credits;
        bool    claimed;
    }

    mapping(address => StakeInfo) public stakes;
    mapping(uint256 => EpochInfo) public epochs;
    mapping(address => mapping(uint256 => MinerEpochInfo)) public minerEpochs;

    // Replay protection: miner => last solve index
    mapping(address => uint256) public lastSolveIndex;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Staked(address indexed miner, uint256 amount);
    event UnstakeRequested(address indexed miner, uint256 amount);
    event UnstakeCancelled(address indexed miner);
    event Withdrawn(address indexed miner, uint256 amount);
    event ReceiptSubmitted(address indexed miner, uint256 indexed epochId, uint256 credits, uint256 solveIndex);
    event EpochFunded(uint256 indexed epochId, uint256 amount, uint256 totalCredits);
    event Claimed(address indexed miner, uint256 indexed epochId, uint256 amount);
    event CoordinatorUpdated(address newCoordinator);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error InsufficientBalance();
    error NotEligible();
    error NothingStaked();
    error UnstakePending();
    error NoUnstakePending();
    error CooldownNotElapsed();
    error InvalidSignature();
    error DuplicateReceipt();
    error EpochNotFunded();
    error NoCredits();
    error AlreadyClaimed();
    error ZeroAmount();
    error EpochAlreadyFunded();

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _smeltToken,
        address _coordinator,
        address _owner
    )
        EIP712("SmeltProtocol", "1")
        Ownable(_owner)
    {
        smeltToken  = IERC20(_smeltToken);
        coordinator = _coordinator;
    }

    // ─── Staking ──────────────────────────────────────────────────────────────

    /**
     * @notice Stake $SMELT to access foundry zones.
     * Minimum: 25M $SMELT (Scout tier).
     */
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount < SCOUT_THRESHOLD) revert InsufficientBalance();

        StakeInfo storage info = stakes[msg.sender];
        if (info.unstakePending) revert UnstakePending();

        smeltToken.safeTransferFrom(msg.sender, address(this), amount);
        info.amount += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Request to unstake. Starts 24h cooldown. Removes drilling eligibility.
     */
    function requestUnstake() external {
        StakeInfo storage info = stakes[msg.sender];
        if (info.amount == 0) revert NothingStaked();
        if (info.unstakePending) revert UnstakePending();

        info.unstakePending        = true;
        info.unstakeRequestedAt    = block.timestamp;

        emit UnstakeRequested(msg.sender, info.amount);
    }

    /**
     * @notice Cancel a pending unstake. Restores drilling eligibility immediately.
     */
    function cancelUnstake() external {
        StakeInfo storage info = stakes[msg.sender];
        if (!info.unstakePending) revert NoUnstakePending();

        info.unstakePending     = false;
        info.unstakeRequestedAt = 0;

        emit UnstakeCancelled(msg.sender);
    }

    /**
     * @notice Withdraw staked $SMELT after cooldown has elapsed.
     */
    function withdraw() external nonReentrant {
        StakeInfo storage info = stakes[msg.sender];
        if (!info.unstakePending) revert NoUnstakePending();
        if (block.timestamp < info.unstakeRequestedAt + UNSTAKE_COOLDOWN) revert CooldownNotElapsed();

        uint256 amount = info.amount;
        info.amount             = 0;
        info.unstakePending     = false;
        info.unstakeRequestedAt = 0;

        smeltToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    // ─── Receipts ─────────────────────────────────────────────────────────────

    /**
     * @notice Submit a coordinator-signed receipt to record credits on-chain.
     * @dev Uses EIP-712 typed data. solve index must strictly increase per miner.
     */
    function submitReceipt(
        address  miner,
        uint256  epochId,
        bytes32  siteId,
        bytes32  challengeId,
        uint256  credits,
        uint256  solveIndex,
        bytes32  nonce,
        bytes calldata signature
    ) external nonReentrant {
        // Verify miner has active stake (not pending unstake)
        StakeInfo storage info = stakes[miner];
        if (info.amount < SCOUT_THRESHOLD || info.unstakePending) revert NotEligible();

        // Replay protection
        if (solveIndex <= lastSolveIndex[miner]) revert DuplicateReceipt();
        lastSolveIndex[miner] = solveIndex;

        // Verify EIP-712 signature from coordinator
        bytes32 structHash = keccak256(abi.encode(
            RECEIPT_TYPEHASH,
            miner,
            epochId,
            siteId,
            challengeId,
            credits,
            solveIndex,
            nonce
        ));
        bytes32 digest    = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        if (recovered != coordinator) revert InvalidSignature();

        // Record credits
        minerEpochs[miner][epochId].credits += credits;
        epochs[epochId].totalCredits        += credits;

        emit ReceiptSubmitted(miner, epochId, credits, solveIndex);
    }

    // ─── Epoch Funding & Claims ───────────────────────────────────────────────

    /**
     * @notice Operator funds a completed epoch with $SMELT rewards.
     * Amount is modulated by steel price multiplier off-chain before calling.
     */
    function fundEpoch(uint256 epochId, uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        EpochInfo storage ep = epochs[epochId];
        if (ep.funded) revert EpochAlreadyFunded();

        smeltToken.safeTransferFrom(msg.sender, address(this), amount);
        ep.rewardAmount = amount;
        ep.funded       = true;

        emit EpochFunded(epochId, amount, ep.totalCredits);
    }

    /**
     * @notice Claim proportional rewards for one or more completed epochs.
     */
    function claim(uint256[] calldata epochIds) external nonReentrant {
        uint256 totalReward;

        for (uint256 i; i < epochIds.length; ++i) {
            uint256 epochId = epochIds[i];
            EpochInfo storage ep = epochs[epochId];

            if (!ep.funded)                                   revert EpochNotFunded();

            MinerEpochInfo storage me = minerEpochs[msg.sender][epochId];
            if (me.credits == 0)                              revert NoCredits();
            if (me.claimed)                                   revert AlreadyClaimed();

            me.claimed = true;

            // Proportional reward: reward * (miner_credits / total_credits)
            uint256 reward = (ep.rewardAmount * me.credits) / ep.totalCredits;
            totalReward   += reward;

            emit Claimed(msg.sender, epochId, reward);
        }

        if (totalReward > 0) {
            smeltToken.safeTransfer(msg.sender, totalReward);
        }
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getStakeTier(address miner) external view returns (string memory) {
        uint256 amount = stakes[miner].amount;
        if (stakes[miner].unstakePending)    return "none";
        if (amount >= OVERSEER_THRESHOLD)    return "overseer";
        if (amount >= OPERATOR_THRESHOLD)    return "operator";
        if (amount >= SCOUT_THRESHOLD)       return "scout";
        return "none";
    }

    function getMinerEpochCredits(address miner, uint256 epochId) external view returns (uint256) {
        return minerEpochs[miner][epochId].credits;
    }

    function hasClaimed(address miner, uint256 epochId) external view returns (bool) {
        return minerEpochs[miner][epochId].claimed;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setCoordinator(address _coordinator) external onlyOwner {
        coordinator = _coordinator;
        emit CoordinatorUpdated(_coordinator);
    }
}
