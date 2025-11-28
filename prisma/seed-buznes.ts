import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBuznes() {
  console.log('Seeding Buznes data...')

  // Create sample clients
  const clients = await Promise.all([
    prisma.buznesiaClient.create({
      data: {
        name: 'Wardah',
        industry: 'Beauty & Cosmetics'
      }
    }),
    prisma.buznesiaClient.create({
      data: {
        name: 'Paragon',
        industry: 'Beauty & Cosmetics'
      }
    }),
    prisma.buznesiaClient.create({
      data: {
        name: 'Lenovo',
        industry: 'Technology'
      }
    })
  ])

  console.log(`Created ${clients.length} clients`)

  // Create sample campaigns
  const campaigns = await Promise.all([
    prisma.buznesiaCampaign.create({
      data: {
        name: 'Wardah Festive Twitter',
        year: 2024,
        month: 3,
        clientId: clients[0].id
      }
    }),
    prisma.buznesiaCampaign.create({
      data: {
        name: 'Paragon Beauty Launch',
        year: 2024,
        month: 5,
        clientId: clients[1].id
      }
    }),
    prisma.buznesiaCampaign.create({
      data: {
        name: 'Lenovo Gaming Series',
        year: 2024,
        month: 8,
        clientId: clients[2].id
      }
    })
  ])

  console.log(`Created ${campaigns.length} campaigns`)

  // Create sample influencers
  const influencers = await Promise.all([
    prisma.buznesiaInfluencer.create({
      data: {
        socmedHandle: 'raffinagita1717',
        platform: 'Instagram',
        tier: 'Mega',
        followers: 62340000,
        kolCategory: 'Beauty & Lifestyle'
      }
    }),
    prisma.buznesiaInfluencer.create({
      data: {
        socmedHandle: 'nul8',
        platform: 'Instagram',
        tier: 'Macro',
        followers: 946702228,
        kolCategory: 'Beauty & Lifestyle'
      }
    }),
    prisma.buznesiaInfluencer.create({
      data: {
        socmedHandle: 'gita_ju',
        platform: 'Instagram',
        tier: 'Mega',
        followers: 156400000,
        kolCategory: 'Beauty & Lifestyle'
      }
    }),
    prisma.buznesiaInfluencer.create({
      data: {
        socmedHandle: 'felisyanaftaly',
        platform: 'Instagram',
        tier: 'Mega',
        followers: 142000000,
        kolCategory: 'Beauty & Lifestyle'
      }
    }),
    prisma.buznesiaInfluencer.create({
      data: {
        socmedHandle: 'willeazam',
        platform: 'TikTok',
        tier: 'Mega',
        followers: 126000000,
        kolCategory: 'Beauty & Lifestyle'
      }
    })
  ])

  console.log(`Created ${influencers.length} influencers`)

  // Create sample content
  const contents = await Promise.all([
    // Wardah campaign content
    prisma.buznesiaContent.create({
      data: {
        campaignId: campaigns[0].id,
        influencerId: influencers[0].id,
        sow: 'IG Reels',
        impressions: 1453163,
        reach: 8164088,
        engagement: 103400,
        views: 1950089,
        likes: 11000,
        comments: 283,
        shares: 104000,
        saves: 1,
        cost: 85000000,
        uploadDate: new Date('2024-03-15')
      }
    }),
    prisma.buznesiaContent.create({
      data: {
        campaignId: campaigns[0].id,
        influencerId: influencers[1].id,
        sow: 'IG Reels',
        impressions: 946702228,
        reach: 371790,
        engagement: 273346,
        views: 273346,
        likes: 41900,
        comments: 693,
        shares: 21000,
        saves: 0,
        cost: 24799000,
        uploadDate: new Date('2024-03-18')
      }
    }),
    // Paragon campaign content
    prisma.buznesiaContent.create({
      data: {
        campaignId: campaigns[1].id,
        influencerId: influencers[2].id,
        sow: 'IG Story',
        impressions: 345288700,
        reach: 302443,
        engagement: 102778,
        views: 102778,
        likes: 34200,
        comments: 714,
        shares: 28700,
        saves: 0,
        cost: 18000000,
        uploadDate: new Date('2024-05-10')
      }
    }),
    // Lenovo campaign content
    prisma.buznesiaContent.create({
      data: {
        campaignId: campaigns[2].id,
        influencerId: influencers[3].id,
        sow: 'IG Photo',
        impressions: 227749400,
        reach: 200841,
        engagement: 18872,
        views: 0,
        likes: 18000,
        comments: 872,
        shares: 0,
        saves: 0,
        cost: 14000000,
        uploadDate: new Date('2024-08-20')
      }
    }),
    prisma.buznesiaContent.create({
      data: {
        campaignId: campaigns[2].id,
        influencerId: influencers[4].id,
        sow: 'TT Video',
        impressions: 620803598,
        reach: 346012,
        engagement: 1183460,
        views: 1479323,
        likes: 110875,
        comments: 110,
        shares: 0,
        saves: 0,
        cost: 5000000,
        uploadDate: new Date('2024-08-22')
      }
    })
  ])

  console.log(`Created ${contents.length} content entries`)
  console.log('Buznes data seeding completed!')
}

seedBuznes()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
