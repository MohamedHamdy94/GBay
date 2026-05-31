import { PrismaClient, Locale } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding categories...');

  const categories = [
    {
      key: 'electronics',
      translations: [
        { locale: Locale.en, name: 'Electronics', slug: 'electronics' },
        { locale: Locale.de, name: 'Elektronik', slug: 'elektronik' },
      ],
      children: [
        {
          key: 'smartphones',
          translations: [
            { locale: Locale.en, name: 'Smartphones', slug: 'smartphones' },
            { locale: Locale.de, name: 'Smartphones', slug: 'smartphones' },
          ],
        },
        {
          key: 'laptops',
          translations: [
            { locale: Locale.en, name: 'Laptops', slug: 'laptops' },
            { locale: Locale.de, name: 'Laptops', slug: 'laptops' },
          ],
        },
      ],
    },
    {
      key: 'fashion',
      translations: [
        { locale: Locale.en, name: 'Fashion', slug: 'fashion' },
        { locale: Locale.de, name: 'Mode', slug: 'mode' },
      ],
      children: [
        {
          key: 'mens-clothing',
          translations: [
            { locale: Locale.en, name: "Men's Clothing", slug: 'mens-clothing' },
            { locale: Locale.de, name: 'Herrenbekleidung', slug: 'herrenbekleidung' },
          ],
        },
        {
          key: 'womens-clothing',
          translations: [
            { locale: Locale.en, name: "Women's Clothing", slug: 'womens-clothing' },
            { locale: Locale.de, name: 'Damenbekleidung', slug: 'damenbekleidung' },
          ],
        },
      ],
    },
    {
      key: 'home',
      translations: [
        { locale: Locale.en, name: 'Home & Garden', slug: 'home-garden' },
        { locale: Locale.de, name: 'Haus & Garten', slug: 'haus-garten' },
      ],
    },
  ];

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { key: cat.key },
      update: {},
      create: {
        key: cat.key,
        translations: {
          create: cat.translations,
        },
      },
    });

    if (cat.children) {
      for (const child of cat.children) {
        await prisma.category.upsert({
          where: { key: child.key },
          update: { parentId: parent.id },
          create: {
            key: child.key,
            parentId: parent.id,
            translations: {
              create: child.translations,
            },
          },
        });
      }
    }
  }

  console.log('Categories seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
