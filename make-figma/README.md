# Make → Figma (standalone)
Copy a Figma Make link, paste it in the plugin, get a Figma frame built from SAP kit parts. No Claude, no model.
The old SAP Bridge (port 41778, `plugin/sap-bridge`) is a separate thing and is not touched.

Set up once:
1. `node make-figma/build.js`
2. `node make-figma/ctl.js start`
3. Chrome → `chrome://extensions` → Developer mode → Load unpacked → `make-figma/extension`
4. Figma → Plugins → Development → Import plugin from manifest → `make-figma/plugin/manifest.json`

Use: open the plugin, Cmd+V a Make link (share link or `*.figma.site`).
After a converter change: `node make-figma/build.js`, close and reopen the plugin.
Bridge: `node make-figma/ctl.js start|stop|restart|status` (port 41779, log `make-figma/bridge.log`).
