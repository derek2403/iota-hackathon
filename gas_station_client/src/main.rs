use std::path::Path;

use iota_gas_station::rpc::client::GasStationRpcClient;
use iota_config::IOTA_CLIENT_CONFIG;
use iota_json_rpc_types::{IotaExecutionStatus, IotaTransactionBlockEffectsAPI};
use iota_sdk::{wallet_context::WalletContext, IotaClientBuilder};
use iota_types::{
    base_types::{IotaAddress, ObjectID, SequenceNumber}, 
    digests::ObjectDigest, 
    gas_coin::NANOS_PER_IOTA, 
    programmable_transaction_builder::ProgrammableTransactionBuilder, 
    transaction::{CallArg, ObjectArg, TransactionData, TransactionDataAPI}, 
    Identifier
};
use std::str::FromStr;
use std::env;


// This example demonstrates using the gas station to create a transaction
//  - Reserve gas from the gas station
//  - Create a transaction with the gas object reserved from the gas station
//  - Sign the transaction with the wallet
//  - Execute the transaction with the gas station

// Before you run this example make sure:
//  - GAS_STATION_AUTH env is set to the correct value
//  - the IOTA gas station is running, an its configured for the TESTNET
#[tokio::main]
async fn main() {

    unsafe {
        env::set_var("GAS_STATION_AUTH", "my-secret-bearer-token-123");
    }
    // Create a new gas station client
    let gas_station_url = "http://localhost:9527".to_string();
    let gas_station_client = GasStationRpcClient::new(gas_station_url);

    // Reserve the 1 IOTA for 10 seconds
    let (sponsor_account, reservation_id, gas_coins     ) = gas_station_client
        .reserve_gas(NANOS_PER_IOTA, 10)
        .await
        .expect("Failed to reserve gas");
    assert!(gas_coins.len() >= 1);

    // Create a new IOTA Client
    let iota_client = IotaClientBuilder::default().build_testnet().await.unwrap();

    // Load the config from default location (~./iota/iota_config/client.yaml)
    let config_path = format!(
        "{}/{}",
        iota_config::iota_config_dir().unwrap().to_str().unwrap(),
        IOTA_CLIENT_CONFIG
    );
    let mut wallet_context = WalletContext::new(&Path::new(&config_path), None, None).unwrap();

    let user = wallet_context.active_address().unwrap();

    let ref_gas_price = iota_client
        .governance_api()
        .get_reference_gas_price()
        .await
        .unwrap();

    // Build the TransactionData.
    // Set the gas object and gas-station sponsor account fetched from the gas station
    let mut tx_data = construct_tx("Music", user, gas_coins.clone(), ref_gas_price);
    tx_data.gas_data_mut().payment = gas_coins;
    tx_data.gas_data_mut().owner = sponsor_account;

    // Sign the TransactionData with the wallet.
    let transaction = wallet_context.sign_transaction(&tx_data);
    let signature = transaction.tx_signatures()[0].to_owned();

    // Send the TransactionData together with the signature to the Gas Station.
    // The Gas Station will execute the Transaction and returns the effects.
    let effects = gas_station_client
        .execute_tx(reservation_id, &tx_data, &signature, None, None)
        .await
        .expect("transaction should be sent");

    println!("Transaction effects: {:?}", effects);

    assert_eq!(effects.status(), &IotaExecutionStatus::Success);
}


fn construct_tx(content_type: &str, user: IotaAddress, gas_coin: Vec<(ObjectID, SequenceNumber, ObjectDigest)>, gas_price: u64) -> TransactionData {

    let pt = {
        let mut builder = ProgrammableTransactionBuilder::new();

        // Call the `free_trial` function of the `sponsored_transactions` package
        let package = ObjectID::from_str(
            "0x3ee3eba9d1c998d0865ccef4b804de81f625fd849ef56facb81c83b01a4f7e79",
        ).unwrap();
        let module = Identifier::from_str("sponsored_transactions").unwrap();
        let function = Identifier::from_str("free_trial").unwrap();

        // The content type is passed as a parameter to the `free_trial` function. options are "Music", "News" or "Movies"
        let content_type_arg = CallArg::Pure(bcs::to_bytes(content_type).unwrap());

        // This is the SubscriptionManager object that is used to manage subscriptions, it is a shared object.
        let object_arg = ObjectArg::SharedObject {
            id: ObjectID::from_str(
                "0x93787c06852cf95dba1ade7fe0d29183bf457109956428de5535b6e9045e1bc5",
            ).unwrap(),
            initial_shared_version: 265499833.into(),
            mutable: true,
        };
        let manager_object = CallArg::Object(object_arg);
        builder
            .move_call(
                package,
                module,
                function,
                vec![],
                vec![content_type_arg, manager_object],
            )
            .unwrap();
        builder.finish()
    };



    let tx_kind = TransactionData::new_programmable(user, gas_coin, pt, 10000000, gas_price);
    tx_kind

}