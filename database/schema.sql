-- ==============================================================================
-- ATLAS+MONITORING: Relational MySQL Database Schema & Seed Data
-- Explainable Clinical Trial Intelligence & Continuous 12-Cut Surveillance
-- Protocol: Study ABC-101 | Phase II Hepatoprotective Evaluation
-- Standard Compliance: CDISC SDTM (DM, LB, AE, CM, EX, SV) & 21 CFR Part 11
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS atlas_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE atlas_monitoring;

-- ------------------------------------------------------------------------------
-- 1. STUDIES TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS decision_traces;
DROP TABLE IF EXISTS human_escalations;
DROP TABLE IF EXISTS data_queries;
DROP TABLE IF EXISTS findings;
DROP TABLE IF EXISTS adverse_events;
DROP TABLE IF EXISTS doses;
DROP TABLE IF EXISTS lab_results;
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS medical_histories;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS sites;
DROP TABLE IF EXISTS protocols;
DROP TABLE IF EXISTS studies;

CREATE TABLE studies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_id VARCHAR(64) NOT NULL UNIQUE,
    protocol_name VARCHAR(255) NOT NULL,
    phase VARCHAR(32) NOT NULL DEFAULT 'Phase II',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    current_cut INT NOT NULL DEFAULT 8,
    total_cuts INT NOT NULL DEFAULT 12,
    current_protocol_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 2. PROTOCOLS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE protocols (
    id INT AUTO_INCREMENT PRIMARY KEY,
    protocol_id VARCHAR(64) NOT NULL,
    version VARCHAR(32) NOT NULL,
    effective_date VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sha256_hash VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_protocol_id (protocol_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 3. SITES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    pi_name VARCHAR(255) NOT NULL,
    country VARCHAR(64) NOT NULL DEFAULT 'United States',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    INDEX idx_site_id (site_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 4. SUBJECTS TABLE (CDISC SDTM DM - Demographics)
-- ------------------------------------------------------------------------------
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL UNIQUE,
    site_id VARCHAR(64) NOT NULL,
    age INT NOT NULL,
    sex VARCHAR(16) NOT NULL,
    race VARCHAR(64) DEFAULT 'White',
    arm VARCHAR(128) DEFAULT 'Experimental 50mg',
    status VARCHAR(32) NOT NULL DEFAULT 'Active',
    enrollment_date VARCHAR(32) NOT NULL,
    first_dose_date VARCHAR(32),
    primary_treatment VARCHAR(128) NOT NULL DEFAULT 'Drug A',
    treatment_status VARCHAR(32) DEFAULT 'Ongoing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
    INDEX idx_usubjid (usubjid),
    INDEX idx_site (site_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 5. MEDICAL HISTORIES TABLE (CDISC SDTM MH)
-- ------------------------------------------------------------------------------
CREATE TABLE medical_histories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    condition_name VARCHAR(255) NOT NULL,
    start_date VARCHAR(32) NOT NULL,
    status VARCHAR(64) DEFAULT 'Ongoing',
    evidence_ref VARCHAR(128),
    FOREIGN KEY (usubjid) REFERENCES subjects(usubjid) ON DELETE CASCADE,
    INDEX idx_mh_subj (usubjid),
    INDEX idx_condition (condition_name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 6. MEDICATIONS TABLE (CDISC SDTM CM - Concomitant Medications)
-- ------------------------------------------------------------------------------
CREATE TABLE medications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dose VARCHAR(64) DEFAULT '50 mg',
    route VARCHAR(64) DEFAULT 'Oral',
    frequency VARCHAR(64) DEFAULT 'Once daily',
    start_date VARCHAR(32) NOT NULL,
    end_date VARCHAR(32),
    status VARCHAR(64) DEFAULT 'Ongoing',
    evidence_ref VARCHAR(128),
    FOREIGN KEY (usubjid) REFERENCES subjects(usubjid) ON DELETE CASCADE,
    INDEX idx_med_subj (usubjid),
    INDEX idx_med_name (medication_name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 7. VISITS TABLE (CDISC SDTM SV - Subject Visits)
-- ------------------------------------------------------------------------------
CREATE TABLE visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    target_day INT NOT NULL,
    actual_day INT NOT NULL,
    visit_date VARCHAR(32) NOT NULL,
    status VARCHAR(64) DEFAULT 'Completed',
    window_deviation_days INT DEFAULT 0,
    evidence_ref VARCHAR(128),
    FOREIGN KEY (usubjid) REFERENCES subjects(usubjid) ON DELETE CASCADE,
    INDEX idx_vis_subj (usubjid)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 8. LAB RESULTS TABLE (CDISC SDTM LB - Laboratory Test Results)
-- ------------------------------------------------------------------------------
CREATE TABLE lab_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    test_code VARCHAR(32) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    raw_value VARCHAR(64) NOT NULL,
    numeric_value FLOAT,
    unit VARCHAR(64) NOT NULL,
    standard_unit VARCHAR(64) NOT NULL,
    converted_value FLOAT,
    uln FLOAT,
    reference_range VARCHAR(64),
    status VARCHAR(32) DEFAULT 'NORMAL',
    is_censored BOOLEAN DEFAULT FALSE,
    operator_str VARCHAR(8) DEFAULT '=',
    visit VARCHAR(128) NOT NULL,
    collection_date VARCHAR(32) NOT NULL,
    evidence_ref VARCHAR(128),
    FOREIGN KEY (usubjid) REFERENCES subjects(usubjid) ON DELETE CASCADE,
    INDEX idx_lb_subj (usubjid),
    INDEX idx_lb_test (test_code),
    INDEX idx_lb_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 9. DOSES TABLE (CDISC SDTM EX - Exposure)
-- ------------------------------------------------------------------------------
CREATE TABLE doses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    visit VARCHAR(128) NOT NULL,
    planned_dose FLOAT NOT NULL,
    actual_dose FLOAT NOT NULL,
    unit VARCHAR(32) DEFAULT 'mg',
    dose_date VARCHAR(32) NOT NULL,
    status VARCHAR(64) DEFAULT 'Administered',
    is_deviation BOOLEAN DEFAULT FALSE,
    evidence_ref VARCHAR(128),
    FOREIGN KEY (usubjid) REFERENCES subjects(usubjid) ON DELETE CASCADE,
    INDEX idx_ex_subj (usubjid)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 10. ADVERSE EVENTS TABLE (CDISC SDTM AE - Adverse Events)
-- ------------------------------------------------------------------------------
CREATE TABLE adverse_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    term VARCHAR(255) NOT NULL,
    severity VARCHAR(32) DEFAULT 'Moderate',
    is_serious BOOLEAN DEFAULT FALSE,
    hospitalized BOOLEAN DEFAULT FALSE,
    relationship VARCHAR(64) DEFAULT 'Possible',
    start_date VARCHAR(32) NOT NULL,
    end_date VARCHAR(32),
    status VARCHAR(64) DEFAULT 'Ongoing',
    evidence_ref VARCHAR(128),
    FOREIGN KEY (usubjid) REFERENCES subjects(usubjid) ON DELETE CASCADE,
    INDEX idx_ae_subj (usubjid),
    INDEX idx_ae_term (term)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 11. CLINICAL FINDINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE findings (
    id VARCHAR(64) PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    site_id VARCHAR(64) DEFAULT 'SITE-101',
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) DEFAULT 'SAFETY',
    severity VARCHAR(32) DEFAULT 'HIGH',
    message TEXT NOT NULL,
    recommended_action TEXT,
    protocol_rule VARCHAR(128) DEFAULT '§2.1',
    status VARCHAR(32) DEFAULT 'OPEN',
    evidence_bundle JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usubjid) REFERENCES subjects(usubjid) ON DELETE CASCADE,
    INDEX idx_finding_subj (usubjid),
    INDEX idx_finding_severity (severity),
    INDEX idx_finding_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 12. DATA QUERIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE data_queries (
    query_id VARCHAR(64) PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    site_id VARCHAR(64) DEFAULT 'SITE-101',
    problem_type VARCHAR(128) NOT NULL,
    record_ref VARCHAR(128),
    question_to_site TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'OPEN',
    site_response TEXT,
    dm_review_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_query_subj (usubjid),
    INDEX idx_query_site (site_id),
    INDEX idx_query_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 13. HUMAN ESCALATIONS TABLE (Sovereign Human Gate)
-- ------------------------------------------------------------------------------
CREATE TABLE human_escalations (
    escalation_id VARCHAR(64) PRIMARY KEY,
    usubjid VARCHAR(64) NOT NULL,
    site_id VARCHAR(64) DEFAULT 'SITE-101',
    finding_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(32) DEFAULT 'CRITICAL',
    status VARCHAR(32) DEFAULT 'PENDING',
    recommended_action TEXT,
    clinical_evidence JSON,
    protocol_evidence JSON,
    clarification_history JSON,
    rejection_reason TEXT,
    cuts_waiting INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_esc_subj (usubjid),
    INDEX idx_esc_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 14. DECISION TRACE TABLE (21 CFR Part 11 Immutable Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE decision_traces (
    id VARCHAR(64) PRIMARY KEY,
    node VARCHAR(64) NOT NULL,
    decision VARCHAR(64) NOT NULL,
    subject_id VARCHAR(64),
    finding_id VARCHAR(64),
    protocol_version VARCHAR(32) DEFAULT 'v1.0',
    evidence_refs JSON,
    actor VARCHAR(128) NOT NULL,
    notes TEXT,
    result_payload JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trace_node (node),
    INDEX idx_trace_subj (subject_id)
) ENGINE=InnoDB;

-- ==============================================================================
-- SEED DATA INSERTIONS
-- ==============================================================================

-- 1. Study ABC-101
INSERT INTO studies (study_id, protocol_name, phase, status, current_cut, total_cuts, current_protocol_version)
VALUES ('ABC-101', 'A Multicenter, Double-Blind Phase II Trial of Experimental Hepatoprotective Agent', 'Phase II', 'ACTIVE', 8, 12, 'v1.0');

-- 2. Protocols
INSERT INTO protocols (protocol_id, version, effective_date, title, content, sha256_hash, is_active)
VALUES 
('ABC-101', 'v1.0', '2026-01-01', 'Protocol ABC-101 Revision 1.0', 'Primary safety rules: Hy''s Law (ALT > 3x ULN, BILI > 2x ULN). Allowable visit window ±7 days.', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', TRUE),
('ABC-101', 'v2.0', '2026-06-01', 'Protocol ABC-101 Amendment 2.0', 'Tightened visit schedule window from ±7 days to ±3 days.', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', FALSE);

-- 3. Clinical Sites
INSERT INTO sites (site_id, name, pi_name, country, status)
VALUES
('SITE-101', 'Memorial Oncology Center (S01)', 'Dr. Robert Vance', 'United States', 'ACTIVE'),
('SITE-102', 'St. Jude Clinical Research (S02)', 'Dr. Elena Rostova', 'United States', 'ACTIVE'),
('SITE-103', 'Pacific Liver Institute (S03)', 'Dr. Alan Grant', 'United States', 'ACTIVE'),
('SITE-104', 'Metro Valley Hospital (S04)', 'Dr. Marcus Brody', 'United States', 'ACTIVE'),
('SITE-105', 'Bay Area Medical Center (S05)', 'Dr. Sarah Lin', 'United States', 'ACTIVE'),
('SITE-107', 'University Hepatology Clinic (S07)', 'Dr. James Miller', 'United States', 'ACTIVE'),
('SITE-108', 'Midwest General Hospital (S08)', 'Dr. Karen White', 'United States', 'ACTIVE'),
('SITE-111', 'Highland Health Sciences (S11)', 'Dr. Thomas Clark', 'United States', 'ACTIVE'),
('SITE-112', 'Lakeside Clinical Center (S12)', 'Dr. Emily Davis', 'United States', 'ACTIVE');

-- 4. Subjects (Liver Disease cohort across Drug A, Drug B, and standard care)
INSERT INTO subjects (usubjid, site_id, age, sex, race, arm, status, enrollment_date, first_dose_date, primary_treatment, treatment_status)
VALUES
('042-S07-001', 'SITE-107', 54, 'M', 'White', 'Experimental 50mg', 'Active', '2026-01-10', '2026-01-12', 'Drug A', 'Ongoing'),
('042-S07-002', 'SITE-107', 48, 'F', 'Asian', 'Experimental 50mg', 'Active', '2026-01-15', '2026-01-17', 'Drug A', 'Ongoing'),
('042-S01-003', 'SITE-101', 61, 'M', 'Black', 'Experimental 50mg', 'Active', '2026-01-20', '2026-01-22', 'Drug A', 'Ongoing'),
('042-S02-004', 'SITE-102', 59, 'F', 'White', 'Active Comparator 100mg', 'Active', '2026-01-25', '2026-01-27', 'Drug B', 'Ongoing'),
('042-S11-005', 'SITE-111', 45, 'M', 'Hispanic', 'Experimental 50mg', 'Active', '2026-02-01', '2026-02-03', 'Drug A', 'Ongoing'),
('042-S03-009', 'SITE-103', 52, 'F', 'White', 'Experimental 50mg', 'Active', '2026-02-05', '2026-02-07', 'Drug A', 'Ongoing'),
('042-S05-012', 'SITE-105', 66, 'M', 'Asian', 'Active Comparator 100mg', 'Active', '2026-02-10', '2026-02-12', 'Drug B', 'Ongoing'),
('042-S08-015', 'SITE-108', 58, 'F', 'White', 'Standard of Care', 'Active', '2026-02-15', '2026-02-17', 'Standard Care', 'Ongoing');

-- 5. Medical History
INSERT INTO medical_histories (usubjid, condition_name, start_date, status, evidence_ref)
VALUES
('042-S07-001', 'Liver disease', '2025-06-10', 'Ongoing', 'HIST #042-S07-001-01'),
('042-S07-001', 'Diabetes', '2024-02-15', 'Ongoing', 'HIST #042-S07-001-02'),
('042-S07-002', 'Liver disease', '2025-08-20', 'Ongoing', 'HIST #042-S07-002-01'),
('042-S01-003', 'Liver disease', '2024-11-05', 'Ongoing', 'HIST #042-S01-003-01'),
('042-S02-004', 'Liver disease', '2025-01-12', 'Ongoing', 'HIST #042-S02-004-01'),
('042-S11-005', 'Liver disease', '2025-03-30', 'Ongoing', 'HIST #042-S11-005-01'),
('042-S03-009', 'Liver disease', '2025-05-18', 'Ongoing', 'HIST #042-S03-009-01'),
('042-S05-012', 'Liver disease', '2024-09-22', 'Ongoing', 'HIST #042-S05-012-01'),
('042-S08-015', 'Liver disease', '2025-07-14', 'Ongoing', 'HIST #042-S08-015-01');

-- 6. Concomitant Medications
INSERT INTO medications (usubjid, medication_name, dose, route, frequency, start_date, status, evidence_ref)
VALUES
('042-S07-001', 'Drug A', '50 mg', 'Oral', 'Once daily', '2026-01-12', 'Ongoing', 'CM #042-S07-001-01'),
('042-S07-001', 'Metformin', '500 mg', 'Oral', 'Twice daily', '2024-03-01', 'Ongoing', 'CM #042-S07-001-02'),
('042-S07-002', 'Drug A', '50 mg', 'Oral', 'Once daily', '2026-01-17', 'Ongoing', 'CM #042-S07-002-01'),
('042-S01-003', 'Drug A', '50 mg', 'Oral', 'Once daily', '2026-01-22', 'Ongoing', 'CM #042-S01-003-01'),
('042-S02-004', 'Drug B', '100 mg', 'Oral', 'Once daily', '2026-01-27', 'Ongoing', 'CM #042-S02-004-01'),
('042-S11-005', 'Drug A', '50 mg', 'Oral', 'Once daily', '2026-02-03', 'Ongoing', 'CM #042-S11-005-01'),
('042-S03-009', 'Drug A', '50 mg', 'Oral', 'Once daily', '2026-02-07', 'Ongoing', 'CM #042-S03-009-01'),
('042-S05-012', 'Drug B', '100 mg', 'Oral', 'Once daily', '2026-02-12', 'Ongoing', 'CM #042-S05-012-01'),
('042-S08-015', 'Standard Care', '10 mg', 'Oral', 'Once daily', '2026-02-17', 'Ongoing', 'CM #042-S08-015-01');

-- 7. Visits for Subject 042-S07-001
INSERT INTO visits (usubjid, name, target_day, actual_day, visit_date, status, window_deviation_days, evidence_ref)
VALUES
('042-S07-001', 'Screening', -14, -14, '2026-01-02', 'Completed', 0, 'SV #042-S07-001-V0'),
('042-S07-001', 'Baseline Day 1', 1, 1, '2026-01-12', 'Completed', 0, 'SV #042-S07-001-V1'),
('042-S07-001', 'Week 2', 14, 15, '2026-01-26', 'Completed', 1, 'SV #042-S07-001-V2'),
('042-S07-001', 'Week 4', 28, 29, '2026-02-09', 'Completed', 1, 'SV #042-S07-001-V3'),
('042-S07-001', 'Week 8', 56, 56, '2026-03-09', 'Completed', 0, 'SV #042-S07-001-V4');

-- 8. Key Lab Results (including Hy's Law candidate for 042-S07-001 at Week 4)
INSERT INTO lab_results (usubjid, test_code, test_name, raw_value, numeric_value, unit, standard_unit, converted_value, uln, reference_range, status, is_censored, operator_str, visit, collection_date, evidence_ref)
VALUES
('042-S07-001', 'ALT', 'Alanine Aminotransferase', '185', 185.0, 'U/L', 'U/L', 185.0, 45.0, '7-45 U/L', 'CRITICAL', FALSE, '=', 'Week 4', '2026-02-09', 'LB #042-S07-001-W4-ALT'),
('042-S07-001', 'AST', 'Aspartate Aminotransferase', '142', 142.0, 'U/L', 'U/L', 142.0, 35.0, '8-35 U/L', 'HIGH', FALSE, '=', 'Week 4', '2026-02-09', 'LB #042-S07-001-W4-AST'),
('042-S07-001', 'BILI', 'Total Bilirubin', '2.8', 2.8, 'mg/dL', 'mg/dL', 2.8, 1.2, '0.2-1.2 mg/dL', 'CRITICAL', FALSE, '=', 'Week 4', '2026-02-09', 'LB #042-S07-001-W4-BILI'),
('042-S07-001', 'GLUC', 'Glucose', '118', 118.0, 'mg/dL', 'mg/dL', 118.0, 99.0, '70-99 mg/dL', 'HIGH', FALSE, '=', 'Week 4', '2026-02-09', 'LB #042-S07-001-W4-GLUC');

-- 9. Doses
INSERT INTO doses (usubjid, visit, planned_dose, actual_dose, unit, dose_date, status, is_deviation, evidence_ref)
VALUES
('042-S07-001', 'Baseline Day 1', 50.0, 50.0, 'mg', '2026-01-12', 'Administered', FALSE, 'EX #042-S07-001-D1'),
('042-S07-001', 'Week 2', 50.0, 50.0, 'mg', '2026-01-26', 'Administered', FALSE, 'EX #042-S07-001-D2'),
('042-S07-001', 'Week 4', 50.0, 25.0, 'mg', '2026-02-09', 'Administered', TRUE, 'EX #042-S07-001-D3');

-- 10. Adverse Events
INSERT INTO adverse_events (usubjid, term, severity, is_serious, hospitalized, relationship, start_date, status, evidence_ref)
VALUES
('042-S07-001', 'Hepatotoxicity / Transaminase Elevation', 'Severe', TRUE, TRUE, 'Probable', '2026-02-09', 'Ongoing', 'AE #042-S07-001-01');

-- 11. Findings
INSERT INTO findings (id, usubjid, site_id, title, category, severity, message, recommended_action, protocol_rule, status)
VALUES
('FND-001', '042-S07-001', 'SITE-107', 'Hy''s Law Candidate Detected', 'SAFETY', 'CRITICAL', 'ALT 185 U/L (>4x ULN) and Total Bilirubin 2.8 mg/dL (>2x ULN) concurrently observed at Week 4.', 'Immediate dose suspension, re-test within 48 hours, and sovereign medical escalation.', '§2.1 Hy''s Law Protocol', 'OPEN'),
('FND-002', '042-S04-006', 'SITE-104', 'Unit Discrepancy (Glucose Step Change)', 'DATA_INTEGRITY', 'HIGH', 'Glucose shifted from 118 mg/dL to 6.4 mmol/L without unit conversion flag.', 'Issue Data Query to Site 104 for laboratory unit verification.', '§4.3 Lab Harmonization', 'OPEN'),
('FND-003', '042-S07-001', 'SITE-107', 'Dose Reduction Deviation', 'COMPLIANCE', 'MEDIUM', 'Subject received 25 mg instead of protocol-specified 50 mg dose.', 'Confirm dose modification reason with site investigator.', '§3.2 Dosing Guidelines', 'OPEN');

-- 12. Data Queries
INSERT INTO data_queries (query_id, usubjid, site_id, problem_type, record_ref, question_to_site, status, site_response, dm_review_notes)
VALUES
('QRY-2026-001', '042-S04-006', 'SITE-104', 'Unit Anomaly', 'LB #042-S04-006-W4', 'Please confirm whether glucose value 6.4 was reported in mmol/L or mg/dL.', 'UNDER_REVIEW', 'Confirmed local lab switch to Roche Cobas mmol/L unit.', 'Awaiting supervisor sign-off to standardize to 115.3 mg/dL.'),
('QRY-2026-002', '042-S07-001', 'SITE-107', 'Dose Deviation', 'EX #042-S07-001-D3', 'Please confirm reason for 50% dose reduction at Week 4 visit.', 'OPEN', NULL, NULL);

-- 13. Human Escalations
INSERT INTO human_escalations (escalation_id, usubjid, site_id, finding_id, title, severity, status, recommended_action, clinical_evidence, protocol_evidence, cuts_waiting)
VALUES
('ESC-2026-001', '042-S07-001', 'SITE-107', 'FND-001', 'Hy''s Law Candidate (ALT 185 U/L, BILI 2.8 mg/dL)', 'CRITICAL', 'PENDING', 'Suspend study drug administration and initiate liver ultrasound panel.', '{"alt": 185, "bili": 2.8, "visit": "Week 4"}', '{"rule": "Protocol §2.1", "threshold": "ALT > 3x, BILI > 2x"}', 2);

-- 14. Decision Trace
INSERT INTO decision_traces (id, node, decision, subject_id, finding_id, protocol_version, evidence_refs, actor, notes)
VALUES
('TRC-001', 'HUMAN_GATE', 'ESCALATION_TRIGGERED', '042-S07-001', 'FND-001', 'v1.0', '["LB #042-S07-001-W4-ALT", "LB #042-S07-001-W4-BILI"]', 'ATLAS Surveillance Engine', 'Triggered automated safety hold escalation for Subject 042-S07-001.');
