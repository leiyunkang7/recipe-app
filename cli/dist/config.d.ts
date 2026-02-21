export interface Config {
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey: string;
}
export declare function loadConfig(): Config;
