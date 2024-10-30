interface Window {
	CrazyGames: {
		SDK: CrazySdkInstance;
	};
}

interface CrazySdkInstance {
	init: () => Promise<void>;
	game: {
		gameplayStart(): Promise<void>;
		gameplayStop(): Promise<void>;
		loadingStart(): Promise<void>;
		loadingStop(): Promise<void>;
		happytime(): Promise<void>;
		inviteLink(params: Record<string, string>): Promise<string>;
	};
	ad: {
		requestAd(type: CrazySdkVideoAdType, callbacks: CrazySdkVideoCallbacks);
	};
	banner: {
		requestResponsiveBanner(id: string): void;
	};
	data: {
		clear(): void;
		getItem(key: string): string | null;
		removeItem(key: string): void;
		setItem(key: string, value: string): void;
	};
}

interface CrazySdkVideoCallbacks {
	adFinished(): void;
	adError(error: string): void;
	adStarted(): void;
}

type CrazySdkVideoAdType = "midgame" | "rewarded";
