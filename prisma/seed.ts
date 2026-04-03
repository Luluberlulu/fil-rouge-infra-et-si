import { PrismaClient } from "../generated/client/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const companies = [
  {
    name: "Innovatech",
    address: "12 rue de la République, 75001 Paris",
    phone: "01 23 45 67 89",
    admin: { username: "alice_admin", email: "alice@innovatech.fr", password: "password123" },
    rooms: [
      { name: "Salle Einstein", capacity: 10, description: "Salle de réunion lumineuse avec vue sur la cour.", equipment: ["Projecteur 4K", "Tableau blanc", "Vidéoconférence"] },
      { name: "Salle Curie", capacity: 6, description: "Petite salle pour les réunions d'équipe.", equipment: ["Écran TV", "Tableau blanc"] },
    ],
  },
  {
    name: "TechVision",
    address: "8 avenue des Champs-Élysées, 75008 Paris",
    phone: "01 87 65 43 21",
    admin: { username: "bob_admin", email: "bob@techvision.fr", password: "password123" },
    rooms: [
      { name: "War Room", capacity: 20, description: "Grande salle pour les séminaires.", equipment: ["Double projecteur", "Système audio", "Vidéoconférence", "Tableau interactif"] },
      { name: "Focus Room", capacity: 4, description: "Cabine de travail calme.", equipment: ["Écran TV"] },
      { name: "Open Space Lounge", capacity: 15, description: "Espace collaboratif.", equipment: ["Tableau blanc", "Prises USB"] },
    ],
  },
  {
    name: "GreenOffice Solutions",
    address: "3 allée des Pins, 69002 Lyon",
    phone: "04 56 78 90 12",
    admin: { username: "carol_admin", email: "carol@greenoffice.fr", password: "password123" },
    rooms: [
      { name: "Salle Zen", capacity: 8, description: "Salle apaisante.", equipment: ["Tableau blanc", "Post-its connectés"] },
      { name: "Salle Prairie", capacity: 12, description: "Salle polyvalente.", equipment: ["Projecteur", "Vidéoconférence"] },
    ],
  },
  {
    name: "StartupHub",
    address: "27 rue du Palais, 33000 Bordeaux",
    phone: "05 12 34 56 78",
    admin: { username: "david_admin", email: "david@startuphub.fr", password: "password123" },
    rooms: [
      { name: "Brainstorm Room", capacity: 8, description: "Session créativité.", equipment: ["Murs en verre scriptibles", "Tableau magnétique"] },
      { name: "Investor Room", capacity: 6, description: "Rencontres partenaires.", equipment: ["Écran 4K", "Cafetière", "Vidéoconférence"] },
    ],
  },
  {
    name: "Axis Consulting",
    address: "15 rue de la Bourse, 13001 Marseille",
    phone: "04 91 23 45 67",
    admin: { username: "emma_admin", email: "emma@axisconsulting.fr", password: "password123" },
    rooms: [
      { name: "Salle Stratégie", capacity: 16, description: "Présentations clients.", equipment: ["Vidéoprojecteur HD", "Système de conférence", "Tableau interactif"] },
      { name: "Phone Box A", capacity: 1, description: "Cabine individuelle.", equipment: ["Bureau assis-debout", "Casque audio"] },
      { name: "Phone Box B", capacity: 1, description: "Cabine individuelle.", equipment: ["Bureau assis-debout", "Casque audio"] },
    ],
  },
];

async function main() {
  console.log("🌱 Démarrage du seed...\n");

  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.companyUser.deleteMany();
  await prisma.room.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Base de données nettoyée.\n");

  // ─────────────────────────────────────────────────────
  // 1. COMPTE SUPER ADMIN DÉDIÉ (User.isAdmin = true)
  //    Ce compte n'est lié à aucune entreprise.
  //    Il a accès à tout via /dashboard/admin
  // ─────────────────────────────────────────────────────
  const superAdminPassword = await bcrypt.hash("superadmin123", 10);
  await prisma.user.create({
    data: {
      username: "Super Admin",
      email: "admin@room-manager.fr",
      password: superAdminPassword,
      isAdmin: true, // 👑 Super Admin
    },
  });
  console.log("👑 Super Admin créé : admin@room-manager.fr / superadmin123\n");


  // ─────────────────────────────────────────────────────
  // 2. ENTREPRISES + COMPANY ADMINS
  //    Note : User.isAdmin = false (ils ne sont admins que
  //    dans leur entreprise via CompanyUser.isAdmin = true)
  // ─────────────────────────────────────────────────────
  for (const data of companies) {
    const company = await prisma.company.create({
      data: { name: data.name, address: data.address, phone: data.phone },
    });

    const hashedPassword = await bcrypt.hash(data.admin.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.admin.username,
        email: data.admin.email,
        password: hashedPassword,
        isAdmin: false, // ← Pas de privilèges super-admin
      },
    });

    // Lien avec l'entreprise : isAdmin = true (Company Admin)
    await prisma.companyUser.create({
      data: { userId: user.id, companyId: company.id, isAdmin: true },
    });

    for (const room of data.rooms) {
      await prisma.room.create({
        data: { companyId: company.id, name: room.name, capacity: room.capacity, description: room.description, equipment: room.equipment },
      });
    }

    console.log(`✅ ${company.name} — Company Admin: ${user.email} — ${data.rooms.length} salle(s)`);
  }

  console.log("\n🎉 Seed terminé avec succès !");
}

main()
  .catch((e) => { console.error("❌ Erreur:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
