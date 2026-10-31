import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding NightGuard Database ---');

  // 1. Create or upsert Admin User
  const passwordHash = await bcrypt.hash('AdminSecurePassword123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nightguard.local' },
    update: {},
    create: {
      email: 'admin@nightguard.local',
      passwordHash,
      name: 'Panth Patel (Admin)',
      role: 'ADMIN' as any,
      timezone: 'Asia/Kolkata',
      isVerified: true,
    },
  });
  console.log(`✓ Admin user ready: ${admin.email}`);

  // 2. Create Default Home Network
  let network = await prisma.network.findFirst({
    where: { userId: admin.id, name: 'Home Primary Wi-Fi' },
  });

  if (!network) {
    network = await prisma.network.create({
      data: {
        userId: admin.id,
        name: 'Home Primary Wi-Fi',
        ssid: 'NightGuard_5G',
        description: 'Main residential dual-band network with OpenWrt 23.05 gateway',
        isDefault: true,
      },
    });
  }
  console.log(`✓ Network ready: ${network.name}`);

  // 3. Create Router & Capabilities
  let router = await prisma.router.findFirst({
    where: { networkId: network.id },
  });

  if (!router) {
    router = await prisma.router.create({
      data: {
        networkId: network.id,
        model: 'TP-Link Archer C7 v5 (OpenWrt)',
        firmwareVersion: 'OpenWrt 23.05.2 r23630-9429c4a3a0',
        macAddress: 'DC:9F:DB:12:34:56',
        localIpAddress: '192.168.1.1',
        connectionStatus: 'ONLINE' as any,
        adapterType: 'OPENWRT' as any,
        pairingToken: 'ng_pair_demo_seed_token_8899',
        pairingExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isSimulated: true, // Configured for demo/testing
        lastHeartbeatAt: new Date(),
        capabilities: {
          create: {
            supportsNftables: true,
            supportsUbus: true,
            supportsPerDeviceBandwidth: false,
            supportsDnsBlocking: true,
            supportsVlan: true,
            supportsGuestIsolation: true,
            maxManagedDevices: 128,
          },
        },
        integration: {
          create: {
            protocol: 'WSS_AGENT',
            agentVersion: '1.2.0',
            port: 443,
            tlsEnabled: true,
          },
        },
      },
    });
  }
  console.log(`✓ Router ready: ${router.model} (Status: ${router.connectionStatus})`);

  // 4. Seed Connected Devices
  const initialDevices = [
    {
      mac: '4A:72:9D:31:AA:01',
      ip: '192.168.1.101',
      hostname: 'Panths-iPhone',
      friendlyName: "Panth's Phone",
      type: 'SMARTPHONE',
      isManaged: true,
      restrictionStatus: 'SCHEDULED',
    },
    {
      mac: '3C:22:FB:44:BB:02',
      ip: '192.168.1.102',
      hostname: 'MacBook-Pro-M2',
      friendlyName: 'Laptop',
      type: 'LAPTOP',
      isManaged: true,
      restrictionStatus: 'SCHEDULED',
    },
    {
      mac: '88:66:5A:77:CC:03',
      ip: '192.168.1.103',
      hostname: 'iPad-Air',
      friendlyName: 'Family Tablet',
      type: 'TABLET',
      isManaged: false,
      restrictionStatus: 'NOT_MANAGED',
    },
    {
      mac: 'FC:F5:28:99:DD:04',
      ip: '192.168.1.104',
      hostname: 'LG-webOS-TV',
      friendlyName: 'Smart TV',
      type: 'SMART_TV',
      isManaged: false,
      restrictionStatus: 'NOT_MANAGED',
    },
    {
      mac: '70:85:C2:AA:EE:05',
      ip: '192.168.1.105',
      hostname: 'DESKTOP-GAMING',
      friendlyName: 'Gaming PC',
      type: 'GAMING_CONSOLE',
      isManaged: false,
      restrictionStatus: 'NOT_MANAGED',
    },
  ];

  const createdDeviceIds: string[] = [];

  for (const d of initialDevices) {
    const dev = await prisma.device.upsert({
      where: {
        networkId_macAddress: {
          networkId: network.id,
          macAddress: d.mac,
        },
      },
      update: {
        currentIpAddress: d.ip,
        hostname: d.hostname,
        friendlyName: d.friendlyName,
        deviceType: d.type as any,
        isManaged: d.isManaged,
        restrictionStatus: d.restrictionStatus as any,
        lastSeenAt: new Date(),
      },
      create: {
        networkId: network.id,
        routerId: router.id,
        macAddress: d.mac,
        currentIpAddress: d.ip,
        hostname: d.hostname,
        friendlyName: d.friendlyName,
        deviceType: d.type as any,
        isManaged: d.isManaged,
        restrictionStatus: d.restrictionStatus as any,
        connectionStatus: 'CONNECTED' as any,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    if (d.isManaged) {
      createdDeviceIds.push(dev.id);
    }
  }
  console.log(`✓ Devices populated (${initialDevices.length} devices)`);

  // 5. Create Core Sleep Schedule (10:00 PM to 07:00 AM)
  let schedule = await prisma.schedule.findFirst({
    where: { networkId: network.id, name: 'Sleep Time Schedule' },
  });

  if (!schedule) {
    schedule = await prisma.schedule.create({
      data: {
        userId: admin.id,
        networkId: network.id,
        name: 'Sleep Time Schedule',
        startTime: '22:00',
        endTime: '07:00',
        daysOfWeek: JSON.stringify([
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ]),
        timezone: 'Asia/Kolkata',
        isEnabled: true,
        isPaused: false,
        activeOverride: 'NONE' as any,
      },
    });

    for (const devId of createdDeviceIds) {
      await prisma.scheduleDevice.create({
        data: {
          scheduleId: schedule.id,
          deviceId: devId,
        },
      });
    }
    console.log(`✓ Sleep schedule created (10:00 PM - 07:00 AM, 7 days/week) with ${createdDeviceIds.length} assigned managed devices`);
  }

  // 6. Record Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      networkId: network.id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'NETWORK',
      entityId: network.id,
      details: JSON.stringify({ message: 'NightGuard demo environment initialized with standard schedule and devices.' }),
      ipAddress: '127.0.0.1',
    },
  });

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
