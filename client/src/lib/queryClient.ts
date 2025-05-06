import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface ApiRequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest(
  method: string,
  route: string,
  body?: unknown,
  customHeaders?: Record<string, string>
) {
  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(route, options);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorText;
    } catch (e) {
      errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  return response;
}

interface GetQueryFnOptions {
  on401?: "returnUndefined" | "returnNull" | "throwError";
}

export function getQueryFn(options: GetQueryFnOptions = {}) {
  return async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> => {
    const endpoint = queryKey[0] as string;
    const response = await fetch(endpoint, {
      credentials: "include",
    });

    if (response.status === 401 && options.on401) {
      if (options.on401 === "returnUndefined") return undefined;
      if (options.on401 === "returnNull") return null;
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch (e) {
        errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    // Se a resposta for vazia, não tente fazer o parse de JSON
    if (response.status === 204 || (response.headers.get('Content-Length') === '0')) {
      return undefined;
    }

    try {
      const text = await response.text();
      // Se for uma string vazia, retorne undefined
      if (!text) return undefined;
      
      // Tenta fazer parse do JSON
      return JSON.parse(text);
    } catch (error) {
      console.error("Erro ao fazer parse da resposta JSON:", error);
      throw new Error("Erro ao processar resposta do servidor");
    }
  };
}