import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:VilliantVault@161.248.146.117:5432/ponotes?schema=public'
    }
  }
});

const API_KEY = 'pk_5db6310789042c6353e6dbd58aba136eae5bf46c4147ca60cf2584da4d0c64d9';

async function main() {
  console.log('Connecting to VPS database...');

  // Find user by API key
  const keyHash = crypto.createHash('sha256').update(API_KEY).digest('hex');
  const apiKey = await prisma.apiKey.findUnique({
    where: { key_hash: keyHash },
    include: { user: true },
  });

  if (!apiKey) {
    console.log('API key not found!');
    return;
  }

  const userId = apiKey.user.id;
  console.log(`User: ${apiKey.user.email} (${userId})`);

  // Find platform "Desktop HUD"
  const platform = await prisma.platform.findFirst({
    where: { name: 'Desktop HUD' },
  });

  if (!platform) {
    console.log('Platform "Desktop HUD" not found!');
    return;
  }

  // Count players to delete
  const players = await prisma.player.findMany({
    where: { user_id: userId, platform_id: platform.id },
    select: { id: true, name: true },
  });

  console.log(`Found ${players.length} Desktop HUD players to delete:`);
  players.forEach(p => console.log(`  - ${p.name}`));

  // Delete related data first (foreign keys)
  const playerIds = players.map(p => p.id);

  const deletedNotes = await prisma.note.deleteMany({
    where: { player_id: { in: playerIds } },
  });
  console.log(`Deleted ${deletedNotes.count} notes`);

  const deletedStats = await prisma.playerStats.deleteMany({
    where: { player_id: { in: playerIds } },
  });
  console.log(`Deleted ${deletedStats.count} stats`);

  // Delete system logs related to these players
  const deletedLogs = await prisma.systemLog.deleteMany({
    where: { user_id: userId, event_type: 'DESKTOP_SYNC' },
  });
  console.log(`Deleted ${deletedLogs.count} sync logs`);

  const deletedPlayers = await prisma.player.deleteMany({
    where: { user_id: userId, platform_id: platform.id },
  });
  console.log(`Deleted ${deletedPlayers.count} players`);

  console.log('Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
