// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SmeltToken
 * @notice $SMELT — native token of the SMELT Protocol.
 *
 * Fixed supply of 100,000,000,000 $SMELT (100 billion).
 * Launched fairly via BANKR. All tokens minted to deployer at construction.
 * No mint function. No pause. No blacklist. Pure ERC-20.
 *
 * The settlement contract is approved as an operator by stakers —
 * no special privileges are embedded in the token itself.
 */
contract SmeltToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000 * 1e18; // 100B

    constructor(address initialHolder)
        ERC20("SMELT", "SMELT")
        Ownable(initialHolder)
    {
        _mint(initialHolder, TOTAL_SUPPLY);
    }
}
