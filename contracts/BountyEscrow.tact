// BountyEscrow.tact — Tact 1.6
//
// One contract per bounty. The creator deploys it and funds it in a single
// transaction. After calling SetWinners, prizes are distributed automatically.
// The Cancel message (refund) is intentionally locked until the deadline passes
// so creators cannot withdraw funds while the bounty is still active.
//
// Security invariants enforced on-chain:
//  - Only the creator address may fund, set winners, or cancel.
//  - Settled flag prevents double-settlement.
//  - Cancel is blocked until deadline passes — funds are locked during active period.
//  - Partial winners allowed: msg.count may be 1..winnerCount.
//  - Nonce field makes the contract address unique even when params collide.

import "@stdlib/deploy";

// ── Messages ──────────────────────────────────────────────────────────────────

// Op: 0x7b7f2a2f — Deploy + fund. Creator must send poolAmount + gas in msg.value.
message(0x7b7f2a2f) Fund {
    poolAmount: Int as coins;
}

// Op: 0x3e4a9d8c — Creator distributes prizes. count may be 1..winnerCount.
message(0x3e4a9d8c) SetWinners {
    winners: map<Int as uint8, Address>;
    count:   Int as uint8;
}

// Op: 0xf1c3a5b7 — Creator refunds full balance. Only callable after deadline.
message(0xf1c3a5b7) Cancel { }

// ── Contract ──────────────────────────────────────────────────────────────────

contract BountyEscrow with Deployable {

    creator:     Address;
    winnerCount: Int as uint8;
    deadline:    Int as uint48;
    poolAmount:  Int as coins;
    settled:     Bool;
    nonce:       Int as uint64;

    init(creator: Address, winnerCount: Int, deadline: Int, nonce: Int) {
        require(winnerCount >= 1 && winnerCount <= 100, "winners: 1-100");
        require(deadline > now(), "deadline must be in future");
        self.creator     = creator;
        self.winnerCount = winnerCount;
        self.deadline    = deadline;
        self.poolAmount  = 0;
        self.settled     = false;
        self.nonce       = nonce;
    }

    // ── Fund ──────────────────────────────────────────────────────────────────
    // Creator sends the exact pool amount in msg.poolAmount plus gas overhead
    // in msg.value. The contract records poolAmount and holds it until settlement.

    receive(msg: Fund) {
        require(sender() == self.creator, "only creator");
        require(!self.settled,            "already settled");
        require(self.poolAmount == 0,     "already funded");
        require(msg.poolAmount > 0,       "pool must be positive");
        // msg.value must cover the pool and leave at least 0.05 TON for gas
        require(context().value >= msg.poolAmount + ton("0.05"), "send pool + 0.05 TON for gas");
        self.poolAmount = msg.poolAmount;
    }

    // ── SetWinners ─────────────────────────────────────────────────────────────
    // Pays each winner their share (poolAmount / winnerCount) and returns any
    // remaining balance (unused winner slots + gas) to the creator.
    // Partial finalization is allowed: count may be less than winnerCount.

    receive(msg: SetWinners) {
        require(sender() == self.creator,                        "only creator");
        require(!self.settled,                                   "already settled");
        require(self.poolAmount > 0,                             "not funded");
        require(msg.count >= 1 && msg.count <= self.winnerCount, "invalid count: 1-winnerCount");

        let perWinner: Int = self.poolAmount / self.winnerCount;

        let i: Int = 0;
        while (i < msg.count) {
            let addr: Address? = msg.winners.get(i);
            if (addr != null) {
                send(SendParameters{
                    to:     addr!!,
                    value:  perWinner,
                    mode:   SendIgnoreErrors,
                    bounce: false,
                    body:   "BountyHive reward".asComment(),
                });
            }
            i = i + 1;
        }

        self.settled = true;

        // Return leftover (rounding dust + unused slots + gas) to creator.
        send(SendParameters{
            to:     self.creator,
            value:  0,
            mode:   SendRemainingBalance + SendIgnoreErrors,
            bounce: false,
        });
    }

    // ── Cancel ────────────────────────────────────────────────────────────────
    // Refunds the full remaining balance to the creator.
    // Only callable after the deadline — funds are locked while the bounty is live.

    receive(msg: Cancel) {
        require(sender() == self.creator, "only creator");
        require(!self.settled,            "already settled");
        require(now() >= self.deadline,   "bounty still active: deadline not reached");
        self.settled = true;
        send(SendParameters{
            to:     self.creator,
            value:  0,
            mode:   SendRemainingBalance + SendIgnoreErrors,
            bounce: false,
        });
    }

    // ── Bounce handler ────────────────────────────────────────────────────────
    // If a Fund message bounces (e.g. contract not yet deployed), clear poolAmount.
    bounced(src: bounced<Fund>) {
        self.poolAmount = 0;
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    get fun poolAmount():  Int     { return self.poolAmount; }
    get fun creator():     Address { return self.creator; }
    get fun deadline():    Int     { return self.deadline; }
    get fun winnerCount(): Int     { return self.winnerCount; }
    get fun nonce():       Int     { return self.nonce; }
    get fun isSettled():   Bool    { return self.settled; }
}
