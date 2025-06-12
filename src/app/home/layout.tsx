import ClientLayout from "@/components/ClientLayout"
import { ThemeProvider } from "@/components/ThemeProvider"
import { LanguageProvider } from "@/contexts"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { useRouter } from "next/router"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/login");
  }
  return (
    <>
      <LanguageProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
      </LanguageProvider>
    </>
  )
}
