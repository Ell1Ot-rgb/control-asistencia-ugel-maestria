import { FormEvent, useEffect, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
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

type InconsistencyItem = {
  id: number;
  staff_member_id: number;
  rule_code: string;
  description: string;
  attendance_date: string;
  status: string;
  resolution_type: string | null;
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
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">C</div>
        <h1>Control de Asistencia Biometria</h1>
        <p className="subtitle">CHIQUISTRUKIS · UGEL Control (RSG N.° 326-2017-MINEDU)</p>
        <form onSubmit={submit} className="form-stack">
          {error && <div className="alert-danger">{error}</div>}
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

          <div className="alert alert-info" style={{ fontSize: "12px", margin: "12px 0" }}>
            <strong>Credencial demo disponible:</strong> <code>director.demo / Demo12345</code>
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Shell({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">C</div>
          <span>
            <strong>CHIQUISTRUKIS</strong>
            <br />
            <small style={{ color: "#94a3b8" }}>UGEL Control</small>
          </span>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="user-info">
            <div className="user-avatar">{session.username[0]?.toUpperCase()}</div>
            <div className="user-meta">
              <strong>{session.username}</strong>
              <div className="role">{session.role}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onLogout}
            type="button"
            title="Cerrar sesión"
            style={{ color: "#ef4444" }}
          >
            Salir
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="header-left">{location.pathname}</div>
          <div className="header-right">
            <span className="badge badge-success" style={{ background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
              ● Backend Conectado
            </span>
          </div>
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
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">{description}</p>
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
        <label className="form-field grow">
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
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {trend && <div className="trend">{trend}</div>}
    </div>
  );
}

function DataTable({ columns, rows, emptyText = "Sin registros" }: { columns: string[]; rows: (string | number)[][]; emptyText?: string }) {
  return (
    <div className="table-responsive">
      <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
            {columns.map((col, idx) => (
              <th key={idx} style={{ padding: "10px 12px", fontWeight: "600" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: "10px 12px" }}>{cell}</td>
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
      <section className="card">
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
      <div className="filters" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Filters showSearch onSearchChange={setSearch} />
        <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>
          + Nuevo Personal
        </button>
      </div>

      {msg && <div className="alert alert-info" style={{ padding: "10px", margin: "10px 0", background: "#dbeafe" }}>{msg}</div>}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ maxWidth: "450px", width: "100%", padding: "20px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>Registrar Docente / Auxiliar</h2>
            <form onSubmit={handleCreate} className="form-stack">
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
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
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
      setMessage("Por favor selecciona un archivo CSV primero");
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
      setMessage("Error al procesar el archivo CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!currentImport) return;
    setLoading(true);
    try {
      const res = await apiClient.post<BiometricImport>(
        `/api/v1/biometric-imports/${currentImport.id}/confirmation`
      );
      setCurrentImport(res.data);
      setMessage("¡Carga biométrica confirmada e impactada en asistencia!");
    } catch {
      setMessage("Error al confirmar la carga (verifique que no existan filas sin resolver)");
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
        { reason: "Anulado desde la vista web" }
      );
      setCurrentImport(res.data);
      setMessage("Carga anulada correctamente");
    } catch {
      setMessage("Error al anular la carga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Carga Biométrica"
        description="Importación de marcas, validación de DNI y consolidación mensual"
      />
      {message && <div className="alert alert-info" style={{ padding: "10px", marginBottom: "16px", background: "#dbeafe" }}>{message}</div>}

      <section className="card">
        <div className="card-header">Subir Marcaciones (CSV)</div>
        <div className="card-body">
          <div style={{ border: "2px dashed #cbd5e1", borderRadius: "8px", padding: "24px", textAlign: "center", background: "#fafbfc" }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div style={{ marginTop: "8px" }}><strong>Archivo seleccionado: {file.name}</strong></div>
            ) : (
              <div style={{ color: "#64748b", marginTop: "8px" }}>Selecciona un archivo .csv con marcas del reloj biométrico</div>
            )}
          </div>
          <div style={{ marginTop: "16px" }}>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? "Subiendo..." : "Subir archivo CSV"}
            </button>
          </div>
        </div>
      </section>

      {currentImport && (
        <section className="card" style={{ marginTop: "16px" }}>
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

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              {currentImport.status === "draft" && (
                <>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading}
                    style={{ background: "#16a34a" }}
                  >
                    Confirmar e Impactar Asistencia
                  </button>
                  <button
                    className="btn btn-danger-outline"
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Anular Carga
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function AttendancePage() {
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);
  const [annexData, setAnnexData] = useState<any>(null);
  const [inconsistencies, setInconsistencies] = useState<InconsistencyItem[]>([]);

  useEffect(() => {
    apiClient
      .get("/api/v1/reports/annex-03", { params: { month, year } })
      .then((res) => setAnnexData(res.data))
      .catch(() => setAnnexData(null));

    apiClient
      .get<InconsistencyItem[]>("/api/v1/inconsistencies")
      .then((res) => setInconsistencies(res.data))
      .catch(() => setInconsistencies([]));
  }, [month, year]);

  const rows =
    annexData?.rows?.map((r: any) => [
      r.full_name,
      r.dni,
      r.days?.length ?? 0,
      r.days?.map((d: any) => `${d.attendance_date.slice(8)}:${d.status}`).join(" | ") || "Sin registros",
    ]) ?? [];

  return (
    <>
      <PageHeader
        title="Asistencia Consolidada"
        description="Grilla mensual por personal docente y auxiliar (Anexo 03)"
      />
      <Filters month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />

      <section className="card" style={{ marginTop: "16px" }}>
        <div className="card-header">
          Anexo 03 · Período {month}/{year}
        </div>
        <DataTable
          columns={["Personal", "DNI", "Días Registrados", "Detalle"]}
          rows={rows}
          emptyText="No existen marcaciones consolidadas para este período"
        />
      </section>

      {inconsistencies.length > 0 && (
        <section className="card" style={{ marginTop: "16px" }}>
          <div className="card-header" style={{ color: "#b91c1c" }}>
            Inconsistencias Detectadas ({inconsistencies.length})
          </div>
          <DataTable
            columns={["ID", "Personal ID", "Regla", "Descripción", "Fecha", "Estado"]}
            rows={inconsistencies.map((inc) => [
              inc.id,
              inc.staff_member_id,
              inc.rule_code,
              inc.description,
              inc.attendance_date,
              inc.status,
            ])}
          />
        </section>
      )}
    </>
  );
}

function JustificationsPage() {
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

  useEffect(() => {
    apiClient
      .get<StaffMember[]>("/api/v1/staff-members", { params: { is_active: "Y" } })
      .then((res) => {
        setStaffMembers(res.data);
        if (res.data.length > 0) {
          setStaffId(String(res.data[0].id));
        }
      })
      .catch(() => setStaffMembers([]));

    loadJustifications();
  }, []);

  const loadJustifications = () => {
    apiClient
      .get<JustificationItem[]>("/api/v1/justifications")
      .then((res) => setJustifications(res.data))
      .catch(() => setJustifications([]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");

    const formData = new FormData();
    formData.append("staff_member_id", staffId);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);
    formData.append("norm_code", normCode);
    formData.append("with_pay", withPay);
    formData.append("reason", reason);
    if (file) {
      formData.append("support_file", file);
    }

    try {
      await apiClient.post("/api/v1/justifications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      <PageHeader
        title="Justificaciones y Permisos"
        description="Gestión de licencias con/sin goce y adjunto de sustentos"
      />
      {msg && <div className="alert alert-info" style={{ padding: "10px", marginBottom: "16px", background: "#dbeafe" }}>{msg}</div>}

      <section className="card">
        <div className="card-header">Nueva Justificación</div>
        <form onSubmit={handleSubmit} className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <label className="form-field">
            <span>Personal Docente / Auxiliar</span>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.dni}] {s.last_names}, {s.first_names} ({s.job_title})
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Fecha Inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Fecha Fin</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Código Norma RSG N.° 326</span>
            <select value={normCode} onChange={(e) => setNormCode(e.target.value)}>
              <option value="LG">LG - Licencia con Goce</option>
              <option value="LS">LS - Licencia sin Goce</option>
              <option value="P">P - Permiso sin Goce</option>
              <option value="J">J - Inasistencia Justificada</option>
              <option value="H">H - Huelga / Paro</option>
              <option value="F">F - Feriado</option>
            </select>
          </label>
          <label className="form-field">
            <span>Con Goce de Remuneración</span>
            <select value={withPay} onChange={(e) => setWithPay(e.target.value)}>
              <option value="Y">Sí (Con Goce)</option>
              <option value="N">No (Sin Goce)</option>
            </select>
          </label>
          <label className="form-field" style={{ gridColumn: "1 / -1" }}>
            <span>Motivo / Detalle</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descripción del motivo de la licencia..."
            />
          </label>
          <label className="form-field" style={{ gridColumn: "1 / -1" }}>
            <span>Sustento Adjunto (PDF/Imagen)</span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
            <button className="btn btn-primary" type="submit">
              Registrar Justificación
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{ marginTop: "16px" }}>
        <div className="card-header">Justificaciones Registradas</div>
        <DataTable
          columns={["ID", "Personal ID", "Código", "Inicio", "Fin", "Goce", "Estado", "Sustento"]}
          rows={justifications.map((j) => [
            j.id,
            j.staff_member_id,
            j.norm_code,
            j.start_date,
            j.end_date,
            j.with_pay === "Y" ? "Sí" : "No",
            j.status,
            j.support_file_path ?? "Sin adjunto",
          ])}
        />
      </section>
    </>
  );
}

function ReportsPage() {
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);
  const [annex04, setAnnex04] = useState<any>(null);

  const fetchReports = () => {
    apiClient
      .get("/api/v1/reports/annex-04", { params: { month, year } })
      .then((res) => setAnnex04(res.data))
      .catch(() => setAnnex04(null));
  };

  useEffect(() => {
    fetchReports();
  }, [month, year]);

  const reportRows =
    annex04?.rows?.map((r: any) => [
      r.full_name,
      r.dni,
      r.job_title ?? "Docente",
      r.summary?.present ?? 0,
      r.summary?.late ?? 0,
      r.summary?.absent ?? 0,
      r.summary?.justified ?? 0,
      r.summary?.absent > 0 ? `${r.summary.absent} días` : "Sin descuento",
    ]) ?? [];

  return (
    <>
      <PageHeader
        title="Reportes Oficiales UGEL"
        description="Generación de Anexo 03 y Anexo 04 conforme a la RSG N.° 326-2017-MINEDU"
      />
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "16px" }}>
        <section className="card">
          <div className="card-header">Período de Reporte</div>
          <div className="card-body">
            <Filters vertical month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
            <button className="btn btn-primary btn-block" style={{ marginTop: "16px" }} type="button" onClick={fetchReports}>
              Actualizar Consolidado
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Consolidado Anexo 04 · {month}/{year}</div>
          <div className="card-body">
            <div className="kpi-grid" style={{ marginBottom: "16px" }}>
              <KpiCard label="Personal Total" value={annex04?.staff_count ?? 0} />
              <KpiCard label="Asistencias (A)" value={annex04?.totals?.present ?? 0} />
              <KpiCard label="Tardanzas (T)" value={annex04?.totals?.late ?? 0} />
              <KpiCard label="Inasistencias (I/L)" value={annex04?.totals?.absent ?? 0} />
              <KpiCard label="Justificadas (J)" value={annex04?.totals?.justified ?? 0} />
            </div>

            <DataTable
              columns={["Personal", "DNI", "Cargo", "A (Días)", "T (Días)", "I (Inasistencias)", "J (Justificadas)", "Descuento Sugerido"]}
              rows={reportRows}
              emptyText="Sin datos consolidados para este período"
            />
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
