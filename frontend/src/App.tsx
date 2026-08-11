import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import apiClient from "./services/apiClient";

type AccessMap = {
  modules: string[];
  operations: Record<string, boolean>;
};

type Session = {
  token: string;
  username: string;
  role: string;
  access: AccessMap;
};

type DashboardIndicators = {
  total_uploaded_files: number;
  active_staff_members: number;
  period: { month: number; year: number };
  mark_distribution: Record<string, number>;
  recent_imports: Array<{
    id: number;
    file_name: string;
    status: string;
    period_start: string | null;
    period_end: string | null;
    total_rows: number;
  }>;
};

type StaffMember = {
  id: number;
  dni: string;
  last_names: string;
  first_names: string;
  job_title: string;
  employment_status: string | null;
  is_active: "Y" | "N";
};

type BiometricImport = {
  id: number;
  file_name: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  total_rows: number;
  matched_rows: number;
  new_rows: number;
  ok_rows: number;
  error_rows: number;
  rows?: Array<{
    order: number;
    dni: string;
    last_names: string;
    first_names: string;
    marked_at: string;
    mark_type: string;
    match: string;
    resolved: boolean;
  }>;
};

type JustificationItem = {
  id: number;
  staff_member_id: number;
  start_date: string;
  end_date: string;
  norm_code: string;
  with_pay: string;
  reason: string | null;
  support_file_path: string | null;
  status: string;
};

type AttendanceDay = {
  id: number;
  attendance_date: string;
  status: string;
  late_minutes?: number;
  observation?: string | null;
};

type Annex03Row = {
  staff_member_id: number;
  dni: string | null;
  full_name: string;
  days: AttendanceDay[];
};

type Annex03Report = { rows: Annex03Row[] };
type Annex04Summary = { present: number; late: number; absent: number; justified: number };
type Annex04Row = {
  staff_member_id: number;
  dni: string | null;
  full_name: string;
  job_title?: string | null;
  summary: Annex04Summary;
};
type Annex04Report = {
  staff_count?: number;
  totals?: Annex04Summary;
  rows: Annex04Row[];
};

const STORAGE_KEY = "chiquistrukis.session";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: "D" },
  { to: "/personal", label: "Personal", icon: "P" },
  { to: "/carga", label: "Carga biométrica", icon: "C" },
  { to: "/asistencia", label: "Asistencia", icon: "A" },
  { to: "/justificaciones", label: "Justificaciones", icon: "J" },
  { to: "/reportes", label: "Reportes", icon: "R" },
];

function readStoredSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("token");
    return null;
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());

  const handleSession = (nextSession: Session | null) => {
    setSession(nextSession);
    if (nextSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      localStorage.setItem("token", nextSession.token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("token");
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={handleSession} />
          )
        }
      />
      <Route
        path="/*"
        element={
          session ? (
            <Shell session={session} onLogout={() => handleSession(null)} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState("director.demo");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post<Session>("/api/v1/auth/sessions", {
        username,
        password,
      });
      onLogin(response.data);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Credenciales incorrectas o servicio no disponible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page login-shell">
      <div className="login-card card">
        <div className="card-header border-none">
          <p className="kicker">RSG N.° 326-2017-MINEDU</p>
          <h1>Control de Asistencia Biometria</h1>
          <p className="subtitle">CHIQUISTRUKIS · Institución Educativa</p>
        </div>
        <form onSubmit={submit} className="card-body form-stack">
          {error && <div className="alert alert-error">{error}</div>}
          <label className="form-field">
            <span>Usuario</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Demo12345"
              required
            />
          </label>

          <div className="callout">
            <strong>Credencial demo disponible:</strong>
            <code>director.demo / Demo12345</code>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Shell({ session, onLogout }: { session: Session; onLogout: () => void }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">C</div>
          <span><strong>CHIQUISTRUKIS</strong><br /><small>UGEL Control</small></span>
        </div>
        <nav className="sidebar-nav">
          {navigationItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}><span className="nav-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info"><div className="user-avatar">{session.username[0]?.toUpperCase()}</div><div className="user-meta"><strong>{session.username}</strong><div>{session.role}</div></div></div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout} type="button" title="Cerrar sesión">Salir</button>
        </div>
      </aside>
      <div className="main">
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 12 }}>
            <div><strong>CHIQUISTRUKIS</strong><span style={{ color: "#64748b", marginLeft: 8 }}>UGEL Control</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="badge badge-success">● Conectado</span><button className="btn btn-ghost btn-sm" onClick={onLogout} type="button">Cerrar sesión</button></div>
          </div>
          <nav style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 10, width: "100%" }}>
            {navigationItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`} style={{ textDecoration: "none", flexShrink: 0 }}>{item.icon} {item.label}</NavLink>)}
          </nav>
        </header>
        <main className="content">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/personal" element={<StaffPage />} />
            <Route path="/carga" element={<ImportPage />} />
            <Route path="/asistencia" element={<AttendancePage />} />
            <Route path="/justificaciones" element={<JustificationsPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}

function Filters({
  vertical = false,
  showSearch = false,
  month = 7,
  year = 2026,
  onMonthChange,
  onYearChange,
  onSearchChange,
}: {
  vertical?: boolean;
  showSearch?: boolean;
  month?: number;
  year?: number;
  onMonthChange?: (m: number) => void;
  onYearChange?: (y: number) => void;
  onSearchChange?: (s: string) => void;
}) {
  return (
    <div className={`filters ${vertical ? "vertical" : ""}`}>
      {showSearch && (
        <label className="form-field">
          <span>Buscar</span>
          <input
            type="text"
            placeholder="DNI o Apellidos..."
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </label>
      )}
      <label className="form-field">
        <span>Mes</span>
        <select
          value={month}
          onChange={(e) => onMonthChange?.(Number(e.target.value))}
        >
          <option value="1">Enero</option>
          <option value="2">Febrero</option>
          <option value="3">Marzo</option>
          <option value="4">Abril</option>
          <option value="5">Mayo</option>
          <option value="6">Junio</option>
          <option value="7">Julio</option>
          <option value="8">Agosto</option>
          <option value="9">Septiembre</option>
          <option value="10">Octubre</option>
          <option value="11">Noviembre</option>
          <option value="12">Diciembre</option>
        </select>
      </label>
      <label className="form-field">
        <span>Año</span>
        <select
          value={year}
          onChange={(e) => onYearChange?.(Number(e.target.value))}
        >
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
      </label>
    </div>
  );
}

function KpiCard({ label, value, trend }: { label: string; value: string | number; trend?: string }) {
  return (
    <div className="kpi-card">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {trend && <span className="trend">{trend}</span>}
    </div>
  );
}

function DataTable({ columns, rows, emptyText = "Sin registros" }: { columns: string[]; rows: ReactNode[][]; emptyText?: string }) {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function DashboardPage() {
  const [indicators, setIndicators] = useState<DashboardIndicators | null>(null);

  useEffect(() => {
    apiClient
      .get<DashboardIndicators>("/api/v1/dashboard/indicators", {
        params: { month: 7, year: 2026 },
      })
      .then((response) => setIndicators(response.data))
      .catch(() => setIndicators(null));
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard de Asistencia"
        description="Resumen de indicadores para la UGEL (RSG N.° 326-2017-MINEDU)"
      />
      <div className="kpi-grid">
        <KpiCard
          label="Personal Activo"
          value={indicators?.active_staff_members ?? "-"}
          trend="Docentes y auxiliares"
        />
        <KpiCard
          label="Archivos Cargados"
          value={indicators?.total_uploaded_files ?? "-"}
          trend="Período actual"
        />
        <KpiCard
          label="Asistencias (A)"
          value={indicators?.mark_distribution?.present ?? 0}
          trend="Puntuales"
        />
        <KpiCard
          label="Tardanzas (T)"
          value={indicators?.mark_distribution?.late ?? 0}
          trend="En minutos"
        />
      </div>
      <section className="card mt-4">
        <div className="card-header">Cargas Biométricas Recientes</div>
        <DataTable
          columns={["ID", "Archivo", "Estado", "Total Filas", "Inicio", "Fin"]}
          rows={
            indicators?.recent_imports?.map((imp) => [
              imp.id,
              imp.file_name,
              imp.status,
              imp.total_rows,
              imp.period_start ?? "-",
              imp.period_end ?? "-",
            ]) ?? []
          }
        />
      </section>
    </>
  );
}

function StaffPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [dni, setDni] = useState("");
  const [lastNames, setLastNames] = useState("");
  const [firstNames, setFirstNames] = useState("");
  const [jobTitle, setJobTitle] = useState("Docente");
  const [employmentStatus, setEmploymentStatus] = useState("Nombrado");
  const [msg, setMsg] = useState("");

  const loadStaff = () => {
    apiClient
      .get<StaffMember[]>("/api/v1/staff-members", { params: { is_active: "Y" } })
      .then((res) => setStaffMembers(res.data))
      .catch(() => setStaffMembers([]));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      await apiClient.post("/api/v1/staff-members", {
        dni,
        last_names: lastNames,
        first_names: firstNames,
        job_title: jobTitle,
        employment_status: employmentStatus,
      });
      setMsg("Personal registrado exitosamente");
      setDni("");
      setLastNames("");
      setFirstNames("");
      setShowModal(false);
      loadStaff();
    } catch {
      setMsg("Error al registrar personal (DNI posiblemente duplicado)");
    }
  };

  const filtered = staffMembers.filter(
    (item) =>
      item.dni.includes(search) ||
      `${item.last_names} ${item.first_names}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Gestión de Personal"
        description="Registro activo de docentes y auxiliares vinculados a la IE"
      />
      <div className="actions mb-3">
        <Filters showSearch onSearchChange={setSearch} />
        <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>
          + Nuevo Personal
        </button>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card card">
            <div className="card-header">Registrar Docente / Auxiliar</div>
            <form onSubmit={handleCreate} className="card-body form-stack">
              <label className="form-field">
                <span>DNI</span>
                <input
                  type="text"
                  maxLength={8}
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="45678912"
                  required
                />
              </label>
              <label className="form-field">
                <span>Apellidos</span>
                <input
                  type="text"
                  value={lastNames}
                  onChange={(e) => setLastNames(e.target.value)}
                  placeholder="Quispe Mamani"
                  required
                />
              </label>
              <label className="form-field">
                <span>Nombres</span>
                <input
                  type="text"
                  value={firstNames}
                  onChange={(e) => setFirstNames(e.target.value)}
                  placeholder="Maria Elena"
                  required
                />
              </label>
              <label className="form-field">
                <span>Cargo</span>
                <select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}>
                  <option value="Docente">Docente</option>
                  <option value="Auxiliar">Auxiliar de Educación</option>
                  <option value="Director">Director</option>
                </select>
              </label>
              <label className="form-field">
                <span>Condición Laboral</span>
                <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}>
                  <option value="Nombrado">Nombrado</option>
                  <option value="Contratado">Contratado</option>
                  <option value="CAS">CAS</option>
                </select>
              </label>
              <div className="actions mt-3">
                <button className="btn btn-primary" type="submit">
                  Guardar
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="card">
        <div className="card-header">Personal Activo ({filtered.length})</div>
        <DataTable
          columns={["DNI", "Apellidos y nombres", "Cargo", "Condición", "Estado"]}
          rows={filtered.map((item) => [
            item.dni,
            `${item.last_names}, ${item.first_names}`,
            item.job_title,
            item.employment_status ?? "-",
            item.is_active === "Y" ? "Activo" : "Inactivo",
          ])}
          emptyText="Sin personal registrado"
        />
      </section>
    </>
  );
}

