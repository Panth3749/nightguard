# Security Architecture & Threat Model

NightGuard enforces strict security controls across cloud infrastructure, router agents, and browser clients.

---

## 1. Threat Mitigation Strategies

| Threat | Mitigation |
| :--- | :--- |
| **Exposure of Router Admin UI** | No router administration ports (80, 443, 22) are ever exposed to the WAN. Connections are outbound-only initiated by the router agent. |
| **Credential Interception** | Router administrator passwords are **never stored** in the database or sent to frontend code. Authentication uses ephemeral cryptographically signed tokens. |
| **Replay Attacks** | Every router command is signed with an HMAC-SHA256 signature and includes a millisecond timestamp and unique idempotency key with a 15-second expiration window. |
| **Arbitrary Shell Execution** | The router agent strictly parses commands using a hardened whitelist (`BLOCK_MAC`, `UNBLOCK_MAC`, `GET_CLIENTS`, `FLUSH_RULES`, `PING`). Arbitrary shell scripts or user-supplied strings are rejected. |
| **MAC Address Injection** | Device MAC addresses received from the browser are validated against router DHCP/ARP lease tables before rules are committed. |
| **Multi-Tenant Data Leaks** | Every database query is scoped by `userId` and `networkId` at the ORM layer. Cross-account access returns 404 or 403. |

---

## 2. Emergency Recovery Procedure

In case of cloud communication failure or network outage:
1. **Admin Override**: Clicking **Emergency Override** in the dashboard immediately sends a priority `FLUSH_RULES` broadcast.
2. **Router Hardware Failsafe**: The agent checks cloud connectivity. If the cloud is unreachable for more than the configured failsafe interval, it automatically clears the restriction set to prevent locking users out of emergency communication.
3. **Manual Physical Flush**: Running `nft flush set inet fw4 nightguard_mac_blocked` in router SSH clears all blocks instantly.
