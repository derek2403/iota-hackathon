// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use clap::*;
use iota_config::Config;
use iota_gas_station::benchmarks::kms_stress::run_kms_stress_test;
use iota_gas_station::benchmarks::BenchmarkMode;
use iota_gas_station::config::{GasStationConfig, GasStationStorageConfig, TxSignerConfig};
use iota_gas_station::rpc::client::GasStationRpcClient;
use iota_sdk::{IOTA_DEVNET_URL, IOTA_MAINNET_URL, IOTA_TESTNET_URL};
use iota_types::base_types::IotaAddress;
use iota_types::crypto::{get_account_key_pair, EncodeDecodeBase64, IotaKeyPair};
use std::path::PathBuf;
use std::str::FromStr;

#[derive(Parser)]
#[command(
    name = "iota-gas-station-tool",
    about = "Iota Gas Station Command Line Tools",
    rename_all = "kebab-case"
)]
pub enum ToolCommand {
    /// Running benchmark. This will continue reserving gas coins on the gas station for some
    /// seconds, which would automatically expire latter.
    #[clap(name = "benchmark")]
    Benchmark {
        #[arg(long, help = "Full URL to the gas station RPC server")]
        gas_station_url: String,
        #[arg(
            long,
            help = "Average duration for each reservation, in number of seconds.",
            default_value_t = 20
        )]
        reserve_duration_sec: u64,
        #[arg(
            long,
            help = "Number of clients to spawn to send requests to servers.",
            default_value_t = 100
        )]
        num_clients: u64,
        #[arg(long, help = "Benchmark mode.", default_value = "reserve-only")]
        benchmark_mode: BenchmarkMode,
    },
    #[clap(name = "stress-kms")]
    StressKMS {
        #[arg(long, help = "Full URL to the KMS signer")]
        kms_url: String,
        #[arg(
            long,
            default_value_t = 300,
            help = "Number of tasks to spawn to send requests to servers."
        )]
        num_tasks: usize,
    },
    /// Generate a sample config file and put it in the specified path.
    #[clap(name = "generate-sample-config")]
    GenerateSampleConfig {
        #[arg(long, help = "Path to config file")]
        config_path: PathBuf,
        #[arg(long, help = "Whether to use a sidecar service to sign transactions")]
        with_sidecar_signer: bool,
        #[arg(long, help = "Configuration for docker compose")]
        docker_compose: bool,
        #[arg(long, short, help = "Overwrite the existing config file")]
        force: bool,
        #[arg(
            long,
            short,
            help = "Type of network to use",
            value_enum,
            default_value = "testnet"
        )]
        network: Network,
        #[arg(long, help = "Custom gas station address (optional)")]
        gas_station_address: Option<String>,
    },
    /// Converts the Bech32 key to Base64 encoded
    #[clap(name = "convert-key")]
    ConvertKeyConfig {
        #[arg(long, short, help = "bech32 encoded key i.e. iotaprivkey...")]
        key: String,
    },
    #[clap(name = "cli")]
    CLI {
        #[clap(subcommand)]
        cli_command: CliCommand,
    },
}

#[derive(Subcommand)]
pub enum CliCommand {
    /// A simple health check to see if the server is up and running.
    CheckStationHealth {
        #[clap(long, help = "Full URL of the station RPC server")]
        station_rpc_url: String,
    },
    /// A more complete version of health check, which includes checking the bearer secret,
    /// storage layer and sidecar signer.
    CheckStationEndToEndHealth {
        #[clap(long, help = "Full URL of the station RPC server")]
        station_rpc_url: String,
    },
    GetStationVersion {
        #[clap(long, help = "Full URL of the station RPC server")]
        station_rpc_url: String,
    },
}

