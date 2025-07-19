// Copyright 2020-2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Ed25519KeypairSigner } from "@iota/iota-interaction-ts/node/test_utils/index.js";
import { IotaClient } from "@iota/iota-sdk/client";
import { getFaucetHost, requestIotaFromFaucetV0 } from "@iota/iota-sdk/faucet";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { NotarizationClient, NotarizationClientReadOnly } from "@iota/notarization/node/index.js";

export const IOTA_NOTARIZATION_PKG_ID = globalThis?.process?.env?.IOTA_NOTARIZATION_PKG_ID || "";
export const NETWORK_NAME_FAUCET = globalThis?.process?.env?.NETWORK_NAME_FAUCET || "testnet";
export const NETWORK_URL = globalThis?.process?.env?.NETWORK_URL || "https://api.testnet.iota.cafe";

export const TEST_GAS_BUDGET = BigInt(50_000_000);

export async function requestFunds(address) {
    await requestIotaFromFaucetV0({
        host: getFaucetHost(NETWORK_NAME_FAUCET),
        recipient: address,
    });
}

export async function getFundedClient() {
    const iotaClient = new IotaClient({ url: NETWORK_URL });

    let notarizationClientReadOnly;
    
    if (IOTA_NOTARIZATION_PKG_ID) {
        // For local networks with custom package ID
        notarizationClientReadOnly = await NotarizationClientReadOnly.createWithPkgId(
            iotaClient,
            IOTA_NOTARIZATION_PKG_ID,
        );
    } else {
        // For testnet - use the default notarization package
        notarizationClientReadOnly = await NotarizationClientReadOnly.create(iotaClient);
    }

    // generate new key
    const keypair = Ed25519Keypair.generate();

    // create signer
    let signer = new Ed25519KeypairSigner(keypair);
    const notarizationClient = await NotarizationClient.create(notarizationClientReadOnly, signer);

    await requestFunds(notarizationClient.senderAddress());

    const balance = await iotaClient.getBalance({ owner: notarizationClient.senderAddress() });
    if (balance.totalBalance === "0") {
        throw new Error("Balance is still 0");
    } else {
        console.log(
            `Received gas from faucet: ${balance.totalBalance} for owner ${notarizationClient.senderAddress()}`,
        );
    }

    return notarizationClient;
}
