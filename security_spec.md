# KiteControl Security Specification

## 1. Data Invariants
- **User Integrity**: A User document must have a role (`PARENT` or `CHILD`).
- **Family Bound**: Every action (read/write) must be scoped to the user's `familyId`.
- **Relational Ownership**: Usage logs and Limits must point to a valid `userId` within the same family.
- **Immutability**: `createdAt` and `role` fields are immutable once set.
- **Pairing Logic**: Pairing codes must contain a valid `familyId` and have a strictly enforced expiration.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing**: User A attempts to update User B's profile (different `userId`).
2. **Role Escalation**: A `CHILD` user attempts to update their own role to `PARENT`.
3. **Shadow Update**: Attempting to add an `isAdmin: true` field to a User document.
4. **ID Poisoning**: Creating a User document with a 2MB string as the ID.
5. **PII Leak**: A Parent from Family A attempting to read User data from Family B.
6. **Orphaned Limit**: Creating a `Limit` for a `userId` that does not exist in the database.
7. **Future Log**: Submitting a `UsageLog` with a client-provided timestamp in the future.
8. **Bypassing Pairing**: Attempting to set `familyId` on a child device without a valid, unused pairing code.
9. **Limit Suppression**: A `CHILD` user attempting to delete or disable a `Limit` document.
10. **Query Scrape**: An authenticated user attempting a collection group query on `usage_logs` without a `familyId` filter.
11. **Resource Exhaustion**: Sending a `displayName` string of 1MB.
12. **Status Shortcutting**: Attempting to mark a `PairingCode` as `isUsed: true` without actually having a valid session.

## 3. Implementation Strategy
We will use the **Master Gate** pattern. All updates will be split into explicit actions with `affectedKeys().hasOnly()` guards.
- `isValidUser(data)`
- `isValidPairingCode(data)`
- `isValidUsageLog(data)`
- `isValidLimit(data)`
