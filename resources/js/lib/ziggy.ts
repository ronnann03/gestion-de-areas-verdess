interface RouteDef {
    uri: string;
    methods: string[];
}

declare global {
    interface Window {
        Ziggy?: {
            url?: string;
            port?: number;
            defaults?: Record<string, any>;
            routes?: Record<string, RouteDef>;
        };
        route?: typeof route;
    }
}

export function route(name?: string, params?: any): any {
    if (!name) {
        return {
            current: (pattern?: string) => {
                const path = window.location.pathname.replace(/^\//, '');
                if (!pattern) return path;
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(path);
            }
        };
    }

    const routes = window.Ziggy?.routes || {};
    const routeInfo = routes[name];
    if (!routeInfo) {
        return `/${name.replace(/\./g, '/')}`;
    }

    let uri = routeInfo.uri;
    if (params !== undefined && params !== null) {
        if (typeof params === 'object' && !Array.isArray(params)) {
            for (const [key, val] of Object.entries(params)) {
                if (uri.includes(`{${key}}`)) {
                    uri = uri.replace(`{${key}}`, encodeURIComponent(String(val)));
                } else if (uri.includes(`{${key}?}`)) {
                    uri = uri.replace(`{${key}?}`, encodeURIComponent(String(val)));
                }
            }
        } else {
            uri = uri.replace(/\{[a-zA-Z_]+\??\}/, encodeURIComponent(String(params)));
        }
    }
    uri = uri.replace(/\/\{[a-zA-Z_]+\?\}/g, '');

    return uri.startsWith('/') ? uri : `/${uri}`;
}

if (typeof window !== 'undefined') {
    (window as any).route = route;
}

export default route;
