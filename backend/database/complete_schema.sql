-- Enable UUID extension 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================== 
-- USERS & SECURITY TABLES 
-- ===================================================== 

CREATE TABLE IF NOT EXISTS Users ( 
    UserID SERIAL PRIMARY KEY, 
    Username VARCHAR(100) UNIQUE NOT NULL, 
    PasswordHash TEXT NOT NULL, 
    Email VARCHAR(255) UNIQUE NOT NULL, 
    FullName VARCHAR(255) NOT NULL, 
    Role VARCHAR(50) DEFAULT 'user', 
    IsActive BOOLEAN DEFAULT TRUE, 
    LastLogin TIMESTAMP, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CreatedBy INTEGER REFERENCES Users(UserID), 
    UpdatedBy INTEGER REFERENCES Users(UserID) 
); 

CREATE TABLE IF NOT EXISTS AuditLog ( 
    LogID SERIAL PRIMARY KEY, 
    UserID INTEGER REFERENCES Users(UserID), 
    Action VARCHAR(50) NOT NULL, 
    TableName VARCHAR(100), 
    RecordID INTEGER, 
    OldValue JSONB, 
    NewValue JSONB, 
    IPAddress INET, 
    UserAgent TEXT, 
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 

-- ===================================================== 
-- HIERARCHICAL CHART OF ACCOUNTS (FULLY INTEGRATED) 
-- ===================================================== 

-- Level 1: Main Groups 
CREATE TABLE IF NOT EXISTS Main ( 
    PrimID SERIAL PRIMARY KEY, 
    PrimName VARCHAR(255) NOT NULL, 
    PrimCode VARCHAR(20) UNIQUE, 
    Description TEXT, 
    IsActive BOOLEAN DEFAULT TRUE, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CreatedBy INTEGER REFERENCES Users(UserID), 
    UpdatedBy INTEGER REFERENCES Users(UserID) 
); 

-- Level 2: Sub Main Groups 
CREATE TABLE IF NOT EXISTS subMain ( 
    SubPrimID SERIAL PRIMARY KEY, 
    PrimID INTEGER NOT NULL REFERENCES Main(PrimID) ON DELETE RESTRICT, 
    SubName VARCHAR(255) NOT NULL, 
    SubCode VARCHAR(20), 
    Description TEXT, 
    IsActive BOOLEAN DEFAULT TRUE, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CreatedBy INTEGER REFERENCES Users(UserID), 
    UpdatedBy INTEGER REFERENCES Users(UserID) 
); 

-- Level 3: Groups 
CREATE TABLE IF NOT EXISTS Groups ( 
    GroupID SERIAL PRIMARY KEY, 
    SubPrimID INTEGER NOT NULL REFERENCES subMain(SubPrimID) ON DELETE RESTRICT, 
    GroupName VARCHAR(255) NOT NULL, 
    GroupCode VARCHAR(20), 
    Description TEXT, 
    NormalSide VARCHAR(2) DEFAULT 'Dr', 
    IsActive BOOLEAN DEFAULT TRUE, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CreatedBy INTEGER REFERENCES Users(UserID), 
    UpdatedBy INTEGER REFERENCES Users(UserID) 
); 

-- Level 4: SubGroups (Direct parent of Ledgers) 
CREATE TABLE IF NOT EXISTS SubGroups ( 
    SubGroupID SERIAL PRIMARY KEY, 
    GroupID INTEGER NOT NULL REFERENCES Groups(GroupID) ON DELETE RESTRICT, 
    SubName VARCHAR(255) NOT NULL, 
    SubCode VARCHAR(20), 
    Description TEXT, 
    NormalSide VARCHAR(2) DEFAULT 'Dr', 
    IsActive BOOLEAN DEFAULT TRUE, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CreatedBy INTEGER REFERENCES Users(UserID), 
    UpdatedBy INTEGER REFERENCES Users(UserID) 
); 

-- ===================================================== 
-- LEDGERS (Accounts) - Linked to Hierarchy 
-- ===================================================== 

CREATE TABLE IF NOT EXISTS Ledgers ( 
    AcNo SERIAL PRIMARY KEY, 
    SubGroupID INTEGER NOT NULL REFERENCES SubGroups(SubGroupID) ON DELETE RESTRICT, 
    AccName VARCHAR(255) NOT NULL, 
    AccCode VARCHAR(50) UNIQUE NOT NULL, 
    OpeningBalance DECIMAL(15,2) DEFAULT 0, 
    BalanceType VARCHAR(2) DEFAULT 'Dr', 
    IsGroup BOOLEAN DEFAULT FALSE, 
    ParentLedgerID INTEGER REFERENCES Ledgers(AcNo), 
    Address TEXT, 
    Phone VARCHAR(50), 
    Email VARCHAR(255), 
    HasGST BOOLEAN DEFAULT FALSE, 
    GSTIN VARCHAR(15), 
    IsBankAccount BOOLEAN DEFAULT FALSE, 
    BankName VARCHAR(255), 
    AccountNumber VARCHAR(50), 
    IFSCcode VARCHAR(20), 
    IsActive BOOLEAN DEFAULT TRUE, 
    Description TEXT, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CreatedBy INTEGER REFERENCES Users(UserID), 
    UpdatedBy INTEGER REFERENCES Users(UserID) 
); 

-- ===================================================== 
-- FINANCIAL YEAR & PERIOD TABLES 
-- ===================================================== 

CREATE TABLE IF NOT EXISTS FinancialYears ( 
    FYID SERIAL PRIMARY KEY, 
    FYName VARCHAR(100) NOT NULL, 
    StartDate DATE NOT NULL, 
    EndDate DATE NOT NULL, 
    IsActive BOOLEAN DEFAULT FALSE, 
    IsClosed BOOLEAN DEFAULT FALSE, 
    ClosingDate DATE, 
    ClosedBy INTEGER REFERENCES Users(UserID), 
    Notes TEXT, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT valid_dates CHECK (StartDate < EndDate)
); 

CREATE TABLE IF NOT EXISTS OpeningBalances ( 
    BalanceID SERIAL PRIMARY KEY, 
    FYID INTEGER NOT NULL REFERENCES FinancialYears(FYID) ON DELETE CASCADE, 
    AcNo INTEGER NOT NULL REFERENCES Ledgers(AcNo) ON DELETE RESTRICT, 
    OpeningDebit DECIMAL(15,2) DEFAULT 0, 
    OpeningCredit DECIMAL(15,2) DEFAULT 0, 
    IsImported BOOLEAN DEFAULT FALSE, 
    ImportedFrom TEXT, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CreatedBy INTEGER REFERENCES Users(UserID), 
    UNIQUE(FYID, AcNo) 
); 

-- ===================================================== 
-- VOUCHER & TRANSACTION TABLES 
-- ===================================================== 

CREATE TABLE IF NOT EXISTS VoucherTypes ( 
    VTypeID SERIAL PRIMARY KEY, 
    VoucherName VARCHAR(100) NOT NULL, 
    VoucherCode VARCHAR(20) UNIQUE NOT NULL, 
    Prefix VARCHAR(10), 
    StartingNumber INTEGER DEFAULT 1, 
    CurrentNumber INTEGER DEFAULT 1, 
    Suffix VARCHAR(10), 
    IsActive BOOLEAN DEFAULT TRUE, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 

CREATE TABLE IF NOT EXISTS JournalEntries ( 
    EntryID SERIAL PRIMARY KEY, 
    VTypeID INTEGER NOT NULL REFERENCES VoucherTypes(VTypeID), 
    VoucherNo VARCHAR(50) NOT NULL, 
    EntryDate DATE NOT NULL, 
    FYID INTEGER NOT NULL REFERENCES FinancialYears(FYID), 
    Narration TEXT NOT NULL, 
    TotDr DECIMAL(15,2) DEFAULT 0, 
    TotCr DECIMAL(15,2) DEFAULT 0, 
    IsReversed BOOLEAN DEFAULT FALSE, 
    ReverseOfEntryID INTEGER REFERENCES JournalEntries(EntryID), 
    IsCancelled BOOLEAN DEFAULT FALSE, 
    CancelReason TEXT, 
    CancelledAt TIMESTAMP, 
    CancelledBy INTEGER REFERENCES Users(UserID), 
    CreatedBy INTEGER REFERENCES Users(UserID), 
    ApprovedBy INTEGER REFERENCES Users(UserID), 
    ApprovedAt TIMESTAMP, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UNIQUE(VTypeID, VoucherNo, FYID), 
    CONSTRAINT valid_totals CHECK (TotDr = TotCr) 
); 

CREATE TABLE IF NOT EXISTS EntryDetails ( 
    DetailID SERIAL PRIMARY KEY, 
    EntryID INTEGER NOT NULL REFERENCES JournalEntries(EntryID) ON DELETE CASCADE, 
    AcNo INTEGER NOT NULL REFERENCES Ledgers(AcNo), 
    Debit DECIMAL(15,2) DEFAULT 0, 
    Credit DECIMAL(15,2) DEFAULT 0, 
    CurrC VARCHAR(3) DEFAULT 'USD', 
    CRate DECIMAL(10,4) DEFAULT 1, 
    ChequeID INTEGER, 
    Description TEXT, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT valid_amount CHECK (Debit >= 0 AND Credit >= 0), 
    CONSTRAINT either_dr_cr CHECK ((Debit > 0 AND Credit = 0) OR (Debit = 0 AND Credit > 0)) 
); 

-- ===================================================== 
-- BANKING & CHEQUE TABLES 
-- ===================================================== 

CREATE TABLE IF NOT EXISTS ChequeTransactions ( 
    ChequeID SERIAL PRIMARY KEY, 
    EntryID INTEGER NOT NULL REFERENCES JournalEntries(EntryID), 
    AcNo INTEGER NOT NULL REFERENCES Ledgers(AcNo), 
    ChequeNo VARCHAR(50) NOT NULL, 
    ChequeDate DATE NOT NULL, 
    ChequeType VARCHAR(20) CHECK (ChequeType IN ('Issued', 'Received', 'Deposited', 'Bounced', 'Cleared', 'Cancelled')), 
    BankName VARCHAR(255), 
    PayeeName VARCHAR(255), 
    Amount DECIMAL(15,2) NOT NULL, 
    ClearanceDate DATE, 
    Status VARCHAR(20) DEFAULT 'Pending', 
    BounceReason TEXT, 
    Notes TEXT, 
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    CreatedBy INTEGER REFERENCES Users(UserID) 
); 

-- System Settings Table 
CREATE TABLE IF NOT EXISTS SystemSettings ( 
    setting_key VARCHAR(100) PRIMARY KEY, 
    setting_value TEXT NOT NULL, 
    setting_type VARCHAR(20) DEFAULT 'string', 
    description TEXT, 
    is_encrypted BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_by INTEGER REFERENCES Users(UserID) 
);

-- Add foreign key constraint only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_cheque' 
                   AND table_name = 'entrydetails') THEN
        ALTER TABLE EntryDetails ADD CONSTRAINT fk_cheque 
            FOREIGN KEY (ChequeID) REFERENCES ChequeTransactions(ChequeID);
    END IF;
END $$;

-- ===================================================== 
-- INDEXES FOR PERFORMANCE 
-- ===================================================== 

CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON JournalEntries(EntryDate); 
CREATE INDEX IF NOT EXISTS idx_journal_entries_fyid ON JournalEntries(FYID); 
CREATE INDEX IF NOT EXISTS idx_entry_details_entryid ON EntryDetails(EntryID); 
CREATE INDEX IF NOT EXISTS idx_entry_details_acno ON EntryDetails(AcNo); 
CREATE INDEX IF NOT EXISTS idx_ledgers_subgroup ON Ledgers(SubGroupID); 
CREATE INDEX IF NOT EXISTS idx_ledgers_code ON Ledgers(AccCode); 
CREATE INDEX IF NOT EXISTS idx_audit_user ON AuditLog(UserID); 
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON AuditLog(Timestamp); 
CREATE INDEX IF NOT EXISTS idx_submain_primid ON subMain(PrimID); 
CREATE INDEX IF NOT EXISTS idx_groups_subprimid ON Groups(SubPrimID); 
CREATE INDEX IF NOT EXISTS idx_subgroups_groupid ON SubGroups(GroupID); 

-- ===================================================== 
-- HELPER FUNCTIONS (Using single quotes instead of dollar quotes) 
-- ===================================================== 

-- Get full account path through hierarchy
CREATE OR REPLACE FUNCTION get_account_path(p_ledger_id INTEGER)
RETURNS TEXT AS '
DECLARE
    v_path TEXT;
BEGIN
    SELECT  
        COALESCE(m.PrimName, '''') || '' > '' ||  
        COALESCE(sm.SubName, '''') || '' > '' ||  
        COALESCE(g.GroupName, '''') || '' > '' ||  
        COALESCE(sg.SubName, '''') || '' > '' ||  
        l.AccName
    INTO v_path
    FROM Ledgers l
    LEFT JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID
    LEFT JOIN Groups g ON sg.GroupID = g.GroupID
    LEFT JOIN subMain sm ON g.SubPrimID = sm.SubPrimID
    LEFT JOIN Main m ON sm.PrimID = m.PrimID
    WHERE l.AcNo = p_ledger_id;     
    RETURN v_path;
END;
' LANGUAGE plpgsql;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS '
BEGIN
    NEW.UpdatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
' LANGUAGE plpgsql;

-- ===================================================== 
-- TRIGGERS 
-- ===================================================== 

DROP TRIGGER IF EXISTS update_users_updated_at ON Users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ledgers_updated_at ON Ledgers;
CREATE TRIGGER update_ledgers_updated_at BEFORE UPDATE ON Ledgers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_updated_at ON JournalEntries;
CREATE TRIGGER update_journal_updated_at BEFORE UPDATE ON JournalEntries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_main_updated_at ON Main;
CREATE TRIGGER update_main_updated_at BEFORE UPDATE ON Main FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submain_updated_at ON subMain;
CREATE TRIGGER update_submain_updated_at BEFORE UPDATE ON subMain FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON Groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON Groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subgroups_updated_at ON SubGroups;
CREATE TRIGGER update_subgroups_updated_at BEFORE UPDATE ON SubGroups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================== 
-- VALIDATION FUNCTION FOR LEDGER HIERARCHY 
-- ===================================================== 

CREATE OR REPLACE FUNCTION validate_ledger_hierarchy()
RETURNS TRIGGER AS '
DECLARE
    v_normal_side VARCHAR(2);
BEGIN
    SELECT NormalSide INTO v_normal_side
    FROM SubGroups
    WHERE SubGroupID = NEW.SubGroupID;     
    IF v_normal_side IS NOT NULL AND NEW.BalanceType != v_normal_side THEN
        RAISE NOTICE ''Warning: Ledger BalanceType (%) does not match parent SubGroup NormalSide (%)'',  
            NEW.BalanceType, v_normal_side;
    END IF;      
    RETURN NEW;
END;
' LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_ledger_hierarchy_trigger ON Ledgers;
CREATE TRIGGER validate_ledger_hierarchy_trigger 
    BEFORE INSERT OR UPDATE ON Ledgers FOR EACH ROW EXECUTE FUNCTION validate_ledger_hierarchy();


-- Default Admin User (password: admin123) 
-- Note: Update this with a proper bcrypt hash in production
-- INSERT INTO Users (Username, PasswordHash, Email, FullName, Role, IsActive) 
-- VALUES ('admin', '$2a$10$rVqYQcQJxhZqLqJxZqLqJxZqLqJxZqLqJxZqLqJxZqLqJxZqLqJxZqLqJx', 'admin@example.com', 'System Administrator', 'admin', TRUE);

-- Default Financial Year 
-- INSERT INTO FinancialYears (FYName, StartDate, EndDate, IsActive) 
-- VALUES ('2024-2025', '2024-04-01', '2025-03-31', TRUE); 

-- INSERT INTO Main (PrimName, PrimCode, Description) VALUES 
--     ('Assets', '1', 'All asset accounts'), 
--     ('Liabilities', '2', 'All liability accounts'), 
--     ('Equity', '3', 'All equity accounts'), 
--     ('Income', '4', 'All income/revenue accounts'), 
--     ('Expenses', '5', 'All expense accounts');
-- Default settings 
INSERT INTO SystemSettings (setting_key, setting_value, setting_type, description) VALUES 
('company_name', 'My Company', 'string', 'Company legal name'), 
('company_address', '', 'string', 'Company registered address'), 
('company_phone', '', 'string', 'Company contact phone'), 
('company_email', '', 'string', 'Company contact email'), 
('gst_number', '', 'string', 'GST/VAT registration number'), 
('pan_number', '', 'string', 'PAN/Tax identification number'), 
('default_currency', 'USD', 'string', 'Default currency for transactions'), 
('fiscal_year_start', '2024-04-01', 'string', 'Fiscal year start date (MM-DD)'), 
('invoice_prefix', 'INV', 'string', 'Prefix for invoice numbers'), 
('enable_audit_trail', 'true', 'boolean', 'Enable audit logging for all transactions' 
) 
ON CONFLICT (setting_key) DO NOTHING; 

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_cheque' 
                   AND table_name = 'entrydetails') THEN
        ALTER TABLE EntryDetails ADD CONSTRAINT fk_cheque 
            FOREIGN KEY (ChequeID) REFERENCES ChequeTransactions(ChequeID);
    END IF;
END $$;