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
		addSettingsChangeListener(listener: () => void): void;
		settings: {
			disableChat: boolean;
			muteAudio: boolean;
		};
		showInviteButton(params: Record<string, string>): void;
		hideInviteButton(): void;
		isInstantMultiplayer: boolean;
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
	user: {
		showAuthPrompt(): Promise<void>;
		getUser(): Promise<CrazyGamesUser | null>;
	};
}

interface CrazySdkVideoCallbacks {
	adFinished(): void;
	adError(error: string): void;
	adStarted(): void;
}

type CrazySdkVideoAdType = "midgame" | "rewarded";

type CrazyGamesUser = {
	username: string;
	profilePictureUrl: string;
};
