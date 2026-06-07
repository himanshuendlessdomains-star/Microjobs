// Re-export the Tact-generated class and helpers for use in scripts and tests.
export {
    BountyEscrow,
    storeFund,
    storeSetWinners,
    storeCancel,
    BountyEscrow_errors,
} from "../build/BountyEscrow/tact_BountyEscrow";
export type { Fund, SetWinners, Cancel } from "../build/BountyEscrow/tact_BountyEscrow";
