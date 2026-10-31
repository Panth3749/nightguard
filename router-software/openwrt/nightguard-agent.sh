#!/bin/sh
# ==============================================================================
# NightGuard Lightweight Outbound Router Agent for OpenWrt (21.02, 22.03, 23.05+)
# ==============================================================================

set -e

CONFIG_FILE="/etc/config/nightguard"
LOG_TAG="nightguard-agent"

log() {
    logger -t "$LOG_TAG" "$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 1. Verify nftables / firewall4
init_firewall() {
    log "Initializing NightGuard nftables set in fw4..."
    # Ensure set exists in inet fw4 table
    if ! nft list set inet fw4 nightguard_mac_blocked >/dev/null 2>&1; then
        nft add set inet fw4 nightguard_mac_blocked "{ type ether_addr; comment \"NightGuard Scheduled Blocked Devices\"; }" 2>/dev/null || true
    fi

    # Ensure rule exists in forward chain
    if ! nft list chain inet fw4 forward | grep -q "nightguard_mac_blocked"; then
        nft insert rule inet fw4 forward ether saddr @nightguard_mac_blocked counter drop 2>/dev/null || true
        log "Inserted NightGuard drop rule into inet fw4 forward chain."
    fi
}

# 2. Block MAC address
block_mac() {
    MAC="$1"
    if [ -z "$MAC" ]; then return 1; fi
    log "Blocking MAC: $MAC"
    nft add element inet fw4 nightguard_mac_blocked "{ $MAC }" 2>/dev/null || true
}

# 3. Unblock MAC address
unblock_mac() {
    MAC="$1"
    if [ -z "$MAC" ]; then return 1; fi
    log "Restoring/Unblocking MAC: $MAC"
    nft delete element inet fw4 nightguard_mac_blocked "{ $MAC }" 2>/dev/null || true
}

# 4. Flush all restrictions
flush_restrictions() {
    log "Emergency flush: clearing all active restrictions..."
    nft flush set inet fw4 nightguard_mac_blocked 2>/dev/null || true
}

# 5. Get currently connected clients (DHCP leases + ARP)
get_clients_json() {
    LEASE_FILE="/tmp/dhcp.leases"
    ARP_FILE="/proc/net/arp"

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

# 6. Main command dispatcher
handle_command() {
    CMD_TYPE="$1"
    ARG1="$2"
    ARG2="$3"

    case "$CMD_TYPE" in
        "BLOCK_MAC")
            block_mac "$ARG1"
            echo "{\"success\":true,\"mac\":\"$ARG1\",\"action\":\"BLOCKED\"}"
            ;;
        "UNBLOCK_MAC")
            unblock_mac "$ARG1"
            echo "{\"success\":true,\"mac\":\"$ARG1\",\"action\":\"RESTORED\"}"
            ;;
        "GET_CLIENTS")
            get_clients_json
            ;;
        "FLUSH_RULES")
            flush_restrictions
            echo "{\"success\":true,\"action\":\"FLUSHED\"}"
            ;;
        "PING")
            echo "{\"success\":true,\"uptime\":$(cat /proc/uptime | awk '{print $1}')}"
            ;;
        *)
            echo "{\"success\":false,\"error\":\"Unknown command $CMD_TYPE\"}"
            ;;
    esac
}

# Execute direct CLI call if arguments provided
if [ -n "$1" ]; then
    init_firewall
    handle_command "$1" "$2" "$3"
fi
