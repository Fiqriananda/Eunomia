export interface EunomiaConfig {
  apiUrl: string;
  token?: string;
  email?: string;
  password?: string;
  defaultWorkspaceId?: string;
}

export class EunomiaClient {
  private readonly apiUrl: string;
  private token: string | undefined;
  private readonly email: string | undefined;
  private readonly password: string | undefined;
  readonly defaultWorkspaceId: string | undefined;

  constructor(config: EunomiaConfig) {
    this.apiUrl = config.apiUrl.replace(/\/+$/, "");
    this.token = config.token?.trim() || undefined;
    this.email = config.email?.trim() || undefined;
    this.password = config.password || undefined;
    this.defaultWorkspaceId = config.defaultWorkspaceId?.trim() || undefined;
  }

  resolveWorkspaceId(workspaceId?: string): string {
    const resolved = workspaceId?.trim() || this.defaultWorkspaceId;
    if (!resolved) {
      throw new Error(
        "workspaceId wajib diisi (atau set EUNOMIA_WORKSPACE_ID di env). Panggil list_workspaces untuk melihat daftar workspace."
      );
    }
    return resolved;
  }

  private async login(): Promise<string> {
    if (!this.email || !this.password) {
      throw new Error(
        "Auth belum dikonfigurasi. Set EUNOMIA_TOKEN atau EUNOMIA_EMAIL + EUNOMIA_PASSWORD di env."
      );
    }

    const res = await fetch(`${this.apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    const data = (await res.json().catch(() => null)) as {
      accessToken?: string;
      message?: string;
    } | null;

    if (!res.ok || !data?.accessToken) {
      throw new Error(
        `Login Eunomia gagal (HTTP ${res.status}): ${data?.message || res.statusText}`
      );
    }

    this.token = data.accessToken;
    return this.token;
  }

  private async getToken(): Promise<string> {
    return this.token ?? this.login();
  }

  async request<T = unknown>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    options?: {
      query?: Record<string, string | undefined>;
      body?: Record<string, unknown>;
    },
    retried = false
  ): Promise<T> {
    const token = await this.getToken();
    const url = new URL(`${this.apiUrl}${path}`);

    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    });

    // Refresh JWT once if expired and credentials are available
    if (res.status === 401 && !retried && this.email && this.password) {
      this.token = undefined;
      return this.request<T>(method, path, options, true);
    }

    const text = await res.text();
    const parsed = text ? safeJsonParse(text) : null;

    if (!res.ok) {
      const detail =
        typeof parsed === "object" && parsed !== null && "message" in parsed
          ? String((parsed as { message: unknown }).message)
          : text || res.statusText;
      throw new Error(`Eunomia API ${method} ${path} gagal (HTTP ${res.status}): ${detail}`);
    }

    return parsed as T;
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
