import Link from "next/link"
import { Calendar, LayoutDashboard, LogOut, Stethoscope, Users, UserCog, FileText } from "lucide-react"
import { logout } from "@/app/actions/auth"

interface SidebarProps {
  userRole: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const isAdmin = userRole === "ADMIN"

  return (
    <div className="w-64 border-r bg-slate-950 text-white min-h-screen p-4 flex flex-col gap-4 print:hidden">
      <div className="mb-6 px-2 mt-4 text-xl font-bold tracking-tight text-blue-400">
        Expediente Clínico
      </div>

      <nav className="flex space-y-1 flex-col flex-1">
        <Link
          href="/dashboard"
          className="flex items-center px-3 py-2.5 text-sm font-medium hover:bg-slate-800 rounded-md gap-3 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>

        <Link
          href="/pacientes"
          className="flex items-center px-3 py-2.5 text-sm font-medium hover:bg-slate-800 rounded-md gap-3 transition-colors"
        >
          <Users className="h-4 w-4" /> Pacientes
        </Link>
        <Link
          href="/pacientes/importar"
          className="flex items-center px-3 py-1.5 ml-4 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md gap-3 transition-colors"
        >
          <FileText className="h-3 w-3" /> Importar Excel
        </Link>

        <Link
          href="/agenda"
          className="flex items-center px-3 py-2.5 text-sm font-medium hover:bg-slate-800 rounded-md gap-3 transition-colors"
        >
          <Calendar className="h-4 w-4" /> Agenda
        </Link>

        <Link
          href="/reportes"
          className="flex items-center px-3 py-2.5 text-sm font-medium hover:bg-slate-800 rounded-md gap-3 transition-colors"
        >
          <FileText className="h-4 w-4" /> Reportes
        </Link>

        <div className="pt-4 mt-2 border-t border-slate-800">
          <Link
            href="/consultas/nueva"
            className="flex items-center px-3 py-2.5 text-sm font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-md gap-3 transition-colors"
          >
            <Stethoscope className="h-4 w-4" /> Iniciar Consulta
          </Link>
        </div>

        {isAdmin && (
          <div className="pt-4 mt-2 border-t border-slate-800">
            <Link
              href="/admin/usuarios"
              className="flex items-center px-3 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-600/10 rounded-md gap-3 transition-colors"
            >
              <UserCog className="h-4 w-4" /> Usuarios
            </Link>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 pt-4">
        <form action={logout}>
          <button
            id="logout-btn"
            type="submit"
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 rounded-md gap-3 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
