-- ============================================================
-- fix_orphaned_recruiters.sql
-- Repairs recruiter accounts that have no company in JobDb
-- due to the old deferred sessionStorage registration flow.
--
-- Run this script in two parts:
--   PART 1 — Run against IdentityDb to find affected users
--   PART 2 — Run against JobDb to insert missing companies
--             and then update IdentityDb.Users.CompanyId
-- ============================================================

-- ============================================================
-- PART 1: Find orphaned recruiters (run on IdentityDb)
-- ============================================================
USE IdentityDb;
GO

SELECT
    Id          AS UserId,
    Email,
    DisplayName,
    CreatedAt
FROM Users
WHERE Role      = 'Recruiter'
  AND CompanyId IS NULL
  AND IsDeleted = 0;
-- Review these rows — each one needs a Company row created in JobDb.

-- ============================================================
-- PART 2: Fix each orphaned recruiter
--
-- Replace the placeholder values below for each affected user.
-- Run once per affected recruiter, then verify.
-- ============================================================

-- Step 2a: Switch to JobDb and insert a Company row
USE JobDb;
GO

-- Replace @RecruiterId with the UserId from Part 1
-- Replace @CompanyName with a meaningful name (use email domain as fallback)
DECLARE @NewCompanyId   UNIQUEIDENTIFIER = NEWID();
DECLARE @RecruiterId    UNIQUEIDENTIFIER = '<PASTE-USER-ID-HERE>';
DECLARE @CompanyName    NVARCHAR(200)    = '<PASTE-COMPANY-NAME-HERE>';

-- Guard: only insert if no company already exists for this recruiter
IF NOT EXISTS (SELECT 1 FROM Companies WHERE RecruiterId = @RecruiterId)
BEGIN
    INSERT INTO Companies (Id, RecruiterId, Name, Description, Website, LogoUrl, Industry, Location, CreatedAt)
    VALUES (
        @NewCompanyId,
        @RecruiterId,
        @CompanyName,
        NULL,   -- Description (update manually if known)
        NULL,   -- Website
        NULL,   -- LogoUrl
        NULL,   -- Industry
        NULL,   -- Location
        GETUTCDATE()
    );
    PRINT 'Inserted Company: ' + CAST(@NewCompanyId AS NVARCHAR(50));
END
ELSE
BEGIN
    -- Company already exists — just retrieve its Id for the next step
    SELECT @NewCompanyId = Id FROM Companies WHERE RecruiterId = @RecruiterId;
    PRINT 'Company already exists: ' + CAST(@NewCompanyId AS NVARCHAR(50));
END

-- Step 2b: Link the CompanyId back to the User in IdentityDb
USE IdentityDb;
GO

UPDATE Users
SET    CompanyId = @NewCompanyId,
       UpdatedAt = GETUTCDATE()
WHERE  Id        = @RecruiterId
  AND  Role      = 'Recruiter'
  AND  CompanyId IS NULL;

PRINT 'Updated IdentityDb.Users.CompanyId for recruiter: ' + CAST(@RecruiterId AS NVARCHAR(50));

-- ============================================================
-- PART 3: Verification queries — run after fixes
-- ============================================================

-- Check no orphaned recruiters remain in IdentityDb
USE IdentityDb;
GO
SELECT COUNT(*) AS OrphanedRecruiters
FROM Users
WHERE Role = 'Recruiter' AND CompanyId IS NULL AND IsDeleted = 0;
-- Expected: 0

-- Verify Companies exist in JobDb for all recruiter CompanyIds
USE JobDb;
GO
SELECT c.Id AS CompanyId, c.Name, c.RecruiterId
FROM Companies c
INNER JOIN (
    -- Sub-query from IdentityDb (adjust server/linked server name if needed)
    SELECT CompanyId FROM IdentityDb.dbo.Users
    WHERE Role = 'Recruiter' AND CompanyId IS NOT NULL
) u ON u.CompanyId = c.Id;
