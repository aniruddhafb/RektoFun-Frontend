/// LiteSVM integration tests for the rektofun_program.
///
/// Run with:
///   cd rektofun-program && cargo test 2>&1
use anchor_lang::{prelude::Pubkey, InstructionData, ToAccountMetas};
use litesvm::LiteSVM;
use rektofun_program::{
    accounts as rektofun_accounts,
    instruction as rektofun_ix,
    state::{ChallengeAccount, ChallengeStatus, ChallengeType, CreatorCounter},
    AcceptChallengeParams, CreateChallengeParams,
};
use solana_keypair::Keypair;
use solana_message::{Message, VersionedMessage};
use solana_signer::Signer;
use solana_transaction::versioned::VersionedTransaction;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHALLENGE_SEED: &[u8] = b"challenge";
const VAULT_SEED: &[u8] = b"vault";
const COUNTER_SEED: &[u8] = b"creator_counter";
const CONFIG_SEED: &[u8] = b"config";

fn system_program_id() -> Pubkey {
    Pubkey::default()
}

fn find_counter(creator: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[COUNTER_SEED, creator.as_ref()], &rektofun_program::ID)
}

fn find_challenge(creator: &Pubkey, id: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[CHALLENGE_SEED, creator.as_ref(), &id.to_le_bytes()],
        &rektofun_program::ID,
    )
}

fn find_vault(challenge: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[VAULT_SEED, challenge.as_ref()], &rektofun_program::ID)
}

fn find_config() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[CONFIG_SEED], &rektofun_program::ID)
}

/// The program enforces `address = ADMIN_PUBKEY` on the sponsor accounts, so
/// tests must sign with the real admin key (same secret the backend uses) —
/// read from the environment rather than hardcoded here.
fn admin_keypair() -> Keypair {
    let secret = std::env::var("ADMIN_PRIVATE_KEY").expect(
        "Set ADMIN_PRIVATE_KEY (same base58 secret used by app/lib/admin-signer.ts) to run these tests",
    );
    Keypair::from_base58_string(&secret)
}

fn send_ix(
    svm: &mut LiteSVM,
    payer: &Keypair,
    accounts: Vec<solana_message::AccountMeta>,
    data: Vec<u8>,
    signers: &[&Keypair],
) -> Result<(), String> {
    let msg = Message::new_with_blockhash(
        &[solana_message::Instruction {
            program_id: rektofun_program::ID,
            accounts,
            data,
        }],
        Some(&payer.pubkey()),
        &svm.latest_blockhash(),
    );
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers)
        .map_err(|e| format!("Failed to sign tx: {e}"))?;
    svm.send_transaction(tx)
        .map_err(|e| format!("Transaction failed: {e:?}"))?;
    Ok(())
}

