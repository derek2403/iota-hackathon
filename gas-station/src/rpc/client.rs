// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use crate::read_auth_env;
use crate::rpc::rpc_types::{
    ExecuteTransactionRequestType, ExecuteTxRequest, ExecuteTxResponse, ReserveGasRequest,
    ReserveGasResponse,
};
use crate::types::ReservationID;
use anyhow::bail;
use fastcrypto::encoding::Base64;
use iota_json_rpc_types::IotaTransactionBlockEffects;
use iota_types::base_types::{IotaAddress, ObjectRef};
use iota_types::signature::GenericSignature;
use iota_types::transaction::TransactionData;
use reqwest::header::{HeaderMap, AUTHORIZATION};
use reqwest::Client;

#[derive(Clone)]
pub struct GasStationRpcClient {
    client: Client,
    server_address: String,
}

impl GasStationRpcClient {
    pub fn new(server_address: String) -> Self {
        let client = Client::new();
        Self {
            client,
            server_address,
        }
    }

    pub async fn health(&self) -> anyhow::Result<()> {
        let response = self
            .client
            .get(format!("{}/", self.server_address))
            .send()
            .await?;
        if !response.status().is_success() {
            bail!("Health check failed: {:?}", response);
        }
        let text = response.text().await?;
        if text.as_str() == "OK" {
            Ok(())
        } else {
            bail!("Health check failed: {}", text);
        }
    }

    pub async fn version(&self) -> Result<String, reqwest::Error> {
        self.client
            .get(format!("{}/version", self.server_address))
            .send()
            .await?
            .text()
            .await
    }

    pub async fn debug_health_check(&self) -> anyhow::Result<()> {
        let mut headers = HeaderMap::new();
        if let Some(auth) = read_auth_env() {
            headers.insert(AUTHORIZATION, format!("Bearer {}", auth).parse().unwrap());
        }
        let response = self
            .client
            .post(format!("{}/debug_health_check", self.server_address))
            .headers(headers)
            .send()
            .await?;
        if !response.status().is_success() {
            bail!("Health check failed: {:?}", response);
        };
        let text = response.text().await?;
        if text.as_str() == "OK" {
            Ok(())
        } else {
            bail!("Health check failed: {}", text);
        }
    }

    pub async fn reserve_gas(
        &self,
        gas_budget: u64,
        reserve_duration_secs: u64,
    ) -> anyhow::Result<(IotaAddress, ReservationID, Vec<ObjectRef>)> {
        let request = ReserveGasRequest {
            gas_budget,
            reserve_duration_secs,
        };
        let mut headers = HeaderMap::new();
        if let Some(auth) = read_auth_env() {
            headers.insert(AUTHORIZATION, format!("Bearer {}", auth).parse().unwrap());
        }
        let response = self
            .client
            .post(format!("{}/v1/reserve_gas", self.server_address))
            .headers(headers)
            .json(&request)
            .send()
            .await?
            .json::<ReserveGasResponse>()
            .await?;
        response
            .result
            .ok_or_else(|| {
                anyhow::anyhow!(response
                    .error
                    .unwrap_or_else(|| "Unknown error".to_string()))
            })
            .map(|result| {
                (
                    result.sponsor_address,
                    result.reservation_id,
                    result
                        .gas_coins
                        .into_iter()
                        .map(|c| c.to_object_ref())
                        .collect(),
                )
            })
    }

    pub async fn execute_tx(
        &self,
        reservation_id: ReservationID,
        tx_data: &TransactionData,
        user_sig: &GenericSignature,
        request_type: Option<ExecuteTransactionRequestType>,
        headers: Option<HeaderMap>,
    ) -> anyhow::Result<IotaTransactionBlockEffects> {
        let mut headers = headers.unwrap_or_default();
        if let Some(auth) = read_auth_env() {
            headers.insert(AUTHORIZATION, format!("Bearer {}", auth).parse().unwrap());
        }
        let request = ExecuteTxRequest {
            reservation_id,
            tx_bytes: Base64::from_bytes(&bcs::to_bytes(&tx_data).unwrap()),
            user_sig: Base64::from_bytes(user_sig.as_ref()),
            request_type,
        };
        let response = self
            .client
            .post(format!("{}/v1/execute_tx", self.server_address))
            .headers(headers)
            .json(&request)
            .send()
            .await?
            .json::<ExecuteTxResponse>()
            .await?;
        response.effects.ok_or_else(|| {
            anyhow::anyhow!(response
                .error
                .unwrap_or_else(|| "Unknown error".to_string()))
        })
    }

    pub async fn reload_access_controller(&self) -> anyhow::Result<()> {
        let mut headers = HeaderMap::new();
        if let Some(auth) = read_auth_env() {
            headers.insert(AUTHORIZATION, format!("Bearer {}", auth).parse().unwrap());
        }
        let response = self
            .client
            .get(format!(
                "{}/v1/reload_access_controller",
                self.server_address
            ))
            .headers(headers)
            .send()
            .await?;
        if !response.status().is_success() {
            bail!("Reload access controller failed: {:?}", response);
        };
        Ok(())
    }
}
