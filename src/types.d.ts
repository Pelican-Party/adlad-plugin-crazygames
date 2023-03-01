interface Window {
	CrazyGames: {
		CrazyAdType: {
			midgame: "midgame";
			rewarded: "rewarded;";
		};
		CrazyEventType: {
			adError: "adError";
			adFinished: "adFinished";
			adStarted: "adStarted";
			adblockDetectionExecuted: "adblockDetectionExecuted";
		};
		CrazySDK: typeof CrazySDK;
	};
}

declare class CrazySDK extends EventTarget {
	static getInstance(): CrazySDK;
	init();
}
