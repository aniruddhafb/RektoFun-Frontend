/**
 * One-time bootstrap script: calls `initialize_config` to create the global
 * `Config` PDA on-chain, seeded with the compile-time defaults from
 * `src/constants.rs` (platform_fee_bps, creator_fee_bps, min_bet_amount, etc).
 *
 * Only the genesis `ADMIN_PUBKEY` (see src/constants.rs) can sign this call —
 * the same secret used by `app/lib/admin-signer.ts` server-side.
 *
 * Usage:
 *   ADMIN_PRIVATE_KEY=<base58-secret> yarn ts-node scripts/initialize-config.ts
 *
 * Optional env vars:
 *   RPC_URL     - defaults to Anchor.toml's devnet cluster
 */
import { AnchorProvider, Program, Idl } from "@anchor-lang/core";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";
import idl from "../target/idl/rektofun_program.json";

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const CONFIG_SEED = Buffer.from("config");
const PROGRAM_ID = new PublicKey(idl.address);

async function main() {
  const privateKeyBase58 = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKeyBase58) {
    throw new Error(
      "Set ADMIN_PRIVATE_KEY (base58 secret for the genesis admin wallet, " +
        "same as used by app/lib/admin-signer.ts) to run this script."
    );
  }
  const admin = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = {
    publicKey: admin.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(admin);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((tx) => tx.partialSign(admin));
      return txs;
    },
  };
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  const program = new Program(idl as Idl, provider);

  const [configPda, bump] = PublicKey.findProgramAddressSync(
    [CONFIG_SEED],
    PROGRAM_ID
  );

  console.log("Admin:", admin.publicKey.toBase58());
  console.log("Config PDA:", configPda.toBase58(), "bump:", bump);

  const existing = await connection.getAccountInfo(configPda);
  if (existing) {
    console.log("Config already initialized — nothing to do.");
    return;
  }

  const sig = await (program.methods as any)
    .initializeConfig()
    .accounts({
      admin: admin.publicKey,
      config: configPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("initialize_config confirmed:", sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
