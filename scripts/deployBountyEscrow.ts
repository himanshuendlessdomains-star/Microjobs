import { toNano, beginCell } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { BountyEscrow, storeFund } from "../wrappers/BountyEscrow";

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const creatorAddress = sender.address;
    if (!creatorAddress) throw new Error("No sender address — connect a wallet first");

    // Adjust these before each deploy:
    const winnerCount = 1;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 h from now
    const poolTon = "0.5"; // TON that goes into the prize pool

    console.log("\nDeploying BountyEscrow...");
    console.log(`  Creator:      ${creatorAddress.toString()}`);
    console.log(`  Winner count: ${winnerCount}`);
    console.log(`  Deadline:     ${new Date(deadline * 1000).toISOString()}`);
    console.log(`  Pool:         ${poolTon} TON`);

    const escrow = await BountyEscrow.fromInit(
        creatorAddress,
        BigInt(winnerCount),
        BigInt(deadline),
    );

    // Fund body sent alongside state-init so the contract is funded on deploy.
    const fundBody = beginCell().store(storeFund({ $$type: "Fund" })).endCell();

    // pool + 0.1 TON gas reserve + 0.1 TON deploy overhead
    const deployValue = toNano(poolTon) + toNano("0.2");

    await provider.deploy(escrow, deployValue, fundBody);

    const isTestnet = provider.network() !== "mainnet";
    const addr = escrow.address.toString({ testOnly: isTestnet });

    console.log(`\n✅ Deployed at: ${addr}`);
    console.log(`\nAdd to your .env.local:\n  NEXT_PUBLIC_ESCROW_ADDRESS=${addr}`);
    console.log(
        `\nView on explorer:\n  ${isTestnet ? "https://testnet.tonviewer.com/" : "https://tonviewer.com/"}${addr}`,
    );
}
