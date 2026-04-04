declare module 'table' {
  export interface TableBorder {
    topBody?: string;
    topJoin?: string;
    topLeft?: string;
    topRight?: string;
    bottomBody?: string;
    bottomJoin?: string;
    bottomLeft?: string;
    bottomRight?: string;
    bodyLeft?: string;
    bodyRight?: string;
    bodyJoin?: string;
    joinBody?: string;
    joinLeft?: string;
    joinRight?: string;
    joinJoin?: string;
  }

  export interface TableConfig {
    border?: TableBorder;
    columns?: {
      [key: number]: {
        width?: number;
        wrapWord?: boolean;
      };
    };
  }

  export function table(data: string[][], config?: TableConfig): string;
}
