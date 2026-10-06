# SAP Bridge v2 — Figma plugin (team copy)

Makes real SAP Fiori screens in Figma from an image or a request. Claude tab, Agent tab, Make tab.

## Install (once)
1. `git clone https://github.com/Venelinhr/Claude-To-Figma-SAP-Application && cd Claude-To-Figma-SAP-Application && ./install.sh` (starts the bridge on port 41778).
2. Figma desktop → Plugins → Development → **Import plugin from manifest** → pick `plugin/sap-bridge-v2/manifest.json`.
3. Open the plugin in your file. It finds the bridge by itself.

## Update
`git pull`, then `node build/plugin-bundle.js`, close and reopen the plugin. A message "PLUGIN OUT OF DATE" means this step was skipped.

## Rules
Every image build uses the SAP design lane: real SAP kit parts, SAP Horizon spacing (`build/sap-spacing.js`), no pixel copies. Needs the SAP Web UI Kit library enabled in the Figma file.
