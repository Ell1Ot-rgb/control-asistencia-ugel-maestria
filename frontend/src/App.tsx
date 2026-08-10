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
      setError("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">CA</div>
        <h1>Control de Asistencia</h1>
        <p className="subtitle">Sistema biométrico · Instituciones educativas</p>
        <label className="form-field">
          <span>Usuario</span>
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Contraseña</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="login-row">
          <label>
            <input type="checkbox" defaultChecked /> Recordarme
          </label>
          <span>Administrador UGEL</span>
        </div>
        {error && <div className="alert-danger">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={loading} type="submit">
          {loading ? "Ingresando" : "Iniciar sesión"}
        </button>
      </form>
    </main>
  );
}

function Shell({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const location = useLocation();
  const title = navigationItems.find((item) =>
    location.pathname.startsWith(item.to),
  )?.label;

  const logout = async () => {
    try {
      await apiClient.delete("/api/v1/auth/sessions/current");
    } finally {
      onLogout();
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">CA</div>
          <span>
            Control de
            <br />
            Asistencia
          </span>
        </div>
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <NavLink className="nav-item" key={item.to} to={item.to}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">CHIQUISTRUKIS · MVP</div>
      </aside>
      <div className="main">
        <header className="header">
          <div className="header-left">{title ?? "Dashboard"}</div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">{session.username.slice(0, 2).toUpperCase()}</div>
              <div className="user-meta">
                <div>{session.username}</div>
                <div className="role">{session.role}</div>
              </div>
            </div>
            <button className="btn btn-sm btn-ghost" type="button" onClick={logout}>
              Salir
            </button>
          </div>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/personal" element={<StaffPage />} />
            <Route path="/carga" element={<ImportPage />} />
            <Route path="/asistencia" element={<AttendancePage />} />
            <Route path="/justificaciones" element={<JustificationsPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [data, setData] = useState<DashboardIndicators | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient
      .get<DashboardIndicators>("/api/v1/dashboard/indicators", {
        params: { month: 7, year: 2026 },
      })
      .then((response) => setData(response.data))
      .catch(() => setError("No se pudo cargar el dashboard"));
  }, []);

  const distribution = data?.mark_distribution ?? {};
  const maxValue = Math.max(1, ...Object.values(distribution));

  return (
    <>
      <PageHeader
        title="Resumen operativo"
        description="Indicadores del sistema y distribución de marcaciones del período"
      />
      <Filters />
      {error && <div className="alert-danger">{error}</div>}
      <div className="kpi-grid compact">
        <KpiCard
          accent="blue"
          label="Archivos cargados"
          value={data?.total_uploaded_files ?? 0}
          trend="Importaciones biométricas"
        />
        <KpiCard
          accent="green"
          label="Empleados activos"
          value={data?.active_staff_members ?? 0}
          trend="Personal en la institución"
        />
      </div>
      <section className="card">
        <div className="card-header">Marcaciones del mes · Julio 2026</div>
        <div className="card-body">
          <div className="chart-bars">
            {statusLabels.map((item) => (
              <div className="chart-bar-wrap" key={item.key}>
                <span className="chart-bar-value">{distribution[item.key] ?? 0}</span>
                <div
                  className={`chart-bar ${item.className}`}
                  style={{
                    height: `${Math.max(
                      8,
                      ((distribution[item.key] ?? 0) / maxValue) * 100,
                    )}%`,
                  }}
                />
                <span className="chart-bar-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="card">
        <div className="card-header">Últimas cargas</div>
        <DataTable
          columns={["Archivo", "Período", "Estado", "Filas"]}
          rows={(data?.recent_imports ?? []).map((item) => [
            item.file_name,
            `${item.period_start ?? "-"} / ${item.period_end ?? "-"}`,
            statusText(item.status),
            String(item.total_rows),
          ])}
          emptyText="Sin cargas registradas"
        />
      </section>
    </>
  );
}

function StaffPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  useEffect(() => {
    apiClient
      .get<StaffMember[]>("/api/v1/staff-members", { params: { is_active: "Y" } })
      .then((response) => setStaffMembers(response.data))
      .catch(() => setStaffMembers([]));
  }, []);

  return (
    <>
      <PageHeader
        title="Personal"
        description="Registro activo vinculado a la institución educativa"
      />
      <Filters showSearch />
      <section className="card">
        <div className="card-header">Personal activo</div>
        <DataTable
          columns={["DNI", "Apellidos y nombres", "Cargo", "Condición", "Estado"]}
          rows={staffMembers.map((item) => [
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
  return (
    <>
      <PageHeader
        title="Carga biométrica"
        description="Archivo, validación de DNI, período detectado y confirmación"
      />
      <section className="card">
        <div className="card-header">Nueva carga</div>
        <div className="card-body">
          <div className="dropzone">
            <strong>Seleccionar archivo CSV</strong>
            <span>Orden original, filas verdes y rojas</span>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="button">
              Subir archivo
            </button>
            <button className="btn btn-danger-outline" type="button">
              Anular carga
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function AttendancePage() {
  return (
    <>
      <PageHeader
        title="Asistencia"
        description="Grilla mensual y panel diario de edición"
      />
      <Filters />
      <div className="attendance-layout">
        <section className="card attendance-grid">
          <div className="card-header">Anexo 03 · Julio 2026</div>
          <DataTable
            columns={["Personal", "01", "02", "03", "04", "05"]}
            rows={[
              ["Quispe Mamani, Maria Elena", "A", "T", "A", "J", "A"],
              ["Huaman Rojas, Carlos Alberto", "A", "A", "F", "A", "A"],
            ]}
          />
        </section>
        <section className="card attendance-panel">
          <div className="card-header">Día</div>
          <div className="card-body panel-stack">
            <KpiCard label="Fecha" value="03" trend="Julio 2026" />
            <span className="badge badge-warning">Tardanza</span>
            <button className="btn btn-secondary" type="button">
              Editar estado
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function JustificationsPage() {
  return (
    <>
      <PageHeader
        title="Justificaciones"
        description="Licencias, permisos y archivos de sustento"
      />
      <section className="card">
        <div className="card-header">Registro</div>
        <div className="card-body form-grid">
          <label className="form-field">
            <span>DNI</span>
            <input placeholder="45678912" />
          </label>
          <label className="form-field">
            <span>Norma</span>
            <input placeholder="LIC" />
          </label>
          <label className="form-field wide">
            <span>Motivo</span>
            <input placeholder="Licencia aprobada" />
          </label>
          <button className="btn btn-primary" type="button">
            Registrar
          </button>
        </div>
      </section>
    </>
  );
}

function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reportes"
        description="Vista previa de Anexo 03 y Anexo 04 desde asistencia"
      />
      <div className="report-layout">
        <section className="card report-filter">
          <div className="card-header">Filtros</div>
          <div className="card-body">
            <Filters vertical />
            <button className="btn btn-primary btn-block" type="button">
              Generar
            </button>
          </div>
        </section>
        <section className="card report-preview">
          <div className="card-header">Vista previa</div>
          <DataTable
            columns={["Reporte", "Fuente", "Formato"]}
            rows={[
              ["Anexo 03", "attendance_day + institution", "JSON"],
              ["Anexo 04", "attendance_day + institution", "JSON"],
            ]}
          />
        </section>
      </div>
    </>
  );
}

function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">{description}</p>
    </div>
  );
}

function Filters({
  showSearch = false,
  vertical = false,
}: {
  showSearch?: boolean;
  vertical?: boolean;
}) {
  return (
    <div className={vertical ? "filters vertical" : "filters"}>
      {showSearch && (
        <label className="form-field grow">
          <span>Buscar</span>
          <input placeholder="DNI o apellidos" />
        </label>
      )}
      <label className="form-field">
        <span>Mes</span>
        <select defaultValue="7">
          <option value="7">Julio</option>
          <option value="6">Junio</option>
          <option value="5">Mayo</option>
        </select>
      </label>
      <label className="form-field">
        <span>Año</span>
        <select defaultValue="2026">
          <option value="2026">2026</option>
        </select>
      </label>
      {!vertical && (
        <div className="filter-actions">
          <button className="btn btn-sm btn-primary" type="button">
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
  accent = "",
}: {
  label: string;
  value: string | number;
  trend: string;
  accent?: string;
}) {
  return (
    <div className={`kpi-card ${accent}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="trend">{trend}</div>
    </div>
  );
}

function DataTable({
  columns,
  rows,
  emptyText = "Sin registros",
}: {
  columns: string[];
  rows: string[][];
  emptyText?: string;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.join("|")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const statusLabels = [
  { key: "present", label: "Asistencia", className: "success" },
  { key: "late", label: "Tardanza", className: "warning" },
  { key: "absent", label: "Inasistencia", className: "danger" },
  { key: "justified", label: "Justificado", className: "info" },
  { key: "leave", label: "Licencia", className: "violet" },
  { key: "permission", label: "Permiso", className: "muted" },
];

function statusText(status: string) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    confirmed: "Confirmada",
    cancelled: "Anulada",
  };
  return labels[status] ?? status;
}

export default App;
