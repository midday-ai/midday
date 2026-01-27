/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// Declare window as potentially undefined for SSR/Node environments
declare const window: Window & typeof globalThis | undefined;
