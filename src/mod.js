export function crazyGamesPlugin() {
	let initializeCalled = false;

	/** @type {CrazySdkInstance} */
	let sdk;
	/** @type {import("$adlad").AdLadPluginInitializeContext} */
	let initializeContext;

	/**
	 * @param {CrazySdkVideoAdType} type
	 */
	async function showVideoAd(type) {
		/** @type {Promise<import("$adlad").ShowFullScreenAdResult>} */
		const promise = new Promise((resolve) => {
			sdk.ad.requestAd(type, {
				adError(e) {
					if (e == "Ad requested too soon") {
						resolve({
							didShowAd: false,
							errorReason: "time-constraint",
						});
					} else if (e == "An ad request is already in progress") {
						resolve({
							didShowAd: false,
							errorReason: "already-playing",
						});
					} else if (e == "No ad available") {
						resolve({
							didShowAd: false,
							errorReason: "no-ad-available",
						});
					} else {
						resolve({
							didShowAd: false,
							errorReason: "unknown",
						});
					}
				},
				adFinished() {
					resolve({
						didShowAd: true,
						errorReason: null,
					});
				},
				adStarted() {
					initializeContext.setNeedsPause(true);
					initializeContext.setNeedsMute(true);
				},
			});
		});
		const result = await promise;
		initializeContext.setNeedsPause(false);
		initializeContext.setNeedsMute(false);
		return result;
	}

	/** @type {import("$adlad").AdLadPlugin} */
	const plugin = {
		name: "crazygames",
		async initialize(ctx) {
			if (initializeCalled) {
				throw new Error("CrazyGames plugin is being initialized more than once");
			}
			initializeCalled = true;
			initializeContext = ctx;

			const sdkUrl = new URL("https://sdk.crazygames.com/crazygames-sdk-v2.js");
			if (ctx.useTestAds) {
				sdkUrl.searchParams.set("useLocalSdk", "true");
			}
			await import(sdkUrl.href);
			sdk = window.CrazyGames.SDK;
		},
		manualNeedsPause: true,
		manualNeedsMute: true,
		async loadStart() {
			await sdk.game.sdkGameLoadingStart();
		},
		async loadStop() {
			await sdk.game.sdkGameLoadingStop();
		},
		async gameplayStart() {
			await sdk.game.gameplayStart();
		},
		async gameplayStop() {
			await sdk.game.gameplayStop();
		},
		async showFullScreenAd() {
			return await showVideoAd("midgame");
		},
		async showRewardedAd() {
			return await showVideoAd("rewarded");
		},
		showBannerAd(options) {
			sdk.banner.requestResponsiveBanner(options.id);
		},
	};

	return plugin;
}
