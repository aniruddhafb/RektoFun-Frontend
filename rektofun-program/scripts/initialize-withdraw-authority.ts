/**
 * One-time bootstrap script: calls `initialize_withdraw_authority` to create
 * the `WithdrawAuthority` PDA and point it at the dedicated wallet that will
 * be the sole signer for `admin_withdraw` going forward.
 *
 * Only the CURRENT on-chain `Config.admin` can sign this call. Only the new
 * wallet's PUBLIC key is needed here — its private key should be generated
 * offline (hardware wallet / air-gapped keypair) and never given to this
 * script, `rektofun-settlement`, or any other running service.
 *
 * Usage:
 *   ADMIN_PRIVATE_KEY=<base58-secret-for-current-admin> \
 *   WITHDRAW_AUTHORITY_PUBKEY=<base58-pubkey-of-the-dedicated-cold-wallet> \
 *   yarn ts-node scripts/initialize-withdraw-authority.ts
 *
 * Optional env vars:
 *   RPC_URL - defaults to devnet
 */


// ADMIN_PRIVATE_KEY=<current admin base58 secret> \
// WITHDRAW_AUTHORITY_PUBKEY=<the new wallet's base58 pubkey> \
// yarn ts-node scripts/initialize-withdraw-authority.ts

import { AnchorProvider, Program, Idl } from "@anchor-lang/core";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";
import idl from "../target/idl/rektofun_program.json";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const CONFIG_SEED = Buffer.from("config");
const WITHDRAW_AUTHORITY_SEED = Buffer.from("withdraw_authority");
const PROGRAM_ID = new PublicKey(idl.address);

async function main() {
  const adminPrivateKeyBase58 = process.env.ADMIN_PRIVATE_KEY;
  if (!adminPrivateKeyBase58) {
    throw new Error(
      "Set ADMIN_PRIVATE_KEY (base58 secret for the CURRENT on-chain Config.admin) to run this script."
    );
  }
  const withdrawAuthorityPubkeyStr = process.env.WITHDRAW_AUTHORITY_PUBKEY;
  if (!withdrawAuthorityPubkeyStr) {
    throw new Error(
      "Set WITHDRAW_AUTHORITY_PUBKEY (base58 PUBLIC key of the dedicated cold wallet — " +
      "not a private key) to run this script."
    );
  }
  const withdrawAuthorityPubkey = new PublicKey(withdrawAuthorityPubkeyStr);

  const admin = Keypair.fromSecretKey(bs58.decode(adminPrivateKeyBase58));
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

  const [configPda] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
  const [withdrawAuthorityPda, bump] = PublicKey.findProgramAddressSync(
    [WITHDRAW_AUTHORITY_SEED],
    PROGRAM_ID
  );

  console.log("Signer (must equal current Config.admin):", admin.publicKey.toBase58());
  console.log("Config PDA:", configPda.toBase58());
  console.log("WithdrawAuthority PDA:", withdrawAuthorityPda.toBase58(), "bump:", bump);
  console.log("Withdraw authority to set:", withdrawAuthorityPubkey.toBase58());

  const configAccount = await (program.account as any).config.fetch(configPda);
  if (configAccount.admin.toBase58() !== admin.publicKey.toBase58()) {
    throw new Error(
      `Signer does not match current Config.admin (${configAccount.admin.toBase58()}).`
    );
  }

  const existing = await connection.getAccountInfo(withdrawAuthorityPda);
  if (existing) {
    console.log("WithdrawAuthority already initialized — nothing to do. " +
      "Use scripts/update-withdraw-authority.ts to rotate it instead.");
    return;
  }

  const sig = await (program.methods as any)
    .initializeWithdrawAuthority(withdrawAuthorityPubkey)
    .accounts({
      config: configPda,
      admin: admin.publicKey,
      withdrawAuthority: withdrawAuthorityPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("initialize_withdraw_authority confirmed:", sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
