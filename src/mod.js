export function crazyGamesPlugin() {
	/** @type {(instance: CrazySDK) => void} */
	let resolveInstance;
	/** @type {Promise<CrazySDK>} */
	const instancePromise = new Promise((resolve) => {
		resolveInstance = resolve;
	});
	let initializeCalled = false;

	/** @type {(success: boolean) => void} */
	let fullScreenAdPromiseHandler = () => {};

	/** @type {import("$adlad").AdLadPlugin} */
	const plugin = {
		name: "CrazyGames",
		async initialize() {
			if (initializeCalled) {
				throw new Error("CrazyGames plugin is being initialized more than once");
			}
			initializeCalled = true;

			const sdkUrl = "https://sdk.crazygames.com/crazygames-sdk-v1.js";
			await import(sdkUrl);
			const crazysdk = window.CrazyGames.CrazySDK.getInstance();
			crazysdk.init();
			crazysdk.addEventListener("adFinished", () => {
				fullScreenAdPromiseHandler(true);
			});
			crazysdk.addEventListener("adError", () => {
				fullScreenAdPromiseHandler(false);
			});
			resolveInstance(crazysdk);
		},
		async loadStart() {
			const crazysdk = await instancePromise;
			crazysdk.sdkGameLoadingStart();
		},
		async loadStop() {
			const crazysdk = await instancePromise;
			crazysdk.sdkGameLoadingStop();
		},
		async gameplayStart() {
			const crazysdk = await instancePromise;
			crazysdk.gameplayStart();
		},
		async gameplayStop() {
			const crazysdk = await instancePromise;
			crazysdk.gameplayStop();
		},
		async showFullScreenAd() {
			const crazysdk = await instancePromise;
			crazysdk.requestAd("midgame");
			/** @type {Promise<boolean>} */
			const fullScreenPromsise = new Promise((resolve) => {
				fullScreenAdPromiseHandler = resolve;
			});
			const success = await fullScreenPromsise;
			return {
				didShowAd: success,
				errorReason: success ? null : "unknown",
			};
		},
		async showRewardedAd() {
			const crazysdk = await instancePromise;
			crazysdk.requestAd("rewarded");
			/** @type {Promise<boolean>} */
			const fullScreenPromsise = new Promise((resolve) => {
				fullScreenAdPromiseHandler = resolve;
			});
			const success = await fullScreenPromsise;
			return {
				didShowAd: success,
				errorReason: success ? null : "unknown",
			};
		},
	};

	return plugin;
}
