/** Metro elige la implementación .native o .web; ambas comparten este contrato. */
export declare function loadDemo(): Promise<string | null>;
export declare function saveDemo(raw: string): Promise<void>;
