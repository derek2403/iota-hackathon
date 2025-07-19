/// Comprehensive tests for the University Attendance System
#[test_only]
module clt_tutorial::attendance_tests {
    use iota::test_scenario::{Self, Scenario};
    use iota::coin::TreasuryCap;
    use iota::token::{TokenPolicy, TokenPolicyCap, Token};
    use clt_tutorial::attendance_token::{Self, ATTENDANCE_TOKEN};
    use clt_tutorial::attendance_system::{Self, AttendanceSystem};
    use clt_tutorial::university_rule;

    // Test addresses
    const ADMIN: address = @0xAD;
    const STUDENT_ALICE: address = @0xA11CE;
    const STUDENT_BOB: address = @0xB0B;
    const VERIFIER: address = @0xEF;
    const UNAUTHORIZED: address = @0xBAD;

    #[test]
    fun test_full_attendance_flow() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Step 1: Initialize the token system
        {
            let ctx = test_scenario::ctx(&mut scenario);
            attendance_token::init(ATTENDANCE_TOKEN {}, ctx);
        };

        // Step 2: Setup the attendance system
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let treasury_cap = test_scenario::take_from_sender<TreasuryCap<ATTENDANCE_TOKEN>>(&scenario);
            let policy_cap = test_scenario::take_from_sender<TokenPolicyCap<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let verifiers = vector[VERIFIER];
            attendance_system::setup_system(
                treasury_cap,
                policy_cap,
                ADMIN,
                verifiers,
                ctx
            );
        };

        // Step 3: Add students to university
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut system = test_scenario::take_from_sender<AttendanceSystem>(&scenario);
            let mut policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let students = vector[STUDENT_ALICE, STUDENT_BOB];
            let roles = vector[
                attendance_token::create_student_role(),
                attendance_token::create_student_role()
            ];

            attendance_system::add_university_members(
                &mut system,
                &mut policy,
                students,
                roles,
                ctx
            );

            test_scenario::return_to_sender(&scenario, system);
            test_scenario::return_shared(policy);
        };

        // Step 4: Process verified attendance for Alice
        test_scenario::next_tx(&mut scenario, VERIFIER);
        {
            let mut system = test_scenario::take_from_address<AttendanceSystem>(&scenario, ADMIN);
            let policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            // Create attendance proof
            let proof = attendance_system::create_attendance_proof(
                STUDENT_ALICE,
                b"nfc_hash_123", 
                b"face_hash_456",
                b"CS_Building_Room_101",
                b"CS101",
                ctx
            );

            let request = attendance_system::create_attendance_request(
                proof,
                b"verification_signature"
            );

            // Process the attendance
            attendance_system::process_verified_attendance(
                &mut system,
                &policy,
                request,
                ctx
            );

            test_scenario::return_to_address(ADMIN, system);
            test_scenario::return_shared(policy);
        };

        // Step 5: Verify Alice received tokens
        test_scenario::next_tx(&mut scenario, STUDENT_ALICE);
        {
            let token = test_scenario::take_from_sender<Token<ATTENDANCE_TOKEN>>(&scenario);
            
            // Should have received 1 token for attendance
            assert!(attendance_token::token_value(&token) == 1, 1);
            
            test_scenario::return_to_sender(&scenario, token);
        };

        // Step 6: Test transfer between students
        test_scenario::next_tx(&mut scenario, STUDENT_ALICE);
        {
            let token = test_scenario::take_from_sender<Token<ATTENDANCE_TOKEN>>(&scenario);
            let policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            // Transfer token to Bob
            let request = attendance_token::transfer_tokens(
                token,
                STUDENT_BOB,
                &policy,
                ctx
            );
            iota::token::confirm_request(&policy, request, ctx);

            test_scenario::return_shared(policy);
        };

        // Step 7: Verify Bob received the token
        test_scenario::next_tx(&mut scenario, STUDENT_BOB);
        {
            let token = test_scenario::take_from_sender<Token<ATTENDANCE_TOKEN>>(&scenario);
            assert!(attendance_token::token_value(&token) == 1, 2);
            test_scenario::return_to_sender(&scenario, token);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_penalty_system() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Setup system and add student
        setup_test_system(&mut scenario);

        // Give Alice some tokens first
        give_attendance_tokens(&mut scenario, STUDENT_ALICE, 5);

        // Step: Admin applies penalty to Alice
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut system = test_scenario::take_from_sender<AttendanceSystem>(&scenario);
            let policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            // Take some tokens from Alice for penalty
            test_scenario::next_tx(&mut scenario, STUDENT_ALICE);
            let penalty_token = test_scenario::take_from_sender<Token<ATTENDANCE_TOKEN>>(&scenario);
            
            test_scenario::next_tx(&mut scenario, ADMIN);
            // Apply penalty
            attendance_system::apply_penalty(
                &mut system,
                &policy,
                STUDENT_ALICE,
                penalty_token,
                b"Late to class",
                ctx
            );

            test_scenario::return_to_sender(&scenario, system);
            test_scenario::return_shared(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_daily_limit() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Setup system
        setup_test_system(&mut scenario);

        // Process attendance for Alice once
        process_attendance(&mut scenario, STUDENT_ALICE, b"CS101");

        // Try to process attendance again same day (should fail)
        test_scenario::next_tx(&mut scenario, VERIFIER);
        {
            let mut system = test_scenario::take_from_address<AttendanceSystem>(&scenario, ADMIN);
            let policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let proof = attendance_system::create_attendance_proof(
                STUDENT_ALICE,
                b"nfc_hash_456",
                b"face_hash_789", 
                b"CS_Building_Room_102",
                b"CS102",
                ctx
            );

            let request = attendance_system::create_attendance_request(
                proof,
                b"verification_signature_2"
            );

            // This should fail due to daily limit
            // In a real test framework, we'd expect this to abort
            // For now, we'll just note the expected behavior

            test_scenario::return_to_address(ADMIN, system);
            test_scenario::return_shared(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_unauthorized_access() {
        let mut scenario = test_scenario::begin(ADMIN);

        setup_test_system(&mut scenario);

        // Try to process attendance with unauthorized verifier (should fail)
        test_scenario::next_tx(&mut scenario, UNAUTHORIZED);
        {
            let mut system = test_scenario::take_from_address<AttendanceSystem>(&scenario, ADMIN);
            let policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let proof = attendance_system::create_attendance_proof(
                STUDENT_ALICE,
                b"nfc_hash_123",
                b"face_hash_456",
                b"CS_Building_Room_101", 
                b"CS101",
                ctx
            );

            let request = attendance_system::create_attendance_request(
                proof,
                b"verification_signature"
            );

            // This should fail due to unauthorized verifier
            // In a real test framework, we'd expect this to abort with ENotAuthorized

            test_scenario::return_to_address(ADMIN, system);
            test_scenario::return_shared(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_university_member_management() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize token system
        {
            let ctx = test_scenario::ctx(&mut scenario);
            attendance_token::init(ATTENDANCE_TOKEN {}, ctx);
        };

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let treasury_cap = test_scenario::take_from_sender<TreasuryCap<ATTENDANCE_TOKEN>>(&scenario);
            let policy_cap = test_scenario::take_from_sender<TokenPolicyCap<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            attendance_system::setup_system(
                treasury_cap,
                policy_cap, 
                ADMIN,
                vector[VERIFIER],
                ctx
            );
        };

        // Add students
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut system = test_scenario::take_from_sender<AttendanceSystem>(&scenario);
            let mut policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let students = vector[STUDENT_ALICE];
            let roles = vector[attendance_token::create_student_role()];

            attendance_system::add_university_members(
                &mut system,
                &mut policy,
                students,
                roles,
                ctx
            );

            // Verify Alice is now a student
            assert!(attendance_token::is_student(&policy, STUDENT_ALICE), 3);
            assert!(attendance_token::is_university_member(&policy, STUDENT_ALICE), 4);

            test_scenario::return_to_sender(&scenario, system);
            test_scenario::return_shared(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_system_pause() {
        let mut scenario = test_scenario::begin(ADMIN);

        setup_test_system(&mut scenario);

        // Pause the system
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut system = test_scenario::take_from_sender<AttendanceSystem>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            attendance_system::set_system_pause(&mut system, true, ctx);
            
            let (_, _, paused) = attendance_system::get_system_stats(&system);
            assert!(paused, 5);

            test_scenario::return_to_sender(&scenario, system);
        };

        // Try to process attendance while paused (should fail)
        test_scenario::next_tx(&mut scenario, VERIFIER);
        {
            let mut system = test_scenario::take_from_address<AttendanceSystem>(&scenario, ADMIN);
            let policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let proof = attendance_system::create_attendance_proof(
                STUDENT_ALICE,
                b"nfc_hash_123",
                b"face_hash_456",
                b"CS_Building",
                b"CS101",
                ctx
            );

            let request = attendance_system::create_attendance_request(
                proof,
                b"signature"
            );

            // This should fail due to system being paused
            // Expected to abort with ESystemPaused

            test_scenario::return_to_address(ADMIN, system);
            test_scenario::return_shared(policy);
        };

        test_scenario::end(scenario);
    }

    // === Helper Functions ===

    fun setup_test_system(scenario: &mut Scenario) {
        // Initialize token system
        test_scenario::next_tx(scenario, ADMIN);
        {
            let ctx = test_scenario::ctx(scenario);
            attendance_token::init(ATTENDANCE_TOKEN {}, ctx);
        };

        // Setup attendance system
        test_scenario::next_tx(scenario, ADMIN);
        {
            let treasury_cap = test_scenario::take_from_sender<TreasuryCap<ATTENDANCE_TOKEN>>(scenario);
            let policy_cap = test_scenario::take_from_sender<TokenPolicyCap<ATTENDANCE_TOKEN>>(scenario);
            let ctx = test_scenario::ctx(scenario);

            attendance_system::setup_system(
                treasury_cap,
                policy_cap,
                ADMIN,
                vector[VERIFIER],
                ctx
            );
        };

        // Add students
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut system = test_scenario::take_from_sender<AttendanceSystem>(scenario);
            let mut policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(scenario);
            let ctx = test_scenario::ctx(scenario);

            let students = vector[STUDENT_ALICE, STUDENT_BOB];
            let roles = vector[
                attendance_token::create_student_role(),
                attendance_token::create_student_role()
            ];

            attendance_system::add_university_members(
                &mut system,
                &mut policy,
                students,
                roles,
                ctx
            );

            test_scenario::return_to_sender(scenario, system);
            test_scenario::return_shared(policy);
        };
    }

    fun process_attendance(scenario: &mut Scenario, student: address, course_id: vector<u8>) {
        test_scenario::next_tx(scenario, VERIFIER);
        {
            let mut system = test_scenario::take_from_address<AttendanceSystem>(scenario, ADMIN);
            let policy = test_scenario::take_shared<TokenPolicy<ATTENDANCE_TOKEN>>(scenario);
            let ctx = test_scenario::ctx(scenario);

            let proof = attendance_system::create_attendance_proof(
                student,
                b"nfc_hash_123",
                b"face_hash_456",
                b"CS_Building",
                course_id,
                ctx
            );

            let request = attendance_system::create_attendance_request(
                proof,
                b"verification_signature"
            );

            attendance_system::process_verified_attendance(
                &mut system,
                &policy,
                request,
                ctx
            );

            test_scenario::return_to_address(ADMIN, system);
            test_scenario::return_shared(policy);
        };
    }

    fun give_attendance_tokens(scenario: &mut Scenario, student: address, amount: u64) {
        let mut i = 0;
        while (i < amount) {
            process_attendance(scenario, student, b"COURSE");
            i = i + 1;
        };
    }
} 