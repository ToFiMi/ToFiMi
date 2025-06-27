
export {}

declare global {
    interface Window {
        app?: {
            callback?: {
                path?: Record<string, { id: string; name: string }>
            }
        }
    }
}
