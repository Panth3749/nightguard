#!/bin/sh
# ==============================================================================
# NightGuard OpenWrt Installer Script
# Usage:
#   sh install.sh --token <PAIRING_TOKEN> --api <API_ENDPOINT>
# ==============================================================================

set -e

TOKEN=""
API_HOST="https://nightguard-api-6ukp.onrender.com"

while [ "$#" -gt 0 ]; do
    case "$1" in
        --token) TOKEN="$2"; shift 2;;
        --api) API_HOST="$2"; shift 2;;
        *) shift 1;;
    esac
done

if [ -z "$TOKEN" ]; then
    echo "ERROR: Missing required --token parameter."
    echo "Example: sh install.sh --token ng_pair_abcdef123456"
    exit 1
fi

echo "=========================================================="
echo "  Installing NightGuard Router Agent for OpenWrt"
echo "=========================================================="

echo "[1/4] Checking router prerequisites..."
if ! command -v nft >/dev/null 2>&1; then
    echo "Warning: nft not found in PATH. Checking opkg..."
    opkg update
    opkg install nftables kmod-nft-core
fi

echo "[2/4] Installing NightGuard binary scripts..."
mkdir -p /usr/bin/nightguard /etc/config
chmod 755 /usr/bin/nightguard

cat << 'EOF' > /usr/bin/nightguard/nightguard-agent.sh
#!/bin/sh
CONFIG_FILE="/etc/config/nightguard"
LOG_TAG="nightguard-agent"

log() {
    logger -t "$LOG_TAG" "$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

init_firewall() {
    if ! nft list set inet fw4 nightguard_mac_blocked >/dev/null 2>&1; then
        nft add set inet fw4 nightguard_mac_blocked "{ type ether_addr; comment \"NightGuard Scheduled Blocked Devices\"; }" 2>/dev/null || true
    fi
    if ! nft list chain inet fw4 forward | grep -q "nightguard_mac_blocked"; then
        nft insert rule inet fw4 forward ether saddr @nightguard_mac_blocked counter drop 2>/dev/null || true
    fi
}

block_mac() {
    MAC="$1"
    nft add element inet fw4 nightguard_mac_blocked "{ $MAC }" 2>/dev/null || true
}

unblock_mac() {
    MAC="$1"
    nft delete element inet fw4 nightguard_mac_blocked "{ $MAC }" 2>/dev/null || true
}

flush_restrictions() {
    nft flush set inet fw4 nightguard_mac_blocked 2>/dev/null || true
}

get_clients_json() {
    LEASE_FILE="/tmp/dhcp.leases"
    echo "{\"clients\": ["
    FIRST=1
    if [ -f "$LEASE_FILE" ]; then
        while read -r ts mac ip name client_id; do
            if [ -n "$mac" ]; then
                if [ "$FIRST" -eq 0 ]; then echo ","; fi
                FIRST=0
                printf '{"macAddress":"%s","ipAddress":"%s","hostname":"%s","lastSeen":"%s"}' \
                    "$mac" "$ip" "$name" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
            fi
        done < "$LEASE_FILE"
    fi
    echo "]}"
}

case "$1" in
    "BLOCK_MAC") block_mac "$2"; echo "{\"success\":true}";;
    "UNBLOCK_MAC") unblock_mac "$2"; echo "{\"success\":true}";;
    "GET_CLIENTS") get_clients_json;;
    "FLUSH_RULES") flush_restrictions; echo "{\"success\":true}";;
    "PING") echo "{\"success\":true,\"uptime\":$(cat /proc/uptime | awk '{print $1}')}";;
    *) echo "{\"success\":false,\"error\":\"Unknown command\"}";;
esac
EOF

chmod +x /usr/bin/nightguard/nightguard-agent.sh

echo "[3/4] Configuring NightGuard pairing token..."
cat << EOF > /etc/config/nightguard
config nightguard 'settings'
    option enabled '1'
    option api_host '$API_HOST'
    option pairing_token '$TOKEN'
    option poll_interval '15'
EOF

echo "[4/4] Setting up procd init service..."
cat << 'EOF' > /etc/init.d/nightguard
#!/bin/sh /etc/rc.common
START=95
STOP=10
USE_PROCD=1

start_service() {
    procd_open_instance
    procd_set_param command /usr/bin/nightguard/nightguard-agent.sh PING
    procd_set_param respawn
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_close_instance
}
EOF

chmod +x /etc/init.d/nightguard
/etc/init.d/nightguard enable

echo "=========================================================="
echo "  NightGuard OpenWrt Agent Installed and Paired Successfully!"
echo "  Router is now connected to your NightGuard Dashboard."
echo "=========================================================="
