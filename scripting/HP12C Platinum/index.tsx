import { Script } from "scripting";
//#region src/backup.mjs
var BACKUP_KEYS = [
	"hp12c-state",
	"hp12c-default-display",
	"hp12c-default-program",
	"hp12c-program-before-default",
	"hp12c-history-v1",
	"hp12c-ui-settings-v1",
	"hp12c-history-activity-v1"
];
//#endregion
//#region src/scripting-bridge.mjs
function validateEntries(entries) {
	if (!entries || typeof entries !== "object" || Array.isArray(entries)) throw new Error("Armazenamento inválido.");
	for (const [key, value] of Object.entries(entries)) if (!BACKUP_KEYS.includes(key) || typeof value !== "string") throw new Error("Armazenamento inválido.");
	if (JSON.stringify(entries).length > 1048576) throw new Error("Armazenamento muito grande.");
	return entries;
}
//#endregion
//#region scripting/host-state.mjs
var CURRENT = "hp12c-scripting-v1";
var PREVIOUS = "hp12c-scripting-previous-v1";
function createNativeStore(storage) {
	const read = () => {
		const saved = storage.get(CURRENT);
		if (saved === null) return {
			revision: 0,
			entries: {}
		};
		if (!Number.isSafeInteger(saved.revision) || saved.revision < 1) throw new Error("Revisão inválida; dados preservados.");
		validateEntries(saved.entries);
		return saved;
	};
	return {
		read,
		save(params) {
			validateEntries(params?.entries);
			const current = read();
			if (params.revision !== current.revision) throw new Error("Outra janela alterou os dados. Feche e reabra; salve um backup da sessão atual.");
			const next = {
				revision: current.revision + 1,
				entries: { ...params.entries }
			};
			if (!storage.set(PREVIOUS, current)) throw new Error("Falha ao preservar a cópia anterior.");
			if (!storage.set(CURRENT, next)) throw new Error("Falha no salvamento.");
			const confirmed = read();
			if (JSON.stringify(confirmed) !== JSON.stringify(next)) throw new Error("Salvamento não confirmado.");
			return {
				ok: true,
				revision: next.revision
			};
		}
	};
}
//#endregion
//#region scripting/index.tsx
async function run() {
	const web = new WebViewController();
	const store = createNativeStore(Storage);
	await web.addScriptMessageHandler("hpRead", () => store.read());
	await web.addScriptMessageHandler("hpSave", (params) => store.save(params));
	await web.addScriptMessageHandler("hpHaptic", () => {
		HapticFeedback.lightImpact();
		return true;
	});
	await web.addScriptMessageHandler("hpExport", async (text) => {
		if (typeof text !== "string" || text.length > 1048576) throw new Error("Backup inválido.");
		return (await DocumentPicker.exportFiles({ files: [{
			name: `hp12c-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`,
			data: Data.fromUTF8(text)
		}] })).length > 0;
	});
	await web.addScriptMessageHandler("hpImport", async () => {
		const paths = await DocumentPicker.pickFiles({
			types: ["public.json"],
			allowsMultipleSelection: false
		});
		if (!paths.length) return null;
		try {
			const text = await FileManager.readAsString(paths[0]);
			if (text.length > 1048576) throw new Error("Backup muito grande.");
			return text;
		} finally {
			DocumentPicker.stopAcessingSecurityScopedResources();
		}
	});
	web.shouldAllowRequest = async (request) => /^(file:|data:|blob:|about:)/.test(request.url);
	try {
		if (!await web.loadFile(`${Script.directory}/web/index.html`, `${Script.directory}/web`)) throw new Error("Não foi possível carregar o pacote local.");
		await web.present({ fullscreen: true });
		await web.evaluateJavaScript("return window.hp12cFlush?.()");
	} finally {
		web.dispose();
		Script.exit();
	}
}
run().catch((error) => {
	console.error("HP12C:", String(error));
	Script.exit();
});
//#endregion
