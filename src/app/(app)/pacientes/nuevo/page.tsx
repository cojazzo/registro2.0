import { createPatient } from "@/app/actions/pacientes"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function NuevoPacientePage() {
  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/pacientes" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Alta de Paciente</h2>
          <p className="text-muted-foreground mt-1">Registra la ficha clínica del nuevo paciente.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <form action={createPatient} className="space-y-8">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre(s) *</Label>
                  <Input id="firstName" name="firstName" required placeholder="Ej. Juan Carlos" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input id="lastName" name="lastName" required placeholder="Ej. Pérez García" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Fecha de Nacimiento *</Label>
                  <Input id="dob" name="dob" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Sexo *</Label>
                  <select 
                    id="gender" 
                    name="gender" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Seleccione...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curp">CURP (Opcional)</Label>
                  <Input id="curp" name="curp" placeholder="Ej. PEGJ800510XXXXXX" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicalId">ID Clínico (Opcional)</Label>
                  <Input id="clinicalId" name="clinicalId" placeholder="Ej. CLIN-9923" className="uppercase" />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Datos de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono Móvil</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="Ej. 55 1234 5678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
                  <Input id="email" name="email" type="email" placeholder="paciente@correo.com" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <h4 className="text-sm font-medium text-slate-600 mt-2 mb-1">Dirección Física (Opcional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-xs">Calle y número</Label>
                      <Input id="street" name="street" placeholder="Ej. Av. Reforma 222" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood" className="text-xs">Colonia</Label>
                      <Input id="neighborhood" name="neighborhood" placeholder="Ej. Juárez" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-xs">Código Postal (CP)</Label>
                      <Input id="zipCode" name="zipCode" placeholder="Ej. 06600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs">Ciudad / Municipio</Label>
                      <Input id="city" name="city" placeholder="Ej. Cuauhtémoc" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="state" className="text-xs">Estado</Label>
                      <Input id="state" name="state" placeholder="Ej. Ciudad de México" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Médica Inicial */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Información de Salud Inicial</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mainDiagnosis">Diagnóstico Principal (Motivo de Seguimiento)</Label>
                  <Input id="mainDiagnosis" name="mainDiagnosis" placeholder="Ej. Hipertensión Arterial Sistémica" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones Administrativas / Generales</Label>
                  <textarea 
                    id="observations" 
                    name="observations" 
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[100px]"
                    placeholder="Detalles relevantes al registro, alergias críticas, etc."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md flex items-center gap-2 font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                Guardar y Abrir Expediente
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