/// Bootstraps the global Config PDA (must happen once per fresh LiteSVM
/// instance before any create_challenge/accept_challenge/cancel_challenge call).
fn init_config(svm: &mut LiteSVM, admin: &Keypair) -> Pubkey {
    let (config_pda, _) = find_config();

    let accounts = rektofun_accounts::InitializeConfig {
        admin: admin.pubkey(),
        config: config_pda,
        system_program: system_program_id(),
    }
    .to_account_metas(None);

    send_ix(
        svm,
        admin,
        accounts,
        rektofun_ix::InitializeConfig {}.data(),
        &[admin],
    )
    .expect("initialize_config failed");

    config_pda
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[test]
fn test_create_and_accept_pvp_challenge() {
    let mut svm = LiteSVM::new();

    // Load the program
    svm.add_program_from_file(
        rektofun_program::ID,
        "../../target/deploy/rektofun_program.so",
    )
    .expect("Failed to load program .so — run `anchor build` first");

    let creator = Keypair::new();
    let challenger = Keypair::new();
    let admin = admin_keypair();

    // Airdrop SOL
    svm.airdrop(&creator.pubkey(), 10_000_000_000).unwrap();
    svm.airdrop(&challenger.pubkey(), 10_000_000_000).unwrap();
    svm.airdrop(&admin.pubkey(), 10_000_000_000).unwrap();

    let config_pda = init_config(&mut svm, &admin);

    let (counter_pda, _) = find_counter(&creator.pubkey());
    let (challenge_pda, _) = find_challenge(&creator.pubkey(), 0);
    let (vault_pda, _) = find_vault(&challenge_pda);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // ── PVP challenge ──
    let params = CreateChallengeParams {
        asset: "BTC".to_string(),
        bet_amount: 100_000_000, // 100 USDC micro-units (test value)
        target_price_usd_cents: 9_500_000, // $95,000
        direction_above: true,
        expires_at: now + 3600,  // 1 hour
        resolves_at: now + 7200, // 2 hours
        challenge_type: ChallengeType::Pvp,
        max_team_size: 0, // ignored for PVP
    };

    // ── create_challenge ──
    let create_accounts = rektofun_accounts::CreateChallenge {
        creator: creator.pubkey(),
        config: config_pda,
        fee_payer: admin.pubkey(),
        creator_counter: counter_pda,
        challenge: challenge_pda,
        vault: vault_pda,
        creator_usdc_account: Pubkey::default(),
        usdc_mint: Pubkey::default(),
        token_program: Pubkey::default(),
        system_program: system_program_id(),
    }
    .to_account_metas(None);

    let create_data = rektofun_ix::CreateChallenge { params }.data();

    send_ix(
        &mut svm,
        &admin,
        create_accounts,
        create_data,
        &[&creator, &admin],
    )
    .expect("create_challenge failed");

    // Verify challenge state
    let challenge_account: ChallengeAccount = svm
        .get_account(&challenge_pda)
        .and_then(|a| anchor_lang::AccountDeserialize::try_deserialize(&mut a.data.as_ref()).ok())
        .expect("Challenge account not found");

    assert_eq!(challenge_account.asset, "BTC");
    assert_eq!(challenge_account.bet_amount, 100_000_000);
    assert!(matches!(challenge_account.status, ChallengeStatus::Open));
    assert!(matches!(challenge_account.challenge_type, ChallengeType::Pvp));

    // ── accept_challenge (PVP — join_creator_side is ignored) ──
    let accept_accounts = rektofun_accounts::AcceptChallenge {
        challenger: challenger.pubkey(),
        creator: creator.pubkey(),
        challenge: challenge_pda,
        vault: vault_pda,
        challenger_usdc_account: Pubkey::default(),
        usdc_mint: Pubkey::default(),
        token_program: Pubkey::default(),
        system_program: system_program_id(),
        config: config_pda,
    }
    .to_account_metas(None);

    let accept_params = AcceptChallengeParams {
        join_creator_side: false, // ignored for PVP
        amount: 100_000_000,      // PVP must match or exceed the creator's stake
    };
    let accept_data = rektofun_ix::AcceptChallenge { params: accept_params }.data();

    send_ix(
        &mut svm,
        &challenger,
        accept_accounts,
        accept_data,
        &[&challenger],
    )
    .expect("accept_challenge failed");

    // Verify challenge is now Active
    let challenge_account: ChallengeAccount = svm
        .get_account(&challenge_pda)
        .and_then(|a| anchor_lang::AccountDeserialize::try_deserialize(&mut a.data.as_ref()).ok())
        .expect("Challenge account not found after accept");

    assert!(matches!(challenge_account.status, ChallengeStatus::Active));
    assert_eq!(challenge_account.challenger, challenger.pubkey());

    println!("✅ PVP create_challenge + accept_challenge passed");
}

#[test]
fn test_create_team_challenge_and_join() {
    let mut svm = LiteSVM::new();

    svm.add_program_from_file(
        rektofun_program::ID,
        "../../target/deploy/rektofun_program.so",
    )
    .expect("Failed to load program .so — run `anchor build` first");

    let creator = Keypair::new();
    let team_member = Keypair::new();
    let opponent = Keypair::new();
    let admin = admin_keypair();

    svm.airdrop(&creator.pubkey(), 10_000_000_000).unwrap();
    svm.airdrop(&team_member.pubkey(), 10_000_000_000).unwrap();
    svm.airdrop(&opponent.pubkey(), 10_000_000_000).unwrap();
    svm.airdrop(&admin.pubkey(), 10_000_000_000).unwrap();

    let config_pda = init_config(&mut svm, &admin);

    let (counter_pda, _) = find_counter(&creator.pubkey());
    let (challenge_pda, _) = find_challenge(&creator.pubkey(), 0);
    let (vault_pda, _) = find_vault(&challenge_pda);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // ── TEAM challenge ──
    let params = CreateChallengeParams {
        asset: "SOL".to_string(),
        bet_amount: 50_000_000,
        target_price_usd_cents: 20_000,
        direction_above: true,
        expires_at: now + 3600,
        resolves_at: now + 7200,
        challenge_type: ChallengeType::Team,
        max_team_size: 5, // max 5 per side
    };

    let create_accounts = rektofun_accounts::CreateChallenge {
        creator: creator.pubkey(),
        config: config_pda,
        fee_payer: admin.pubkey(),
        creator_counter: counter_pda,
        challenge: challenge_pda,
        vault: vault_pda,
        creator_usdc_account: Pubkey::default(),
        usdc_mint: Pubkey::default(),
        token_program: Pubkey::default(),
        system_program: system_program_id(),
    }
    .to_account_metas(None);

    send_ix(
        &mut svm,
        &admin,
        create_accounts,
        rektofun_ix::CreateChallenge { params }.data(),
        &[&creator, &admin],
    )
    .expect("create_challenge (TEAM) failed");

    // Verify TEAM challenge created
    let challenge_account: ChallengeAccount = svm
        .get_account(&challenge_pda)
        .and_then(|a| anchor_lang::AccountDeserialize::try_deserialize(&mut a.data.as_ref()).ok())
        .expect("TEAM Challenge account not found");

    assert!(matches!(challenge_account.challenge_type, ChallengeType::Team));
    assert!(matches!(challenge_account.status, ChallengeStatus::Open));
    assert_eq!(challenge_account.max_team_size, 5);

    // ── team_member joins creator's side ──
    let join_creator_accounts = rektofun_accounts::AcceptChallenge {
        challenger: team_member.pubkey(),
        creator: creator.pubkey(),
        challenge: challenge_pda,
        vault: vault_pda,
        challenger_usdc_account: Pubkey::default(),
        usdc_mint: Pubkey::default(),
        token_program: Pubkey::default(),
        system_program: system_program_id(),
        config: config_pda,
    }
    .to_account_metas(None);

    send_ix(
        &mut svm,
        &team_member,
        join_creator_accounts,
        rektofun_ix::AcceptChallenge {
            params: AcceptChallengeParams {
                join_creator_side: true,
                amount: 50_000_000, // TEAM must match until opponents cover the creator stake
            },
        }
        .data(),
        &[&team_member],
    )
    .expect("join creator side failed");

    // ── opponent joins opponent's side ──
    let join_opponent_accounts = rektofun_accounts::AcceptChallenge {
        challenger: opponent.pubkey(),
        creator: creator.pubkey(),
        challenge: challenge_pda,
        vault: vault_pda,
        challenger_usdc_account: Pubkey::default(),
        usdc_mint: Pubkey::default(),
        token_program: Pubkey::default(),
        system_program: system_program_id(),
        config: config_pda,
    }
    .to_account_metas(None);

    send_ix(
        &mut svm,
        &opponent,
        join_opponent_accounts,
        rektofun_ix::AcceptChallenge {
            params: AcceptChallengeParams {
                join_creator_side: false,
                amount: 60_000_000,
            },
        }
        .data(),
        &[&opponent],
    )
    .expect("join opponent side failed");

    // Verify teams populated; status still Open (TEAM stays Open until locked/settled)
    let challenge_account: ChallengeAccount = svm
        .get_account(&challenge_pda)
        .and_then(|a| anchor_lang::AccountDeserialize::try_deserialize(&mut a.data.as_ref()).ok())
        .expect("TEAM Challenge account not found after joins");

    assert!(matches!(challenge_account.status, ChallengeStatus::Open));
    assert_eq!(challenge_account.creator_team.len(), 1); // team_member
    assert_eq!(challenge_account.opponent_team.len(), 1); // opponent
    assert!(challenge_account.creator_team.contains(&team_member.pubkey()));
    assert!(challenge_account.opponent_team.contains(&opponent.pubkey()));

    println!("✅ TEAM create_challenge + join both sides passed");
}

#[test]
fn test_cancel_challenge() {
    let mut svm = LiteSVM::new();
    svm.add_program_from_file(
        rektofun_program::ID,
        "../../target/deploy/rektofun_program.so",
    )
    .expect("Failed to load program .so");

    let creator = Keypair::new();
    let admin = admin_keypair();
    svm.airdrop(&creator.pubkey(), 10_000_000_000).unwrap();
    svm.airdrop(&admin.pubkey(), 10_000_000_000).unwrap();

    let config_pda = init_config(&mut svm, &admin);

    let (counter_pda, _) = find_counter(&creator.pubkey());
    let (challenge_pda, _) = find_challenge(&creator.pubkey(), 0);
    let (vault_pda, _) = find_vault(&challenge_pda);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let params = CreateChallengeParams {
        asset: "SOL".to_string(),
        bet_amount: 50_000_000,
        target_price_usd_cents: 16_000,
        direction_above: false,
        expires_at: now + 3600,
        resolves_at: now + 7200,
        challenge_type: ChallengeType::Pvp,
        max_team_size: 0,
    };

    let create_accounts = rektofun_accounts::CreateChallenge {
        creator: creator.pubkey(),
        config: config_pda,
        fee_payer: admin.pubkey(),
        creator_counter: counter_pda,
        challenge: challenge_pda,
        vault: vault_pda,
        creator_usdc_account: Pubkey::default(),
        usdc_mint: Pubkey::default(),
        token_program: Pubkey::default(),
        system_program: system_program_id(),
    }
    .to_account_metas(None);

    send_ix(
        &mut svm,
        &admin,
        create_accounts,
        rektofun_ix::CreateChallenge { params }.data(),
        &[&creator, &admin],
    )
    .expect("create_challenge failed");

    let creator_balance_before = svm.get_balance(&creator.pubkey()).unwrap_or(0);
    let admin_balance_before = svm.get_balance(&admin.pubkey()).unwrap_or(0);

    let cancel_accounts = rektofun_accounts::CancelChallenge {
        creator: creator.pubkey(),
        challenge: challenge_pda,
        vault: vault_pda,
        creator_usdc_account: Pubkey::default(),
        usdc_mint: Pubkey::default(),
        rent_payer: admin.pubkey(),
        token_program: Pubkey::default(),
        system_program: system_program_id(),
    }
    .to_account_metas(None);

    send_ix(
        &mut svm,
        &creator,
        cancel_accounts,
        rektofun_ix::CancelChallenge {}.data(),
        &[&creator],
    )
    .expect("cancel_challenge failed");

    let creator_balance_after = svm.get_balance(&creator.pubkey()).unwrap_or(0);
    let admin_balance_after = svm.get_balance(&admin.pubkey()).unwrap_or(0);

    // The vault's reclaimed rent must go to admin (who originally paid it via
    // fee_payer in create_challenge) — not leak back to the creator. Creator
    // only pays the tiny network fee for this call, so their balance must not
    // increase.
    assert!(
        admin_balance_after > admin_balance_before,
        "Admin should have recovered the vault's rent on cancel"
    );
    assert!(
        creator_balance_after <= creator_balance_before,
        "Creator must not profit in SOL from cancelling (rent-farming exploit check)"
    );

    let challenge_account: ChallengeAccount = svm
        .get_account(&challenge_pda)
        .and_then(|a| anchor_lang::AccountDeserialize::try_deserialize(&mut a.data.as_ref()).ok())
        .expect("Challenge account not found after cancel");

    assert!(matches!(challenge_account.status, ChallengeStatus::Cancelled));

    println!("✅ cancel_challenge passed");
}
