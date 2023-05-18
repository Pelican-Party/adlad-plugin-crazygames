interface Window {
	CrazyGames: {
		SDK: CrazySdkInstance;
	};
}

interface CrazySdkInstance {
	game: {
		gameplayStart(): Promise<void>;
		gameplayStop(): Promise<void>;
		sdkGameLoadingStart(): Promise<void>;
		sdkGameLoadingStop(): Promise<void>;
	};
	ad: {
		requestAd(type: CrazySdkVideoAdType, callbacks: CrazySdkVideoCallbacks);
	};
	banner: {
		requestResponsiveBanner(id: string): void;
	};
}

interface CrazySdkVideoCallbacks {
	adFinished(): void;
	adError(error: Error): void;
	adStarted(): void;
}

type CrazySdkVideoAdType = "midgame" | "rewarded";
