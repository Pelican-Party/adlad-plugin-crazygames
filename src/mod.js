export function crazyGamesPlugin() {
	let initializeCalled = false;

	const props = /** @type {const} */ ({
		CrazyGames: "CrazyGames",
		SDK: "SDK",
		game: "game",
		ad: "ad",
		banner: "banner",
		gameplayStart: "gameplayStart",
		gameplayStop: "gameplayStop",
		sdkGameLoadingStart: "sdkGameLoadingStart",
		sdkGameLoadingStop: "sdkGameLoadingStop",
		happytime: "happytime",
		inviteLink: "inviteLink",
		requestAd: "requestAd",
		requestResponsiveBanner: "requestResponsiveBanner",
		adFinished: "adFinished",
		adError: "adError",
		adStarted: "adStarted",
	});

	// @ts-ignore We want to make sure that `props` remains an object.
	// Normally, terser would turn every property into a separate variable.
	// This would be fine for the first pass of minification, but if a user
	// were to bundle and minify this libarry with their own code, they will minify a second time
	// causing all these props to lose their quotes.
	// This can be an issue if the new bundle has property mangling enabled.
	// This if statement will never run, but rollup and terser will both think it
	// might and so the `props` opbject will remain an object.
	if (props > 0) console.log(props);

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
			sdk[props.ad][props.requestAd](type, {
				[props.adError](e) {
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
				[props.adFinished]() {
					resolve({
						didShowAd: true,
						errorReason: null,
					});
				},
				[props.adStarted]() {
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

	const plugin = /** @type {const} @satisfies {import("$adlad").AdLadPlugin} */ ({
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
			sdk = window[props.CrazyGames][props.SDK];
		},
		manualNeedsPause: true,
		manualNeedsMute: true,
		async loadStart() {
			await sdk[props.game][props.sdkGameLoadingStart]();
		},
		async loadStop() {
			await sdk[props.game][props.sdkGameLoadingStop]();
		},
		async gameplayStart() {
			await sdk[props.game][props.gameplayStart]();
		},
		async gameplayStop() {
			await sdk[props.game][props.gameplayStop]();
		},
		async showFullScreenAd() {
			return await showVideoAd("midgame");
		},
		async showRewardedAd() {
			return await showVideoAd("rewarded");
		},
		showBannerAd(options) {
			sdk[props.banner][props.requestResponsiveBanner](options.id);
		},
		customRequests: {
			happyTime() {
				sdk[props.game][props.happytime]();
			},
			/**
			 * @param {ConstructorParameters<typeof URLSearchParams>} args
			 */
			async getShareableUrl(...args) {
				const urlParams = new URLSearchParams(...args);
				/** @type {Object.<string, string>} */
				const paramsObj = {};
				for (const [key, value] of urlParams.entries()) {
					paramsObj[key] = value;
				}
				return await sdk[props.game][props.inviteLink](paramsObj);
			},
		},
	});

	return plugin;
}
