import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@angiepretty.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe-Immediately-123!";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Administrateur ANGIE PRETTY",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: Role.ADMIN
      }
    });
  }
  const product = await prisma.product.upsert({
    where: { sku: "DEMO-001" },
    update: {},
    create: { sku: "DEMO-001", name: "Article de démonstration", category: "Vêtements" }
  });
  await prisma.variant.upsert({
    where: { sku: "DEMO-001-NOIR-M" },
    update: {},
    create: {
      sku: "DEMO-001-NOIR-M", productId: product.id, model: "Modèle démo",
      size: "M", color: "Noir", unitPrice: 45000, stockOnHand: 10, alertAt: 3
    }
  });
  console.log(`Seed terminé. Compte admin: ${email}`);
  console.log("Changez immédiatement le mot de passe initial après connexion.");
}
main().finally(() => prisma.$disconnect());
