/// University Attendance System Backend
/// Processes verified attendance events (NFC + Face Recognition) and manages token issuance
/// Only this contract can mint tokens - students cannot mint directly
module clt_tutorial::attendance_system {
    use iota::coin::TreasuryCap;
    use iota::token::{TokenPolicy, TokenPolicyCap, Token};
    use iota::tx_context::{Self, TxContext};
    use iota::object::{Self, UID};
    use clt_tutorial::attendance_token::{Self, ATTENDANCE_TOKEN};
    use clt_tutorial::university_rule;

    // Error codes
    const ENotAuthorized: u64 = 1;
    const EInvalidAttendance: u64 = 2;
    const EAlreadyRecorded: u64 = 3;
    const EInsufficientTokens: u64 = 4;
    const ESystemPaused: u64 = 5;

    /// Attendance verification data
    public struct AttendanceProof has store, drop, copy {
        student_id: address,
        nfc_hash: vector<u8>,      // Hash of NFC scan data
        face_hash: vector<u8>,     // Hash of facial recognition data
        location: vector<u8>,      // Campus/classroom location
        timestamp: u64,
        course_id: vector<u8>,
    }

    /// System configuration and state
    public struct AttendanceSystem has key {
        id: UID,
        treasury_cap: TreasuryCap<ATTENDANCE_TOKEN>,
        policy_cap: TokenPolicyCap<ATTENDANCE_TOKEN>,
        admin: address,
        authorized_verifiers: vector<address>,
        daily_attendance: iota::table::Table<address, u64>,
        tokens_per_attendance: u64,
        max_tokens_per_day: u64,
        system_paused: bool,
        total_attendances_recorded: u64,
        total_tokens_issued: u64,
    }
}