interface Window {
	CrazySDK: typeof CrazySDK;
}

declare class CrazySDK extends EventTarget {
	static getInstance(): CrazySDK;
	init();
}
