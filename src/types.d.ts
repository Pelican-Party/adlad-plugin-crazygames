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
		happytime(): Promise<void>;
		inviteLink(params: Record<string, string>): Promise<string>;
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
	adError(error: string): void;
	adStarted(): void;
}

type CrazySdkVideoAdType = "midgame" | "rewarded";
