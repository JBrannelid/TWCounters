// exposes the typescript types for the csp-config.ts file to other files in the project
export declare const generateCSPString: (nonce: string) => string;
export declare const applyNonceToElement: (element: HTMLElement, nonce: string) => void;
export declare const createScriptElement: (src: string, nonce: string) => HTMLScriptElement;