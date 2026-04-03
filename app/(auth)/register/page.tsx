import { prisma } from "@/lib/prisma";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  // On récupère la liste des entreprises côté serveur
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <RegisterForm companies={companies} />;
}
