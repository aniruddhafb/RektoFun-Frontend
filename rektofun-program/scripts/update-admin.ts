/**
 * One-time rotation script: calls `update_admin` to point the on-chain
 * `Config.admin` field at a new admin wallet.
 *
 * Must be signed by the CURRENT on-chain `Config.admin` (not the target admin).
 *
 * Usage:
 *   OLD_ADMIN_PRIVATE_KEY=<base58-secret-for-current-admin> \
 *   [NEW_ADMIN_PUBKEY=<base58-pubkey>] \
 *   yarn ts-node scripts/update-admin.ts
 *
 * NEW_ADMIN_PUBKEY defaults to the ADMIN_PUBKEY constant in src/constants.rs.
 *
 * Optional env vars:
 *   RPC_URL - defaults to devnet
 */
import { AnchorProvider, Program, Idl } from "@anchor-lang/core";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import idl from "../target/idl/rektofun_program.json";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const CONFIG_SEED = Buffer.from("config");
const PROGRAM_ID = new PublicKey(idl.address);

// Current ADMIN_PUBKEY constant from src/constants.rs — the default rotation target.
const DEFAULT_NEW_ADMIN = "mo3uv8Ai9FJEB4TEfFmj8H5SAh2SArr4tgcqNz9K41n";

async function main() {
  const oldPrivateKeyBase58 = process.env.OLD_ADMIN_PRIVATE_KEY;
  if (!oldPrivateKeyBase58) {
    throw new Error(
      "Set OLD_ADMIN_PRIVATE_KEY (base58 secret for the CURRENT on-chain Config.admin) to run this script."
    );
  }
  const newAdminPubkey = new PublicKey(process.env.NEW_ADMIN_PUBKEY || DEFAULT_NEW_ADMIN);

  const oldAdmin = Keypair.fromSecretKey(bs58.decode(oldPrivateKeyBase58));
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = {
    publicKey: oldAdmin.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(oldAdmin);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((tx) => tx.partialSign(oldAdmin));
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

  console.log("Signer (must equal current Config.admin):", oldAdmin.publicKey.toBase58());
  console.log("Config PDA:", configPda.toBase58(), "bump:", bump);
  console.log("New admin target:", newAdminPubkey.toBase58());

  const configAccount = await (program.account as any).config.fetch(configPda);
  console.log("Current on-chain Config.admin:", configAccount.admin.toBase58());

  if (configAccount.admin.toBase58() !== oldAdmin.publicKey.toBase58()) {
    throw new Error(
      `Signer does not match current Config.admin (${configAccount.admin.toBase58()}). ` +
      "Make sure OLD_ADMIN_PRIVATE_KEY is the CURRENT admin's key, not the new one."
    );
  }

  if (configAccount.admin.toBase58() === newAdminPubkey.toBase58()) {
    console.log("Config.admin already matches the target — nothing to do.");
    return;
  }

  const sig = await (program.methods as any)
    .updateAdmin(newAdminPubkey)
    .accounts({
      config: configPda,
      admin: oldAdmin.publicKey,
    })
    .rpc();

  console.log("update_admin confirmed:", sig);

  const updated = await (program.account as any).config.fetch(configPda);
  console.log("New on-chain Config.admin:", updated.admin.toBase58());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
