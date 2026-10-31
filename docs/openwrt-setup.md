# OpenWrt Setup & Pairing Guide

Follow this guide to pair your OpenWrt-compatible router with your NightGuard cloud dashboard.

---

## Prerequisites

1. An existing router flashed with **OpenWrt 22.03 or 23.05+**.
2. SSH access enabled on your router (`ssh root@192.168.1.1`).
3. Outbound internet connectivity on the router.

---

## Step 1: Generate Pairing Key in Dashboard

1. Log into your NightGuard dashboard.
2. Navigate to **Networks & Routers**.
3. Click **Pair Router**.
4. Select **Physical OpenWrt** mode.
5. Click **Generate Pairing Key**.

The dashboard will produce an automated pairing key and a one-liner command:
```sh
sh <(curl -sSL https://api.nightguard.render.com/agent/install.sh) --token ng_pair_xxxxxxxxxxxxxxxx
```

---

## Step 2: Run Installer via SSH

Open your terminal on a computer connected to your home Wi-Fi and SSH into the router:

```sh
ssh root@192.168.1.1
```

Once logged in, paste and execute the command generated in Step 1.

The installer will automatically:
1. Verify `nftables` and `firewall4` availability.
2. Install `/usr/bin/nightguard/nightguard-agent.sh`.
3. Configure your pairing key in `/etc/config/nightguard`.
4. Register the daemon in `/etc/init.d/nightguard` via OpenWrt `procd`.
5. Start the background service.

---

## Step 3: Verify Router Connection

1. Return to the NightGuard dashboard.
2. Your router will display **Online (OpenWrt)** with latency and active client count.
3. Click **Discover & Sync Clients** to immediately populate connected devices.

---

## Emergency Router Disconnect & Manual Flush

If you ever wish to completely remove NightGuard restrictions directly on the router hardware:

```sh
# Flush all blocked elements from nftables kernel set
nft flush set inet fw4 nightguard_mac_blocked

# Stop and disable background service
/etc/init.d/nightguard stop
/etc/init.d/nightguard disable
```
Internet access will immediately be restored to all devices.