impl ToolCommand {
    pub async fn execute(self) {
        match self {
            ToolCommand::Benchmark {
                gas_station_url,
                reserve_duration_sec,
                num_clients,
                benchmark_mode,
            } => {
                assert!(
                    cfg!(not(debug_assertions)),
                    "Benchmark should only run in release build"
                );
                benchmark_mode
                    .run_benchmark(gas_station_url, reserve_duration_sec, num_clients)
                    .await
            }
            ToolCommand::StressKMS { kms_url, num_tasks } => {
                run_kms_stress_test(kms_url, num_tasks).await;
            }
            ToolCommand::GenerateSampleConfig {
                config_path,
                with_sidecar_signer,
                docker_compose,
                force,
                network,
                gas_station_address,
            } => {
                let mut new_iota_address: Option<IotaAddress> = None;
                let signer_config = if with_sidecar_signer {
                    TxSignerConfig::Sidecar {
                        sidecar_url: "http://localhost:3000".to_string(),
                    }
                } else {
                    let (iota_address, keypair) = get_account_key_pair();
                    new_iota_address = Some(iota_address);
                    TxSignerConfig::Local {
                        keypair: keypair.into(),
                    }
                };
                let redis_url = if docker_compose {
                    "redis://redis:6379".to_string()
                } else {
                    "redis://127.0.0.1".to_string()
                };

                let fullnode_url = get_fullnode_url(network, docker_compose).to_owned();

                // Parse custom gas station address if provided
                let custom_gas_station_address = if let Some(addr_str) = gas_station_address {
                    match IotaAddress::from_str(&addr_str) {
                        Ok(address) => Some(address),
                        Err(e) => {
                            eprintln!("Invalid gas station address '{}': {}", addr_str, e);
                            std::process::exit(1);
                        }
                    }
                } else {
                    None
                };

                let config = GasStationConfig {
                    signer_config,
                    storage_config: GasStationStorageConfig::Redis { redis_url },
                    fullnode_url,
                    gas_station_address: custom_gas_station_address,
                    ..Default::default()
                };
                if config_path.exists() && !force {
                    eprintln!("Config file already exists. Use --force (-f) to overwrite.");
                    std::process::exit(1);
                }
                if let Some(iota_address) = new_iota_address {
                    println!(
                        "Generated a new IOTA address. If you plan to use it, please make sure it has enough funds: '{}'",
                        iota_address
                    );
                }
                if let Some(custom_address) = custom_gas_station_address {
                    println!(
                        "Gas Station will use custom address: '{}'",
                        custom_address
                    );
                }
                config.save(config_path).unwrap();
            }
            ToolCommand::CLI { cli_command } => match cli_command {
                CliCommand::CheckStationHealth { station_rpc_url } => {
                    let station_client = GasStationRpcClient::new(station_rpc_url);
                    station_client.health().await.unwrap();
                    println!("Station server is healthy");
                }
                CliCommand::CheckStationEndToEndHealth { station_rpc_url } => {
                    let station_client = GasStationRpcClient::new(station_rpc_url);
                    match station_client.debug_health_check().await {
                        Err(e) => {
                            eprintln!("Station server is not healthy: {}", e);
                            std::process::exit(1);
                        }
                        Ok(_) => {
                            println!("Station server is healthy");
                        }
                    }
                }
                CliCommand::GetStationVersion { station_rpc_url } => {
                    let station_client = GasStationRpcClient::new(station_rpc_url);
                    let version = station_client.version().await.unwrap();
                    println!("Station server version: {}", version);
                }
            },
            ToolCommand::ConvertKeyConfig { key } => {
                let key = IotaKeyPair::decode(&key).unwrap();
                println!("{}", key.encode_base64());
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum, Default)]
pub enum Network {
    Local,
    Devnet,
    #[default]
    Testnet,
    Mainnet,
}

fn get_fullnode_url(network: Network, is_docker_compose: bool) -> &'static str {
    match network {
        Network::Local => {
            if is_docker_compose {
                "http://host.docker.internal:9000"
            } else {
                "http://localhost:9000"
            }
        }
        Network::Devnet => IOTA_DEVNET_URL,
        Network::Testnet => IOTA_TESTNET_URL,
        Network::Mainnet => IOTA_MAINNET_URL,
    }
}

#[tokio::main]
async fn main() {
    let command = ToolCommand::parse();
    command.execute().await;
}
