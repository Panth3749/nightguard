# NightGuard Router Compatibility Matrix

## 1. Supported Firmware

| Firmware | Version | Status | Firewall Backend | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **OpenWrt** | 23.05.x | **Fully Supported (Tier 1)** | `firewall4` / `nftables` | Recommended release. Native set support. |
| **OpenWrt** | 22.03.x | **Supported** | `firewall4` / `nftables` | Fully compatible. |
| **OpenWrt** | 21.02.x | **Supported** | `firewall3` / `iptables` | Uses ipset / iptables drop rules. |
| **ImmortalWrt**| 23.05.x | **Supported** | `firewall4` / `nftables` | Fully compatible with OpenWrt agent. |
| **AsusWRT-Merlin**| 386+ | Planned Adapter (Tier 2) | `iptables` / nvram | Requires JFFS partition & custom scripts. |
| **MikroTik RouterOS**| v7+ | Planned Adapter (Tier 2) | RouterOS Firewall | Uses REST API / SSH key automation. |
| **Proprietary Stock**| Any | **Unsupported** | Closed firmware | Most stock vendor firmware does not permit CLI or background agent execution. |

---

## 2. Hardware Requirements on Existing Router

- **CPU Architectures**: MIPS, ARM, ARM64, x86_64
- **Flash Storage**: Requires at least **1.5 MB free space** in `/usr/bin` and `/etc`
- **RAM**: Minimum **64 MB RAM** (recommended: 128 MB+)
- **Required Packages**:
  - `nftables` (default in OpenWrt 22.03+)
  - `kmod-nft-core`
  - `curl` or `uclient-fetch` with SSL support (`libustream-mbedtls` or `libustream-openssl`)

---

## 3. Truthful Unsupported Device Notice

If a user attempts to connect a router running locked proprietary firmware without OpenWrt capability, the dashboard clearly displays:

> **"Your router is currently not supported for automatic device control."**

NightGuard never fakes connected devices or claims successful restrictions without router kernel confirmation.