function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [currentImport, setCurrentImport] = useState<BiometricImport | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("Por favor selecciona un archivo CSV o DAT primero");
      return;
    }
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiClient.post<BiometricImport>("/api/v1/biometric-imports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrentImport(res.data);
      setMessage(`Archivo subido exitosamente en borrador (ID: ${res.data.id})`);
    } catch {
      setMessage("Error al procesar el archivo biométrico");
    } finally {
      setLoading(false);
    }
  };

  const refreshImport = async () => {
    if (!currentImport) return;
    const res = await apiClient.get<BiometricImport>(`/api/v1/biometric-imports/${currentImport.id}`);
    setCurrentImport(res.data);
  };

  const handleResolveNewRows = async () => {
    if (!currentImport?.rows) return;
    setLoading(true);
    setMessage("Registrando nuevos DNI en el sistema...");
    try {
      for (const row of currentImport.rows.filter((item) => !item.resolved)) {
        await apiClient.patch(`/api/v1/biometric-imports/${currentImport.id}/rows/${row.order}`, {
          action: "register_new",
        });
      }
      await refreshImport();
      setMessage("DNI nuevos registrados. Ya puedes confirmar la carga.");
    } catch {
      setMessage("Error al registrar algunos DNI de la carga");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!currentImport) return;
    setLoading(true);
    try {
      const res = await apiClient.post<BiometricImport>(`/api/v1/biometric-imports/${currentImport.id}/confirmation`);
      setCurrentImport(res.data);
      setMessage("¡Carga biométrica confirmada e impactada en asistencia!");
    } catch {
      setMessage("Error al confirmar la carga; resuelve los DNI nuevos primero");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentImport) return;
    setLoading(true);
    try {
      const res = await apiClient.post<BiometricImport>(
        `/api/v1/biometric-imports/${currentImport.id}/cancellation`,
        { reason: "Anulado desde la vista web" },
      );
      setCurrentImport(res.data);
      setMessage("Carga anulada correctamente");
    } catch {
      setMessage("Solo se puede anular una carga confirmada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Carga Biométrica" description="Importación de marcas, validación de DNI y consolidación mensual" />
      {message && <div className="alert alert-info">{message}</div>}
      <section className="card">
        <div className="card-header">Subir Marcaciones (CSV/DAT)</div>
        <div className="card-body form-stack">
          <div className="dropzone">
            <input type="file" accept=".csv,.dat" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? <strong>Archivo seleccionado: {file.name}</strong> : <span>Selecciona o arrastra tu archivo .csv o .dat aquí</span>}
          </div>
          <div className="actions mt-3">
            <button className="btn btn-primary" type="button" onClick={handleUpload} disabled={loading || !file}>
              {loading ? "Subiendo..." : "Subir archivo CSV"}
            </button>
          </div>
        </div>
      </section>
      {currentImport && (
        <section className="card mt-4">
          <div className="card-header">
            Resumen de Carga #{currentImport.id} - Estado: <span className="badge">{currentImport.status}</span>
          </div>
          <div className="card-body">
            <div className="kpi-grid">
              <KpiCard label="Archivo" value={currentImport.file_name} />
              <KpiCard label="Total Filas" value={currentImport.total_rows} />
              <KpiCard label="DNI Coincidentes" value={currentImport.matched_rows} />
              <KpiCard label="Nuevos DNI" value={currentImport.new_rows} />
            </div>
            <div className="actions mt-3">
              {currentImport.status === "draft" && currentImport.new_rows > 0 && (
                <button className="btn btn-primary" type="button" onClick={handleResolveNewRows} disabled={loading}>
                  Auto-Registrar {currentImport.new_rows} DNI Nuevos
                </button>
              )}
              {currentImport.status === "draft" && (
                <button className="btn btn-primary" type="button" onClick={handleConfirm} disabled={loading || currentImport.new_rows > 0}>
                  Confirmar e Impactar Asistencia
                </button>
              )}
              {currentImport.status === "confirmed" && (
                <button className="btn btn-danger-outline" type="button" onClick={handleCancel} disabled={loading}>
                  Anular Carga
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function AttendanceBadge({ day }: { day: AttendanceDay }) {
  if (day.status === "none") return null;
  const dateNum = day.attendance_date?.slice(8) ?? "?";
  const lateMinutes = day.late_minutes ?? 0;
  let label = "-";
  let color = "#475569";
  let background = "#e2e8f0";
  let title = `Día ${dateNum}: Sin registro`;
  if (day.status === "present") {
    label = "A"; color = "#15803d"; background = "#dcfce7"; title = `Día ${dateNum}: Asistencia Puntual`;
  } else if (day.status === "late") {
    label = "T"; color = "#a16207"; background = "#fef9c3"; title = `Día ${dateNum}: Tardanza (+${lateMinutes}m)`;
  } else if (["justified", "leave", "permission"].includes(day.status)) {
    label = "J"; color = "#1d4ed8"; background = "#dbeafe"; title = `Día ${dateNum}: Justificada`;
  } else if (day.status === "absent") {
    label = "I"; color = "#b91c1c"; background = "#fee2e2"; title = `Día ${dateNum}: Inasistencia`;
  }
  return (
    <span title={title} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", color, background, fontWeight: "bold", fontSize: 11, margin: 2 }}>
      {label}
    </span>
  );
}

const handleDownloadOfficialExcel = async (month: number, year: number) => {
  try {
    const response = await apiClient.get("/api/v1/reports/official-excel", { params: { month, year }, responseType: "blob" });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `REPORTE_ASISTENCIA_UGEL_${month}_${year}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    alert("Error al descargar el reporte oficial Excel");
  }
};

const attendanceStatuses = [
  ["none", "Sin registro"],
  ["present", "A - Asistencia"],
  ["late", "T - Tardanza"],
  ["justified", "J - Justificada"],
  ["leave", "LS - Licencia"],
  ["permission", "P - Permiso"],
  ["absent", "I - Inasistencia"],
] as const;

function AttendancePage() {
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);
  const [annexData, setAnnexData] = useState<Annex03Report | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const navigate = useNavigate();
  const daysInMonth = new Date(year, month, 0).getDate();

  useEffect(() => {
    apiClient.get<Annex03Report>("/api/v1/reports/annex-03", { params: { month, year } })
      .then((res) => setAnnexData(res.data))
      .catch(() => setAnnexData(null));
  }, [month, year]);

  const saveAttendance = async (staffId: number, dateValue: string, status: string, lateMinutes = 0) => {
    try {
      const response = await apiClient.patch<AttendanceDay>("/api/v1/reports/annex-03/attendance", {
        month, year, staff_member_id: staffId, attendance_date: dateValue, status,
        late_minutes: status === "late" ? Math.max(1, lateMinutes || 15) : 0,
      });
      setAnnexData((current) => {
        if (!current) return current;
        return {
          ...current,
          rows: current.rows.map((row) => {
            if (row.staff_member_id !== staffId) return row;
            const remaining = row.days.filter((day) => day.attendance_date !== dateValue);
            if (status === "none") return { ...row, days: remaining };
            return { ...row, days: [...remaining, response.data].sort((a, b) => a.attendance_date.localeCompare(b.attendance_date)) };
          }),
        };
      });
      setEditMessage(`Cambio guardado: ${dateValue} · ${status === "none" ? "Sin registro" : status}`);
    } catch {
      setEditMessage("No se pudo guardar el cambio de asistencia");
    }
  };

  return (
    <>
      <PageHeader title="Asistencia Consolidada" description="Grilla mensual editable conforme al Anexo 03 de la RSG N.° 326-2017-MINEDU" />
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <Filters month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
        <button className="btn btn-primary" type="button" onClick={() => handleDownloadOfficialExcel(month, year)}>Generar Excel Oficial (.xlsx)</button>
      </div>
      {editMessage && <div className="alert alert-info">{editMessage}</div>}
      <section className="card mt-3">
        <div className="card-header">Anexo 03 · Período {month}/{year} · Editable antes de generar</div>
        <div className="card-body table-responsive">
          <table className="data-table">
            <thead><tr><th>Personal</th><th>DNI</th><th>Días</th><th>Detalle editable</th></tr></thead>
            <tbody>
              {!annexData?.rows?.length ? (
                <tr><td colSpan={4}>No existen trabajadores activos para este período</td></tr>
              ) : annexData.rows.map((row) => {
                const dayMap = new Map(row.days.map((day) => [day.attendance_date, day]));
                return (
                  <tr key={row.staff_member_id}>
                    <td><button className="btn btn-ghost btn-sm" type="button" title="Haz click para justificar inasistencias o tardanzas de este docente" onClick={() => navigate(`/justificaciones?staff_id=${row.staff_member_id}`)}>{row.full_name}</button></td>
                    <td>{row.dni}</td>
                    <td>{row.days.length} registrados</td>
                    <td><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {Array.from({ length: daysInMonth }, (_, index) => {
                        const dayNumber = index + 1;
                        const dateValue = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
                        const day = dayMap.get(dateValue) ?? { id: 0, attendance_date: dateValue, status: "none", late_minutes: 0 };
                        return <label key={dateValue} title={`Editar día ${dayNumber}`} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                          <select aria-label={`Estado día ${dayNumber} ${row.full_name}`} value={day.status} onChange={(event) => saveAttendance(row.staff_member_id, dateValue, event.target.value, day.late_minutes ?? 0)} style={{ width: 58, fontSize: 10, height: 26 }}>
                            {attendanceStatuses.map(([value, label]) => <option key={value} value={value}>{dayNumber}: {label}</option>)}
                          </select>
                          {day.status === "late" && <input aria-label={`Minutos día ${dayNumber} ${row.full_name}`} type="number" min="1" value={day.late_minutes ?? 15} onChange={(event) => saveAttendance(row.staff_member_id, dateValue, "late", Number(event.target.value))} style={{ width: 48, fontSize: 10, height: 26 }} />}
                          <AttendanceBadge day={day} />
                        </label>;
                      })}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function JustificationsPage() {
  const [searchParams] = useSearchParams();
  const preselectedStaffId = searchParams.get("staff_id");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffId, setStaffId] = useState("");
  const [startDate, setStartDate] = useState("2026-07-10");
  const [endDate, setEndDate] = useState("2026-07-12");
  const [normCode, setNormCode] = useState("LG");
  const [withPay, setWithPay] = useState("Y");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [justifications, setJustifications] = useState<JustificationItem[]>([]);

  const loadJustifications = () => {
    apiClient.get<JustificationItem[]>("/api/v1/justifications")
      .then((res) => setJustifications(res.data))
      .catch(() => setJustifications([]));
  };

  useEffect(() => {
    apiClient.get<StaffMember[]>("/api/v1/staff-members", { params: { is_active: "Y" } })
      .then((res) => {
        setStaffMembers(res.data);
        if (preselectedStaffId && res.data.some((staff) => String(staff.id) === preselectedStaffId)) setStaffId(preselectedStaffId);
        else if (res.data.length > 0) setStaffId(String(res.data[0].id));
      })
      .catch(() => setStaffMembers([]));
    loadJustifications();
  }, [preselectedStaffId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMsg("");
    const formData = new FormData();
    formData.append("staff_member_id", staffId);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);
    formData.append("norm_code", normCode);
    formData.append("with_pay", withPay);
    formData.append("reason", reason);
    if (file) formData.append("support_file", file);
    try {
      await apiClient.post("/api/v1/justifications", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg("Justificación registrada e impactada en asistencia");
      setReason("");
      setFile(null);
      loadJustifications();
    } catch {
      setMsg("Error al registrar la justificación");
    }
  };

  return (
    <>
      <PageHeader title="Justificaciones y Permisos" description="Gestión de licencias con/sin goce y adjunto de sustentos" />
      {msg && <div className="alert alert-info">{msg}</div>}
      <section className="card">
        <div className="card-header">Nueva Justificación</div>
        <form onSubmit={handleSubmit} className="card-body form-grid">
          <label className="form-field"><span>Personal Docente / Auxiliar</span><select value={staffId} onChange={(e) => setStaffId(e.target.value)} required>{staffMembers.map((staff) => <option key={staff.id} value={staff.id}>[{staff.dni}] {staff.last_names}, {staff.first_names} ({staff.job_title})</option>)}</select></label>
          <label className="form-field"><span>Fecha Inicio</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></label>
          <label className="form-field"><span>Fecha Fin</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></label>
          <label className="form-field"><span>Código Norma RSG N.° 326</span><select value={normCode} onChange={(e) => setNormCode(e.target.value)}><option value="LG">LG - Licencia con Goce</option><option value="LS">LS - Licencia sin Goce</option><option value="P">P - Permiso sin Goce</option><option value="J">J - Inasistencia Justificada</option><option value="H">H - Huelga / Paro</option><option value="F">F - Feriado</option></select></label>
          <label className="form-field"><span>Con Goce de Remuneración</span><select value={withPay} onChange={(e) => setWithPay(e.target.value)}><option value="Y">Sí (Con Goce)</option><option value="N">No (Sin Goce)</option></select></label>
          <label className="form-field wide"><span>Motivo / Detalle</span><input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Descripción del motivo de la licencia..." /></label>
          <label className="form-field wide"><span>Sustento Adjunto (PDF/Imagen)</span><input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
          <button className="btn btn-primary" type="submit">Registrar Justificación</button>
        </form>
      </section>
      <section className="card mt-4">
        <div className="card-header">Justificaciones Registradas</div>
        <DataTable columns={["ID", "Personal ID", "Código", "Inicio", "Fin", "Goce", "Motivo", "Estado", "Sustento"]} rows={justifications.map((item) => [item.id, item.staff_member_id, item.norm_code, item.start_date, item.end_date, item.with_pay === "Y" ? "Sí" : "No", item.reason ?? "-", item.status, item.support_file_path ?? "Sin adjunto"])} />
      </section>
    </>
  );
}

function ReportsPage() {
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);
  const [annex04, setAnnex04] = useState<Annex04Report | null>(null);
  const navigate = useNavigate();
  const fetchReports = useCallback(() => {
    apiClient.get<Annex04Report>("/api/v1/reports/annex-04", { params: { month, year } })
      .then((res) => setAnnex04(res.data))
      .catch(() => setAnnex04(null));
  }, [month, year]);
  useEffect(() => { fetchReports(); }, [fetchReports]);
  const rows = annex04?.rows?.map((row) => [
    <button key={row.staff_member_id} className="btn btn-ghost btn-sm" type="button" title="Haz click para justificar inasistencias o tardanzas de este docente" onClick={() => navigate(`/justificaciones?staff_id=${row.staff_member_id}`)}>{row.full_name}</button>,
    row.dni,
    row.job_title ?? "Docente",
    row.summary?.present ?? 0,
    row.summary?.late ?? 0,
    row.summary?.absent ?? 0,
    row.summary?.justified ?? 0,
    row.summary?.absent > 0 ? `${row.summary.absent} días` : "Sin descuento",
  ]) ?? [];
  return (
    <>
      <PageHeader title="Reportes Oficiales UGEL" description="Generación de Anexo 03 y Anexo 04 conforme a la RSG N.° 326-2017-MINEDU" />
      <div className="report-layout">
        <section className="card report-filter"><div className="card-header">Período de Reporte</div><div className="card-body form-stack"><Filters vertical month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} /><button className="btn btn-primary btn-block" type="button" onClick={fetchReports}>Actualizar Consolidado</button><button className="btn btn-primary btn-block" type="button" onClick={() => handleDownloadOfficialExcel(month, year)}>Exportar Excel Oficial (.xlsx)</button></div></section>
        <section className="card report-preview"><div className="card-header">Consolidado Anexo 04 · {month}/{year}</div><div className="card-body"><div className="kpi-grid mb-4"><KpiCard label="Personal Total" value={annex04?.staff_count ?? 0} /><KpiCard label="Asistencias (A)" value={annex04?.totals?.present ?? 0} /><KpiCard label="Tardanzas (T)" value={annex04?.totals?.late ?? 0} /><KpiCard label="Inasistencias (I/L)" value={annex04?.totals?.absent ?? 0} /><KpiCard label="Justificadas (J)" value={annex04?.totals?.justified ?? 0} /></div><DataTable columns={["Personal", "DNI", "Cargo", "A (Días)", "T (Días)", "I (Inasistencias)", "J (Justificadas)", "Descuento Sugerido"]} rows={rows} emptyText="Sin datos consolidados para este período" /></div></section>
      </div>
    </>
  );
}

export default App;
