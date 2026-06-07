// BountyEscrow.tact — Tact 1.6
//
// One contract per bounty. The creator deploys it and funds it in a single
// transaction. After the deadline, the creator calls SetWinners to distribute
// the pool automatically. Either party can call Cancel before settlement.
//
// Security invariants enforced on-chain:
//  - Only the creator address may fund, set winners, or cancel.
//  - Winners can be set only once and only after the deadline.
//  - The contract must be funded before winners can be set.

import "@stdlib/deploy";

// ── Messages ──────────────────────────────────────────────────────────────────

// Op: 0x7b7f2a2f  — Deploy + fund the bounty (creator sends pool amount as msg.value).
message(0x7b7f2a2f) Fund { }

// Op: 0x3e4a9d8c  — Creator calls this after deadline to pay out rewards.
message(0x3e4a9d8c) SetWinners {
    winners: map<Int as uint8, Address>;
    count:   Int as uint8;
}

// Op: 0xf1c3a5b7  — Creator cancels; all remaining balance refunded to creator.
message(0xf1c3a5b7) Cancel { }

// ── Contract ─────────────────────────────────────────────────────────────────

contract BountyEscrow with Deployable {

    creator:     Address;
    winnerCount: Int as uint8;
    deadline:    Int as uint48;
    poolAmount:  Int as coins;
    settled:     Bool;

    init(creator: Address, winnerCount: Int, deadline: Int) {
        require(winnerCount >= 1 && winnerCount <= 20, "winners: 1-20");
        require(deadline > now(), "deadline must be in future");
        self.creator     = creator;
        self.winnerCount = winnerCount;
        self.deadline    = deadline;
        self.poolAmount  = 0;
        self.settled     = false;
    }

    // ── Fund ─────────────────────────────────────────────────────────────────
    // Creator sends pool TON with this message body.
    // Reserves 0.1 TON for storage rent + winner-pay gas.

    receive(msg: Fund) {
        require(sender() == self.creator, "only creator");
        require(!self.settled,            "already settled");
        require(self.poolAmount == 0,     "already funded");
        let net: Int = context().value - ton("0.1");
        require(net > 0, "send more TON to cover pool and gas");
        self.poolAmount = net;
    }

    // ── SetWinners ───────────────────────────────────────────────────────────
    // Pays each winner their share, then returns remaining balance to creator.

    receive(msg: SetWinners) {
        require(sender() == self.creator,      "only creator");
        require(now() >= self.deadline,        "bounty still active");
        require(!self.settled,                 "already settled");
        require(self.poolAmount > 0,           "not funded");
        require(msg.count == self.winnerCount, "winner count mismatch");

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

        // Return leftover balance (rounding dust + unused gas) to creator.
        send(SendParameters{
            to:     self.creator,
            value:  0,
            mode:   SendRemainingBalance + SendIgnoreErrors,
            bounce: false,
        });
    }

    // ── Cancel ───────────────────────────────────────────────────────────────
    // Refunds the full remaining balance (pool + gas) to the creator.

    receive(msg: Cancel) {
        require(sender() == self.creator, "only creator");
        require(!self.settled,            "already settled");
        self.settled = true;
        send(SendParameters{
            to:     self.creator,
            value:  0,
            mode:   SendRemainingBalance + SendIgnoreErrors,
            bounce: false,
        });
    }

    // ── Bounce handler ────────────────────────────────────────────────────────
    // If our Fund message bounces back, clear the pool amount.
    bounced(src: bounced<Fund>) {
        self.poolAmount = 0;
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    get fun poolAmount():  Int     { return self.poolAmount; }
    get fun creator():     Address { return self.creator; }
    get fun deadline():    Int     { return self.deadline; }
    get fun winnerCount(): Int     { return self.winnerCount; }
    get fun isSettled():   Bool    { return self.settled; }
}
