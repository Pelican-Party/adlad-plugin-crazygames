export function crazyGamesPlugin() {
	let initializeCalled = false;

	const props = /** @type {const} */ ({
		CrazyGames: "CrazyGames",
		SDK: "SDK",
		init: "init",
		game: "game",
		ad: "ad",
		banner: "banner",
		data: "data",
		user: "user",
		gameplayStart: "gameplayStart",
		gameplayStop: "gameplayStop",
		loadingStart: "loadingStart",
		loadingStop: "loadingStop",
		happytime: "happytime",
		inviteLink: "inviteLink",
		requestAd: "requestAd",
		requestResponsiveBanner: "requestResponsiveBanner",
		adFinished: "adFinished",
		adError: "adError",
		adStarted: "adStarted",
		clear: "clear",
		getItem: "getItem",
		removeItem: "removeItem",
		setItem: "setItem",
		showAuthPrompt: "showAuthPrompt",
		getUser: "getUser",
		addSettingsChangeListener: "addSettingsChangeListener",
		settings: "settings",
		muteAudio: "muteAudio",
		username: "username",
		showInviteButton: "showInviteButton",
		hideInviteButton: "hideInviteButton",
		isInstantMultiplayer: "isInstantMultiplayer",
		addJoinRoomListener: "addJoinRoomListener",
		removeJoinRoomListener: "removeJoinRoomListener",
		updateRoom: "updateRoom",
		roomId: "roomId",
		isJoinable: "isJoinable",
		inviteParams: "inviteParams",
		leftRoom: "leftRoom",
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
					mutedByAd = true;
					updateNeedsMute();
				},
			});
		});
		const result = await promise;
		initializeContext.setNeedsPause(false);
		mutedByAd = false;
		updateNeedsMute();
		return result;
	}

	let mutedByAd = false;
	function updateNeedsMute() {
		initializeContext.setNeedsMute(mutedByAd || sdk[props.game][props.settings][props.muteAudio]);
	}

	const STORAGE_WRITE_COOLDOWN_MS = 30_000;
	/** @type {Map<string, number>} */
	const lastStorageWriteTimes = new Map();
	/** @type {Map<string, ReturnType<typeof setTimeout>>} */
	const pendingStorageTimeouts = new Map();

	let lastProvidedRoomData = "";

	/**
	 * @param {string} key
	 * @param {unknown} value
	 */
	function writeStorageItem(key, value) {
		sdk[props.data][props.setItem](key, JSON.stringify(value));
		lastStorageWriteTimes.set(key, performance.now());
	}

	/**
	 * @param {string} key
	 */
	function cancelStorageTimeout(key) {
		const timeoutId = pendingStorageTimeouts.get(key);
		if (timeoutId != null) {
			clearTimeout(timeoutId);
			pendingStorageTimeouts.delete(key);
		}
	}

	const plugin = /** @type {const} @satisfies {import("$adlad").AdLadPlugin} */ ({
		name: "crazygames",
		async initialize(ctx) {
			if (initializeCalled) {
				throw new Error("CrazyGames plugin is being initialized more than once");
			}
			initializeCalled = true;
			initializeContext = ctx;

			const sdkUrl = new URL("https://sdk.crazygames.com/crazygames-sdk-v3.js");
			if (ctx.useTestAds) {
				sdkUrl.searchParams.set("useLocalSdk", "true");
			}
			await import(sdkUrl.href);
			sdk = window[props.CrazyGames][props.SDK];
			await sdk[props.init]();

			sdk[props.game][props.addSettingsChangeListener](() => {
				updateNeedsMute();
			});
			updateNeedsMute();
		},
		manualNeedsPause: true,
		manualNeedsMute: true,
		async loadStart() {
			await sdk[props.game][props.loadingStart]();
		},
		async loadStop() {
			await sdk[props.game][props.loadingStop]();
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
		setStorageItem(key, value) {
			const lastWriteTime = lastStorageWriteTimes.get(key) ?? -Infinity;
			const lastWriteMsAgo = performance.now() - lastWriteTime;

			cancelStorageTimeout(key);

			if (lastWriteMsAgo >= STORAGE_WRITE_COOLDOWN_MS) {
				writeStorageItem(key, value);
			} else {
				const delay = STORAGE_WRITE_COOLDOWN_MS - lastWriteMsAgo;
				const timeoutId = setTimeout(() => {
					pendingStorageTimeouts.delete(key);
					writeStorageItem(key, value);
				}, delay);
				pendingStorageTimeouts.set(key, timeoutId);
			}
		},
		getStorageItem(key) {
			const value = sdk[props.data][props.getItem](key);
			if (value == null) return null;
			return JSON.parse(value);
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
			/**
			 * @param {UpdateRoomData} params
			 */
			updateRoom({
				inviteParams,
				isJoinable,
				roomId,
			}) {
				/** @type {UpdateRoomData} */
				const params = {};
				if (roomId) params[props.roomId] = roomId;
				if (isJoinable != undefined) params[props.isJoinable] = isJoinable;
				if (inviteParams) params[props.inviteParams] = inviteParams;

				// Don't call the sdk when nothing has changed
				const str = JSON.stringify(params);
				if (lastProvidedRoomData == str) return;
				lastProvidedRoomData = str;

				sdk[props.game][props.updateRoom](params);
			},
			leftRoom() {
				lastProvidedRoomData = "";
				sdk[props.game][props.leftRoom]();
			},
			addJoinRoomListener(listener) {
				sdk[props.game][props.addJoinRoomListener](listener);
			},
			removeJoinRoomListener(listener) {
				sdk[props.game][props.removeJoinRoomListener](listener);
			},
			removestorageItem(key) {
				cancelStorageTimeout(key);
				lastStorageWriteTimes.delete(key);
				sdk[props.data][props.removeItem](key);
			},
			clearStorage() {
				for (const timeoutId of pendingStorageTimeouts.values()) {
					clearTimeout(timeoutId);
				}
				pendingStorageTimeouts.clear();
				lastStorageWriteTimes.clear();
				sdk[props.data][props.clear]();
			},
			showAuthPrompt() {
				sdk[props.user][props.showAuthPrompt]();
			},
			async getIsSignedIn() {
				return Boolean(await sdk[props.user][props.getUser]());
			},
			async getUsername() {
				const user = await sdk[props.user][props.getUser]();
				if (!user) return null;
				return user[props.username];
			},
			/**
			 * @param {Object.<string, string>} parameters
			 */
			showInviteButton(parameters) {
				sdk[props.game][props.showInviteButton](parameters);
			},
			hideInviteButton() {
				sdk[props.game][props.hideInviteButton]();
			},
			isInstantMultiplayer() {
				return sdk[props.game][props.isInstantMultiplayer];
			},
		},
	});

	return plugin;
}
