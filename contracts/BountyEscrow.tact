// BountyEscrow.tact
// One contract instance per bounty.
//
// Lifecycle:
//   1. Creator deploys the contract (init params) + sends pool amount (Fund message).
//   2. Bounty runs on the frontend / Supabase — no on-chain interaction needed.
//   3. After deadline passes, creator calls SetWinners with the selected addresses.
//   4. Contract pays each winner automatically, returns gas dust to creator.
//   5. If creator needs to cancel, they call Cancel before any winners are set.
//
// Security rules enforced on-chain:
//   - Only the creator can fund, set winners, or cancel.
//   - Winners can only be set once.
//   - Winners can only be set after the deadline.
//   - Pool must be funded before winners can be set.

import "@stdlib/deploy";

// ── Message definitions ───────────────────────────────────────────────────────

// Op 0x7b7f2a2f — Creator sends this (with pool amount as msg value) to fund.
message(0x7b7f2a2f) Fund {
    bountyId: String; // off-chain Supabase UUID — used for indexing/events only
}

// Op 0x3e4a9d8c — Creator calls this after deadline to distribute rewards.
// winners map: index (0-based) → winner TON address
message(0x3e4a9d8c) SetWinners {
    winners: map<Int, Address>;
    count:   Int as uint8;
}

// Op 0xf1c3a5b7 — Creator cancels the bounty and reclaims the pool.
// Only allowed if the contract has not yet been settled.
message(0xf1c3a5b7) Cancel {}

// ── Contract ─────────────────────────────────────────────────────────────────

contract BountyEscrow with Deployable {

    // Immutable after init
    creator:     Address;
    winnerCount: Int as uint8;
    deadline:    Int as uint48; // Unix timestamp (seconds)

    // Mutable state
    poolAmount:  Int as coins;
    settled:     Bool;
    bountyId:    String;

    init(creator: Address, winnerCount: Int, deadline: Int) {
        require(winnerCount > 0 && winnerCount <= 20, "Winner count must be 1-20");
        require(deadline > now(), "Deadline must be in the future");
        self.creator     = creator;
        self.winnerCount = winnerCount;
        self.deadline    = deadline;
        self.poolAmount  = 0;
        self.settled     = false;
        self.bountyId    = "";
    }

    // ── Fund ─────────────────────────────────────────────────────────────────

    receive(msg: Fund) {
        require(sender() == self.creator, "Only creator can fund");
        require(!self.settled, "Bounty already settled");
        require(self.poolAmount == 0, "Already funded");
        // Reserve ~0.08 TON for storage rent + gas headroom across all winner pays.
        let net: Int = context().value - ton("0.08");
        require(net > 0, "Send more TON to cover the pool plus gas");
        self.poolAmount = net;
        self.bountyId   = msg.bountyId;
    }

    // ── SetWinners ───────────────────────────────────────────────────────────

    receive(msg: SetWinners) {
        require(sender() == self.creator, "Only creator can set winners");
        require(now() >= self.deadline,   "Bounty is still active");
        require(!self.settled,            "Already settled");
        require(self.poolAmount > 0,      "Bounty not funded");
        require(msg.count == self.winnerCount, "Winner count mismatch");

        let perWinner: Int = self.poolAmount / self.winnerCount;

        let i: Int = 0;
        while (i < msg.count) {
            let winner: Address? = msg.winners.get(i);
            if (winner != null) {
                send(SendParameters{
                    to:     winner!!,
                    value:  perWinner,
                    mode:   SendIgnoreErrors, // don't abort if one transfer bounces
                    bounce: false,
                    body:   "BountyHive reward".asComment(),
                });
            }
            i = i + 1;
        }

        self.settled = true;

        // Return remaining balance (gas + rounding dust) to creator.
        send(SendParameters{
            to:     self.creator,
            value:  0,
            mode:   SendRemainingBalance + SendIgnoreErrors,
            bounce: false,
        });
    }

    // ── Cancel ───────────────────────────────────────────────────────────────

    receive(msg: Cancel) {
        require(sender() == self.creator, "Only creator can cancel");
        require(!self.settled, "Already settled");
        self.settled = true;
        // Refund full remaining balance (pool + any excess gas) to creator.
        send(SendParameters{
            to:     self.creator,
            value:  0,
            mode:   SendRemainingBalance + SendIgnoreErrors,
            bounce: false,
        });
    }

    // ── Bounce handler ────────────────────────────────────────────────────────
    // If our Fund message somehow bounces back, reset poolAmount.
    bounced(src: bounced<Fund>) {
        self.poolAmount = 0;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    get fun poolAmount():  Int     { return self.poolAmount; }
    get fun creator():     Address { return self.creator; }
    get fun deadline():    Int     { return self.deadline; }
    get fun winnerCount(): Int     { return self.winnerCount; }
    get fun isSettled():   Bool    { return self.settled; }
    get fun bountyId():    String  { return self.bountyId; }
}
