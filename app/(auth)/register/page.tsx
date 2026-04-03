import { prisma } from "@/lib/prisma";
import RegisterForm from "./RegisterForm";

// Forcer le rendu dynamique : cette page dépend de la DB (runtime),
// elle ne peut pas être pré-rendue au moment du build Docker.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  // On récupère la liste des entreprises côté serveur
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <RegisterForm companies={companies} />;
}
