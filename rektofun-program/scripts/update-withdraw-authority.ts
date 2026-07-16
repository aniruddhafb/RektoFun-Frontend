/**
 * Rotation script: calls `update_withdraw_authority` to point the
 * `WithdrawAuthority` PDA at a new dedicated wallet.
 *
 * Must be signed by the CURRENT `withdraw_authority.authority` itself —
 * NOT by `Config.admin`. This is deliberate: even a fully compromised admin
 * hot wallet has no path to reassign this authority to itself.
 *
 * Usage:
 *   OLD_WITHDRAW_AUTHORITY_PRIVATE_KEY=<base58-secret-for-current-withdraw-authority> \
 *   NEW_WITHDRAW_AUTHORITY_PUBKEY=<base58-pubkey-of-the-new-cold-wallet> \
 *   yarn ts-node scripts/update-withdraw-authority.ts
 *
 * Optional env vars:
 *   RPC_URL - defaults to devnet
 */
import { AnchorProvider, Program, Idl } from "@anchor-lang/core";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import idl from "../target/idl/rektofun_program.json";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const WITHDRAW_AUTHORITY_SEED = Buffer.from("withdraw_authority");
const PROGRAM_ID = new PublicKey(idl.address);

async function main() {
  const oldPrivateKeyBase58 = process.env.OLD_WITHDRAW_AUTHORITY_PRIVATE_KEY;
  if (!oldPrivateKeyBase58) {
    throw new Error(
      "Set OLD_WITHDRAW_AUTHORITY_PRIVATE_KEY (base58 secret for the CURRENT withdraw_authority.authority) to run this script."
    );
  }
  const newAuthorityPubkeyStr = process.env.NEW_WITHDRAW_AUTHORITY_PUBKEY;
  if (!newAuthorityPubkeyStr) {
    throw new Error(
      "Set NEW_WITHDRAW_AUTHORITY_PUBKEY (base58 PUBLIC key of the new cold wallet) to run this script."
    );
  }
  const newAuthorityPubkey = new PublicKey(newAuthorityPubkeyStr);

  const oldAuthority = Keypair.fromSecretKey(bs58.decode(oldPrivateKeyBase58));
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = {
    publicKey: oldAuthority.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(oldAuthority);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((tx) => tx.partialSign(oldAuthority));
      return txs;
    },
  };
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  const program = new Program(idl as Idl, provider);

  const [withdrawAuthorityPda, bump] = PublicKey.findProgramAddressSync(
    [WITHDRAW_AUTHORITY_SEED],
    PROGRAM_ID
  );

  console.log("Signer (must equal current withdraw_authority.authority):", oldAuthority.publicKey.toBase58());
  console.log("WithdrawAuthority PDA:", withdrawAuthorityPda.toBase58(), "bump:", bump);
  console.log("New withdraw authority target:", newAuthorityPubkey.toBase58());

  const withdrawAuthorityAccount = await (program.account as any).withdrawAuthority.fetch(
    withdrawAuthorityPda
  );
  console.log("Current on-chain withdraw_authority:", withdrawAuthorityAccount.authority.toBase58());

  if (withdrawAuthorityAccount.authority.toBase58() !== oldAuthority.publicKey.toBase58()) {
    throw new Error(
      `Signer does not match current withdraw_authority (${withdrawAuthorityAccount.authority.toBase58()}). ` +
      "Make sure OLD_WITHDRAW_AUTHORITY_PRIVATE_KEY is the CURRENT authority's key, not the new one."
    );
  }

  const sig = await (program.methods as any)
    .updateWithdrawAuthority(newAuthorityPubkey)
    .accounts({
      withdrawAuthority: withdrawAuthorityPda,
      authority: oldAuthority.publicKey,
    })
    .rpc();

  console.log("update_withdraw_authority confirmed:", sig);

  const updated = await (program.account as any).withdrawAuthority.fetch(withdrawAuthorityPda);
  console.log("New on-chain withdraw_authority:", updated.authority.toBase58());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
