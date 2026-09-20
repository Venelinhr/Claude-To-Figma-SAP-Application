// Claude to Figma SAP Application — v6: Full Component Library
// 50+ SAP Web UI Kit components mapped with verified keys.
// Flat layout: every component stacked directly on screen frame.
// Keys verified via search_design_system MCP, 2026-06-22.

// ─────────────────────────────────────────────────────────────────────────────
// VERIFIED SAP LIBRARY COMPONENT KEYS (50 components)
// ─────────────────────────────────────────────────────────────────────────────
const SAP_KEYS = {
  // Navigation / Shell
  ShellBar:             '169cfd74c0be329c56b4c79b9404c978ff10cb60',
  Breadcrumb:           '5743166bac11fdf110a54fd7d85436fed186d3b2',
  SideNavigation:       'd680af6d72f9421fe3f8712bf0ce171308963d3a',
  ToolHeader:           '73a0370a9342211081a4ace445d10ab064963624',
  Header:               'd4560b56c7b5aa9476e6b23bfaf869166b7fff47',
  Footer:               'e563bc3291a07a5eb4d97b2083355cc54023c377',
  UserMenu:             'c9bbc83c501d55048df4f68df50d920a9e85002c',

  // Buttons
  Button:               '91805fa199b1fd247d76a9c08bbe0982b49065c4',
  IconButton:           'c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63',
  MenuButton:           '1d667088d93c355c2bd9bafac57147286206e799',
  SegmentedButton:      '308476a5285b5a132241dc1c118d09ecf8d82273',
  SplitButton:          '8aba512152f89d81e9c9b804d8da3114b1a83a93',
  IconMenuButton:       'c455c46ed2cea345c534193c1598e5459aaadd11',

  // Toolbars
  Toolbar:              '58a258bf5813e59cec4dfc684c8cdb2a6ca6721f',
  ToolbarItems:         'ad45e5bf267d83ee320902263db8887f71e97026',

  // Page layout
  DynamicPageHeader:    'dc90c8dbf7714f165ed79357e9ba6ade5b3701ae',
  IconTabBar:           '4aafcbf55528c439876b314d155438884b614722',

  // Table
  Table:                '03ea321822c4e99c27de4d9c2524bdec9c6e0972',
  TableCell:            'e717737e98a40a8619e315ca1b4b04646b93b541',
  Tree:                 '93fca87e34305e0a8e036acdd51e7cdc870d4e0d',
  TreeItem:             '5142305385e26387daddd9af7b58a7da66a9f8fd',

  // Form inputs
  Input:                '0f4366cb3065919e8f3deb0462f1a5a3633d6b50',
  Select:               '5ce369ff7fb0cce28984eec8dd9973ccde82facb',
  MultiCombobox:        'cc0631141a7083096632c6161ee15448ced39ec3',
  MultiInput:           '1dac6b2be28e60c6ff7a5752182d97f5033d3fc8',
  CheckBox:             '23b4a2ca030e4bd2ff3bdd5b97b70f646ec09071',
  RadioButton:          '9308f27ef27fbb28bc7d167c52494aa41a21610f',
  Switch:               'c63509f642cdabbeb8c1878dd125ee006481631c',
  TextArea:             'bee4738dd5e5856a3b88eae341b47376a3269d87',
  DateRangePicker:      'ad1f84e6293671f80ff8dd174b1da0cbacf0fa48',
  DateTimePicker:       '377d76d309f4e5ee7e12132eba0df4e29686a4f7',
  TimePicker:           'f07044ee64f4abfc857543051806986d49a54b68',
  StepInput:            '69f0f7acf68766ac89890d0c119f64bfd50e693a',
  Slider:               'ee3b9995f1484c6d008bbac9dba2bd8a0026c160',
  RangeSlider:          '34d973fcb4c85d6517c8e5c3079e2b40d14d0fe8',
  Label:                'b38ac753648ad298c1e2dd02d71417566dd6095c',
  FileUploader:         'b7532a6da2cb7677348b5d4bbb81952c9224e984',

  // Display
  Link:                 '2e67b5399e9f05950c6f6ea6f244a1a9736c8a56',
  ObjectStatus:         '748d609ead5d4a246d7cd7c144b94b518c467e58',
  ObjectIdentifier:     '8e1e45c5a89b540f6ec53542279c7711d4020d81',
  ObjectNumber:         '7b67d22ed19f246b708dc4664808a45f314a7414',
  ObjectAttribute:      '080ead216322befe153704bf8f11373158fea34a',
  Avatar:               '71a3389ecbd47822b3184700766e30963fc2f220',
  Tag:                  '9b55bf702befd73b2e28f800ee4d0033bc0e0e95',
  ProgressIndicator:    'c355f86d77c4e5a8aa2366b83179896f7d172462',
  RatingIndicator:      '4e75dd8968be7061ba703e3f5fb4364b558acb04',
  BusyIndicator:        'e328630d6c564d1f312256254e0543d41bacbb84',
  Calendar:             '16743cba69c57792417e8f6b51d347cc29bd2d95',
  Card:                 '76fbadb97db272943b14aff18ee5809d0360795f',

  // Feedback / Overlays
  MessageStrip:         'f0e77f8888796e35c0e791ddc0b38535eda6ec31',
  IllustratedMessage:   'eba579505df21536654910797f94b3784248807b',
  Toast:                'bbe4c3f7114a2eb4286844102f42c909bf0798eb',
  Dialog:               '5b965b1eda133ac521b42fa20b201e9491f4bf83',
  Popover:              '5f472d6482ed33c9967694fa411c675e3b214d39',
  Menu:                 'ba51eb54cba79d6795057e5df5ff853d361ee799',
  Notifications:        'af1b29be8db435ed790d87721cff4d7efe2217bd',
  NotificationListItem: '6fe89ae5f6a512bebad2f9737ed134bccac1faed',
  NotificationBanner:   'aa8ef403a7c765acf86d2e6fc887a6cb496a3371',

  // Containers
  Panel:                '4d19c2a24896033fe5b04bcc5dfdf43e9626283d',
  Form:                 '6603eb3ebde2c1c763f2ae450df2cbb799ba640d',
  List:                 '4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25',
  ListItem:             'f7bc6526a9f16608747a4141800146ebd3f4e835',
  Carousel:             'bf174ffb841e4b27947d0be558656bb80238fe0d',
  Tokenizer:            'da76d0413ed1f1f40d6f23e7732c9aca0b17ef5b',
  Token:                '5664972429518d07040a3cadfa2d5a28cf19b8a7',
  ProductSwitch:        '22a7c83b19c183e92577ec43dd01eaa188739cd9',
  Settings:             'a337e8f637533682b7a0a8082f6db074c5082c81',
  ColorPicker:          'da4ac5fe23880bbdefabbf0059891eb289b5a52a',
  AIButton:             '6d9a69eec5a716375ccd5e7272c6193dbe8718ce',
  AIPromptInput:        '73c83eecc6edcaf572bca3c411b7345a5d398b3c',
  // Resolved 2026-06-27 from Quartz Web UI Kit_v1.94
  Tabs:                 '32b02147dfb27790749b83fe3c8b6e01975dab4e',  // "Text Tabs"
  ToggleButton:         '2e756084e95280f469617b07a64ea44a0b2415fa',
  Wizard:               'a1a11b0486b9b7e748ae57ff032d4d43bdd1389a',
  ActionListItem:       '063b8ffd9f963d3cf574092e4dd53809ecb3a5ee',
  FeedInput:            'f1d392d8546edf20ef209cd39cb624ac7bd6b482',
  IconTabSeparator:     'a4bdf360217f604b116f179144b02ef74dee7dca',  // "Separator"
  Timeline:             'ccfde6024cdc9d35a75755a5c070b062e75d714a',  // "UI ELEMENTS/TIMELINE/BASIC/M 600 px"
  // 2026-07-07 — Wave 2: additional SAP-library backed additions
  Bar:                  'd4560b56c7b5aa9476e6b23bfaf869166b7fff47',  // "Header" — SAP kit's Bar equivalent
  MenuListItem:         '689013924aedb868b8d65be6f249643d45e00a44',  // "Menu List Item"
  // 2026-07-07 — Wave 3: full SAP Web UI Kit coverage — 19 unique additions
  // (13 duplicate keys removed in Wave A / 2026-07-07d to reduce noise;
  // originals live in the categorized sections above)
  AIMenuButton:         'af7726506b902ae0a80daa2950f890d6b4c275c6',
  AISplitMenuButton:    '3eedca60790fbfc4a87e2cc2aaf9a7774c68b6ca',
  IconSplitButton:      '9afdf08f8ae226b175d0a3be79f24454d4b12928',
  Banner:               '64034a60b543539b407e8534b05454add9a49baf',
  HomepageHeroBanner:   '6b540d39a63d837e652b82675136e991ebdd0192',
  TwoMonthCalendar:     'ad5ce462d34460d73eda13cd7ea3e2677fc27048',
  Legend:               'f63dd9489c7cec0c2af11da655c58e86cee54771',
  AddDimensions:        'c3564e4ca303313fb07aaac5da07480c871c97d1',
  AddPeopleToCalendar:  '26306cac62e9ba9937807b7ab8cbcedf0bec3e65',
  EmptyPlanningCalendar:'ac477531c451a7b1f76d1df712c92aa7e6d75868',
  GroupingColumns:      '1286a1119579e51cf54a9cd47c0e9d62d9d7bd05',
  NoNotifications:      '10a5a1ec70cdc2a5979563f9021c49d2363fb6d6',
  UnableToLoadImage:    '2fd55933a857129cecd41af651432c541ce466f5',
  InputMessagePopover:  '1acdc092cfb399b0c33d1d6484c77ae58fe75242',
  AIInput:              '0098668d77c18b019e726dc9cce843cee360c4d5',
  AIRichTextEditor:     '259171690780bc94b6900bc4975d6bb81d5a089f',
  AITextArea:           'b5bb525824429489a2f6e5657e91240a605014a8',
  DropDown:             'd74d4ae8eb549d3cc54b7d345e3b17f90c543817',
  Scrollbar:            'ccf83f17bfdbce52e81e61d775c4eed5d41b2258',
  ShellSearch:          'e60b0ec134635c92ca558125083fe11242997e98',
};

// ─────────────────────────────────────────────────────────────────────────────
// SAP WEB UI KIT — ICON SOURCE OF TRUTH (2026-07-09)
//
// ALL icons come from the SAP Web UI Kit (file SILcWzK5uFghKun9jx6D7c,
// ❖ Iconography page 2:4). Icons are published library COMPONENTs; each has a
// node ID in the kit and a 40-char component key. To place an icon on an
// INSTANCE_SWAP property we import it by key and set the property to the
// imported component's id (proven working 2026-07-09).
//
// ICON_KEYS: sap-icon name → { key, kitNode }
//   - `key`     : the published component key (needed by importComponentByKeyAsync)
//   - `kitNode` : the node id in the SAP Web UI Kit (for reference / re-harvest)
//
// HARVESTING KEYS: the MCP read tools do NOT expose library component keys.
// The only way to obtain a key is from an INSTANCE already present in the file:
//   const mc = await instance.getMainComponentAsync(); mc.key
// So keys are filled in here as they are confirmed. Icons WITHOUT a key fall
// back gracefully (the icon slot keeps its kit default) and log an exception so
// we know to harvest that key. See knowledge/guidelines/sap-web-ui-kit-icons.md.
// ─────────────────────────────────────────────────────────────────────────────
const ICON_KEYS = {
  // name            : { key: '<40-char key or null>',                         kitNode: '<kit node id>' }
  // ── 77 keys harvested live from the SAP Web UI Kit via "Harvest Icon Keys" (2026-07-09) ──
  'accept':            { key: '44c041ea1ba7e4fb7af49664054038dfbb136ef3', kitNode: null },
  'action':            { key: 'ec04761fe0ef409cd2c849bd9b36cd7efd587f22', kitNode: null },
  'action-settings':   { key: '6adc21afa984697a521fc38cbab0ce1b6b7a65a0', kitNode: null },
  'activity-items':    { key: 'd43484f6a95ae5f4d1440770e0e206cbbac8649a', kitNode: null },
  'add':               { key: 'd6727620b32189e038a3bebbe10ad02b66859f47', kitNode: '1016:2382' },
  'ai':                { key: '90f321fb2e05adcd1322d1b98872293ae2f06882', kitNode: null },
  'alert':             { key: 'eb3bd4c5ac42862ff893a79de78b30a849971cd6', kitNode: null },
  'appointment-2':     { key: '59c77280f7ba5dd27c9be54197f4a3c1a6089084', kitNode: null },
  'bell':              { key: 'ec29b0acc023373343199ca501f7b4d5a89dd900', kitNode: null },
  'copy':              { key: '5e1f1ea1d98637e1fb8a029cf9f072d085dd4066', kitNode: null },
  'crm-sales':         { key: '3d74518d3f5035e8343bde96de99bd24a44fe079', kitNode: null },
  'customer-and-contacts': { key: '5b7cfcdaad20640db22b7b6396b8a744d3b1d9fd', kitNode: null },
  'customer-financial-fact-sheet': { key: 'ca5888c5db77bb52bc6a84de97668a1d6625c59b', kitNode: null },
  'customize':         { key: '5c382e08f8544c4ae18c186889dd5f33365729ef', kitNode: null },
  'da':                { key: 'ec91cd8cffe34196832a9c98f6b1b67daafa53df', kitNode: null },
  'decline':           { key: '80086d2e8969c07e7c885e6ee9244005bfc3864d', kitNode: null },
  'delete':            { key: '6da9bfb78bb57cc96d015531ac16e201423d8558', kitNode: null },
  'direction-arrows':  { key: 'd8df6bd3e7657212a65f733f39878d4e0a37cc2e', kitNode: null },
  'doc-attachment':    { key: '2f6a78d99302dc0c9e9eb7f24cde38d4a8c4fb76', kitNode: null },
  'duplicate':         { key: 'e00e7dd4e0a044f0e50b8b3de008654d74c2f56b', kitNode: null },
  'edit':              { key: 'b346b05bc52f9d648ead280cfbd17baacea391f2', kitNode: null },
  'employee':          { key: '59235558ebf2f0e8ff37377df50e59adb628bb5c', kitNode: null },
  'employee-pane':     { key: '8d391a27a09b8b770ba1e8a1709b6035dc12fef7', kitNode: null },
  'enter-more':        { key: '0af952b0ef0cd5b370848da0c1fc8fa6b40ce34e', kitNode: null },
  'eraser':            { key: 'd4c032a1e7aacf0d4585ba2e8aff7153a694bab0', kitNode: null },
  'error':             { key: 'e498c375d64182cd15c40a6544499d26fead88ae', kitNode: null },
  'example':           { key: 'a3752e5eec2addfa9a045328b88c53a8eb61d6a6', kitNode: null },
  'excel-attachment':  { key: '85256e974ce0c7329fe98f36a2d32b25683ef660', kitNode: null },
  'expense-report':    { key: '13aeeb8b5afae3dbcbb706745aa1fc0eefb11dc0', kitNode: null },
  'explorer':          { key: 'a421380ba269375c892fec582a8dfa7a74c9db3a', kitNode: null },
  'factory':           { key: '93457372a78c69fd0cd025ad5805806de7385b4a', kitNode: null },
  'family-care':       { key: '403ee3e747d0c685c3b1fe23602ca6a2aebd8496', kitNode: null },
  'favorite':          { key: '777c69fdeaa2648545eacf6b329e1aa1e9c54a9d', kitNode: null },
  'favorite-list':     { key: '54a20db7cb800219f99739af69d8195b2c7beedd', kitNode: null },
  'fax-machine':       { key: '42173ebc55f6f423a4054a3f19c5cb3532c4b701', kitNode: null },
  'feedback':          { key: 'dc403cf137e4cd1eb8d108f6334d4f34a64fbcf0', kitNode: null },
  'filter':            { key: '4a36aefd3adb9dcfb512d16c39fd498445aed452', kitNode: null },
  'folder':            { key: 'b4138c37ac961f4683a13edb0c9b07aba856e825', kitNode: null },
  'full-screen':       { key: '8b7f0a993478cced7b0589aef55af29fd773d1e5', kitNode: null },
  'globe':             { key: 'ff1de89f036f7aef09afe2d157fc3bd9206cee7f', kitNode: null },
  'grid':              { key: '08fc0d537befd77bd9c8fcb72bca88271bdacb72', kitNode: null },
  'group':             { key: '361026d73858fabff3db3e9bdea5a18681beccc2', kitNode: '1095:2441' },
  'headset':           { key: '70f783eaac4df392cc9146a74c68638899f8e2b6', kitNode: null },
  'heating-cooling':   { key: '396436a4e244a78ea435d973b9ff1512652d46c5', kitNode: null },
  'hint':              { key: '680a6bf9940fcd988903ba45b53ee2fc40489eb0', kitNode: null },
  'history':           { key: '02fb2cf833be737a93b92e670159c09f6562bd4b', kitNode: null },
  'home':              { key: 'ddf4537c2f792179f11f64cae869cd1241e5ec7e', kitNode: null },
  'information':       { key: 'a46fdc47795362da045a36eb5e7a320266efd3fe', kitNode: null },
  'legend':            { key: 'be0098a2d337713ab008da292b44c7293790d6f4', kitNode: '1105:2456' },
  'light-mode':        { key: '386a631748671bd2d67980283c192324893e1edb', kitNode: null },
  'menu2':             { key: 'a7f9be7cb39dfe5e125eee25db84607ed7d2d918', kitNode: null },
  'multi-select':      { key: 'c431b4ea53e201aa56428ac81bfba9971d2b0341', kitNode: '1105:2511' },
  'nav-back':          { key: '18bca208e143211eb147b3a36cb92ca818f17ff7', kitNode: null },
  'overflow':          { key: '6a0c2f0be4be541cc17870a7a633b19e3cb2d1df', kitNode: null },
  'paste':             { key: 'c505d7b9a8d43374dbe535f86d10de8d513d010e', kitNode: null },
  'present':           { key: '265629e8409332355482d6b3cf1d03f664f3880d', kitNode: null },
  'pushpin-off':       { key: '93c06ac408d51989665d4e81d7d31a28f5cceb94', kitNode: null },
  'question-mark':     { key: '70170cac2c7c3c842f40c688a260fcd2b06723b6', kitNode: null },
  'search':            { key: 'f3837f5ce4099717f6925b3be2bfddabb212baeb', kitNode: null },
  'shield':            { key: 'cbcb7299681e4d8f03d169718754a3380ef5bba0', kitNode: null },
  'slim-arrow-down':   { key: 'd206a924630cb08c1b62f4c2ddef383b8142e519', kitNode: null },
  'slim-arrow-left':   { key: '6727ead97eeafcaf11454bbb2bc826a536917456', kitNode: null },
  'slim-arrow-right':  { key: '3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d', kitNode: null },
  'slim-arrow-up':     { key: 'f852031802bbe5bebd03387c3c54c58e4367bba0', kitNode: null },
  'sort':              { key: '8d18dc73bb269e91c1b52ba25c63f2b93f48693e', kitNode: null },
  'survey':            { key: '68584140023e22a8403f6fee50caa98772a1993b', kitNode: null },
  'synchronize':       { key: '11185a03d96b3094a280553fa177deb1fecd90d8', kitNode: null },
  'sys-enter-2':       { key: 'a69b0f2584613dc61fbeac927db00f6b576a10eb', kitNode: null },
  'unfavorite':        { key: 'c8cd8d03b1432b53d0acfa1281e35e4a6217a034', kitNode: null },
  'walk-me':           { key: 'ca9097c1b688ad0c252549be338e7fe7463a8f6d', kitNode: null },
  'widgets':           { key: 'c3c0c229b9fc028315d3c42fddbd060276dc68db', kitNode: null },
  'windows-doors':     { key: 'bf4c690a831a9d75351c74e4ad578b527d08fa8f', kitNode: null },
  'work-history':      { key: '569275ae1faf491c778afb8af9537b7bb017e5d2', kitNode: null },
  'workflow-tasks':    { key: 'da7895718bd93181a9b97479314ad30fc80a51ca', kitNode: null },
  'world':             { key: '06fefdbe0253df67144f19920a730792ceb01d16', kitNode: null },
  'wrench':            { key: '75f0fa42efe3014f303b55ca1b4f37552f592af1', kitNode: '1096:2325' },
  'write-new':         { key: 'c09c4ad572cc66c94388108e458a286220e761a9', kitNode: null },
};


// In-memory cache of imported icon components (key → Component) for one build run
const _iconComponentCache = {};

// resolveKitIcon(iconRef) → Promise<Component|null>
// iconRef may be 'sap-icon://wrench', 'wrench', or a raw kit node id.
// Returns the imported SAP Web UI Kit icon Component, ready to assign to an
// INSTANCE_SWAP property. Returns null if the key is unknown (caller keeps the
// kit-default icon + logs). This is the SINGLE canonical icon resolver — every
// handler that sets an icon MUST go through it so icons always come from the kit.
async function resolveKitIcon(iconRef) {
  if (!iconRef) return null;
  const name = String(iconRef).replace('sap-icon://', '').trim();
  const entry = ICON_KEYS[name];
  if (!entry || !entry.key) {
    try { logException('icon-key-unknown', name,
      'No SAP Web UI Kit key for icon "' + name + '". Harvest via instance.getMainComponentAsync().key and add to ICON_KEYS. See knowledge/guidelines/sap-web-ui-kit-icons.md'); } catch(e) {}
    return null;
  }
  if (_iconComponentCache[entry.key]) return _iconComponentCache[entry.key];
  try {
    const comp = await figma.importComponentByKeyAsync(entry.key);
    if (comp) { _iconComponentCache[entry.key] = comp; return comp; }
  } catch(e) {
    try { logException('icon-import-failed', name, 'importComponentByKeyAsync failed for key ' + entry.key + ': ' + (e && e.message)); } catch(e2) {}
  }
  return null;
}

// Spec component name → SAP_KEYS key
const KEY_MAP = {
  // Shell / Navigation
  ShellBar:             'ShellBar',
  Breadcrumbs:          'Breadcrumb',
  Breadcrumb:           'Breadcrumb',
  SideNavigation:       'SideNavigation',
  NavigationList:       'SideNavigation',     // alias — SideNavigation IS a NavigationList
  NavigationListItem:   'NavigationItem',     // alias — same component as NavigationItem
  ToolHeader:           'ToolHeader',
  Footer:               'Footer',
  UserMenu:             'UserMenu',
  QuickViewCard:        'Card',                // alias — QuickViewCard renders as Card inside Popover
  // Resolved 2026-06-27 — direct components added to SAP_KEYS
  Tabs:                 'Tabs',
  ToggleButton:         'ToggleButton',
  Wizard:               'Wizard',
  ActionListItem:       'ActionListItem',
  FeedInput:            'FeedInput',
  IconTabSeparator:     'IconTabSeparator',
  Timeline:             'Timeline',
  // Resolved 2026-06-27 — composed/alias paths
  MaskedInput:          'Input',                // alias — sap.m.MaskedInput renders as Input with mask placeholder
  FormattedText:        'Text',                  // alias — renders as native Text with mixed font ranges
  IconTabHeader:        'IconTabBar',            // alias — header zone of IconTabBar

  // 2026-06-27 aliases (per registry figmaComponentId: "alias:X" entries).
  // These resolve to existing SAP components with variant overrides.
  BusyDialog:           'Dialog',                // Dialog containing BusyIndicator
  MessageBox:           'Dialog',                // Modal confirm / error / warning — Dialog with State variant
  MessagePopover:       'Popover',               // Popover containing MessageView content
  MessageToast:         'Toast',                 // sap.m.MessageToast
  QuickView:            'Popover',               // Popover variant — object preview
  ObjectPageHeader:     'DynamicPageHeader',     // ObjectPage header IS DynamicPageHeader
  ObjectPageSection:    'Panel',                 // section ≈ Panel with H2 title
  ObjectPageSubSection: 'Panel',                 // subsection ≈ Panel with H3 title
  ResponsiveTable:      'Table',                 // sap.m.Table IS the responsive table
  SimpleForm:           'Form',                  // composes same components as Form
  FormContainer:        'Form',                  // sub-element of Form
  FormElement:          'Form',                  // sub-element of Form

  // Buttons
  Button:               'Button',
  IconButton:           'IconButton',
  MenuButton:           'MenuButton',
  SegmentedButton:      'SegmentedButton',
  SplitButton:          'SplitButton',
  IconMenuButton:       'IconMenuButton',

  // Toolbars
  Toolbar:              'Toolbar',
  OverflowToolbar:      'Toolbar',
  ToolbarSpacer:        'ToolbarItems',

  // Page layout
  DynamicPageHeader:    'DynamicPageHeader',
  DynamicPageTitle:     'DynamicPageHeader',
  // FilterBar: rendered as native horizontal frame (see FilterBar handler in buildSapNode) —
  // NOT aliased to DynamicPageHeader (that was a wrong pre-2026-07-09 workaround that
  // caused FilterBar to render as a duplicate page header with "Page Title" placeholders).
  ObjectHeader:         'DynamicPageHeader',
  IconTabBar:           'IconTabBar',
  TabBar:               'IconTabBar',

  // Table / Tree / List
  Table:                'Table',
  TableCell:            'TableCell',
  Tree:                 'Tree',
  TreeItem:             'TreeItem',
  List:                 'List',
  StandardListItem:     'ListItem',
  ListItem:             'ListItem',
  NotificationListItem: 'NotificationListItem',

  // Form inputs
  Input:                'Input',
  SearchField:          'Input',
  Select:               'Select',
  ComboBox:             'Select',
  MultiComboBox:        'MultiCombobox',
  MultiInput:           'MultiInput',
  CheckBox:             'CheckBox',
  RadioButton:          'RadioButton',
  Switch:               'Switch',
  TextArea:             'TextArea',
  DatePicker:           'DateRangePicker',
  DateRangeSelection:   'DateRangePicker',
  DateRangePicker:      'DateRangePicker',
  DateTimePicker:       'DateTimePicker',
  TimePicker:           'TimePicker',
  StepInput:            'StepInput',
  Slider:               'Slider',
  RangeSlider:          'RangeSlider',
  Label:                'Label',
  Title:                'Label',
  FileUploader:         'FileUploader',

  // Display
  Link:                 'Link',
  ObjectStatus:         'ObjectStatus',
  ObjectIdentifier:     'ObjectIdentifier',
  ObjectNumber:         'ObjectNumber',
  ObjectAttribute:      'ObjectAttribute',
  Avatar:               'Avatar',
  Tag:                  'Tag',
  InfoLabel:            'Tag',
  GenericTag:           'Tag',
  Image:                'Image',
  Bar:                  'Bar',
  DynamicSideContent:   'DynamicSideContent',
  MenuListItem:         'MenuListItem',
  ProgressIndicator:    'ProgressIndicator',
  RatingIndicator:      'RatingIndicator',
  BusyIndicator:        'BusyIndicator',
  Calendar:             'Calendar',
  Card:                 'Card',
  Carousel:             'Carousel',

  // Feedback / Overlays
  MessageStrip:         'MessageStrip',
  IllustratedMessage:   'IllustratedMessage',
  Toast:                'Toast',
  Dialog:               'Dialog',
  Popover:              'Popover',
  Menu:                 'Menu',
  Notifications:        'Notifications',
  NotificationBanner:   'NotificationBanner',

  // Containers
  Panel:                'Panel',
  Form:                 'Form',
  Tokenizer:            'Tokenizer',
  Token:                'Token',
  ProductSwitch:        'ProductSwitch',
  Settings:             'Settings',
  ColorPicker:          'ColorPicker',
  AIButton:             'AIButton',
  AIPromptInput:        'AIPromptInput',
  // 2026-07-07 — Wave 3: full SAP Web UI Kit coverage (20 KEY_MAP entries; 12 more already present above)
  AIInput:              'AIInput',
  AIMenuButton:         'AIMenuButton',
  AIRichTextEditor:     'AIRichTextEditor',
  AISplitMenuButton:    'AISplitMenuButton',
  AITextArea:           'AITextArea',
  AddDimensions:        'AddDimensions',
  AddPeopleToCalendar:  'AddPeopleToCalendar',
  DropDown:             'DropDown',
  EmptyPlanningCalendar:'EmptyPlanningCalendar',
  GroupingColumns:      'GroupingColumns',
  HomepageHeroBanner:   'HomepageHeroBanner',
  IconSplitButton:      'IconSplitButton',
  InputMessagePopover:  'InputMessagePopover',
  NoNotifications:      'NoNotifications',
  Scrollbar:            'Scrollbar',
  ShellSearch:          'ShellSearch',
  TwoMonthCalendar:     'TwoMonthCalendar',
  UnableToLoadImage:    'UnableToLoadImage',
  Banner:               'Banner',
  Legend:               'Legend',
  // 2026-07-07 Wave B — primitives from SAPUI5 core
  App:                  'App',                    // sap.m.App — root app container (pass-through in LAYOUT_CONTAINERS)
  Page:                 'Page',                   // sap.m.Page — page wrapper (pass-through in LAYOUT_CONTAINERS)
  HBox:                 'HBox',                   // sap.m.HBox — horizontal layout (pass-through)
  VBox:                 'VBox',                   // sap.m.VBox — vertical layout (pass-through)
  FlexBox:              'FlexBox',                // sap.m.FlexBox — responsive flex (pass-through)
  FlexibleColumnLayout: 'FlexibleColumnLayout',   // sap.f.FlexibleColumnLayout — master/detail split
  MaskInput:            'MaskedInput',            // sap.m.MaskInput alias for our MaskedInput → Input alias chain
  Item:                 'Item',                   // sap.ui.core.Item — composed sub-item, no render
  MessagePopoverItem:   'MessagePopoverItem',     // composed by MessagePopover
  SegmentedButtonItem:  'SegmentedButtonItem',    // composed by SegmentedButton
};

// Pure layout containers — transparent in Figma model
const LAYOUT_CONTAINERS = new Set([
  'DynamicPage', 'Page', 'ObjectPageLayout', 'FlexibleColumnLayout',
  'FlexBox', 'HBox', 'VBox',
  'App',       // 2026-07-07 Wave B — SAPUI5 root application container (pass-through)
  'Column', 'ColumnListItem',
  'Text',
  'Label',   // inline — only meaningful inside Form, skip when standalone
]);

// Native renderers — custom components built as native Figma frames (bypass SAP instances)
// These pass validation and are handled directly in buildSapNode
const NATIVE_RENDERERS = new Set([
  // 2026-07-10 Phase 3: removed fragile native renderers (Native*/Artifact*/Package*/
  // Figma*/Ref79*) — replaced by MCP-first real-component builds (RULE 25).
  'DropdownItem',  // native frame for dropdown menu items (still used by Select/ComboBox flows)
  'SapColHeader', 'SapTableRow', 'SapFormSection',
  'AvatarGroup',   // composed: N Avatar instances + optional +N overflow counter
  'Text',          // native text node with SAP variable-bound fill (no SAP instance)
  'Dialog',        // native renderer: header bar + content area + footer, all token-bound
  'Panel',         // native renderer: rounded card with title + children
  'SimpleForm',    // native renderer: right-aligned label+input rows
  'FormContainer', // alias of SimpleForm
  // Composed-by-parent components — render via their parent handler, but the
  // validator must accept them as standalone spec emissions too. See doc:
  // skill/references/component-update-rule.md (the "3-place rule").
  'FeedListItem',          // composed by List parent (ListItem + Avatar)
  'GroupHeaderListItem',   // composed by List parent (ListItem styled as header)
  'InputListItem',         // composed by List parent (ListItem + Input)
  'ObjectListItem',        // composed by List parent (ObjectCard + ListItem)
  'ObjectMarker',          // composed (icon + text combo)
  'ProgressStep',          // composed by Wizard parent
  'RadioButtonGroup',      // composed (N RadioButton instances)
  'TimelineItem',          // composed by Timeline parent
  'WizardStep',            // composed by Wizard parent
  // Components recognized by plugin SAP_KEYS but not directly in KEY_MAP
  // - the validator allow-list must include them explicitly:
  'NavigationItem',        // composed by SideNavigation parent
  'Header',                // synonym for ShellBar in some templates
  'MultiCombobox',         // SAP-naming variant (also MultiComboBox exists)
  'ToolbarItems',          // bag of items inside a Toolbar
  // 2026-07-07 — Wave 1/2/3 additions
  'Image',                 // native placeholder frame (SAP kit has no Image component)
  'DynamicSideContent',    // composed: main + side content horizontal split (no library counterpart)
  // 2026-07-07 — Wave B (primitives): sub-items composed by their parents
  'Item',                  // sap.ui.core.Item — composed by Select/ComboBox/MultiComboBox
  'MessagePopoverItem',    // composed by MessagePopover parent
  'SegmentedButtonItem',   // composed by SegmentedButton parent
]);

// (OPAQUE_SAP removed 2026-07-11 — its only consumer flatWalk was deleted as dead code.)

// ─────────────────────────────────────────────────────────────────────────────
// MANDATORY SAP TOKEN WHITELIST — hard rule per project spec
// Every fill, stroke, and text color in ANY native renderer must use one of
// these token names. Specs referencing tokens outside this list are REJECTED
// during validation. Raw hex colors in specs are REJECTED unconditionally.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// SAP MANDATORY TOKENS — these are the ACTUAL Figma Variable names published
// by the SAP Web UI Kit team library. Names verified via variable_defs inspection
// of node 1:4452 (ShellBar), 76:75444 (Title), 76:75465 (List Item Title),
// 21:32535 (Toolbar) in file p7zm5EMBk5DRRZdxNeJ4f5.
//
// At runtime the plugin imports each variable via teamLibrary lookup and binds
// it via node.setBoundVariable('fills', variable) — never sets a raw RGB color.
// The "hex" field is ONLY a last-resort fallback if the SAP library is
// disconnected; it is NEVER used when the library is connected.
// ─────────────────────────────────────────────────────────────────────────────
const MANDATORY_TOKENS = {
  // Shell / page surfaces
  'sapShellColor':                       { use: 'Page / shell background',        hex: '#FFFFFF' },
  'sapShell_Background':                 { use: 'Shell area background',          hex: '#FFFFFF' },
  'sapShell_InteractiveBackground':      { use: 'Hover / active surface',         hex: '#EFF1F2' },
  'sapBackgroundColor':                  { use: 'App content background',         hex: '#F5F6F7' },
  'sapObjectHeader_Background':          { use: 'Object Header / Dialog title bg', hex: '#FFFFFF' },

  // Borders / separators
  'sapShell_BorderColor':                { use: 'Shell bar bottom border',        hex: '#D9D9D9' },
  'sapGroup_TitleBorderColor':           { use: 'Section / table divider',        hex: '#A8B3BD' },
  'sapField_BorderColor':                { use: 'Input / checkbox border',        hex: '#556B81' },
  'sapButton_BorderColor':               { use: 'Default button border',          hex: '#BCC3CA' },
  'sapList_SelectionBackgroundColor':    { use: 'Selected row bg (blue tint)',    hex: '#EBF8FF' },
  'sapList_SelectionBorderColor':        { use: 'Selected step border / outline', hex: '#0064D9' },
  'sapList_HighlightColor':              { use: 'Active step circle fill',        hex: '#0064D9' },
  'sapList_BorderColor':                 { use: 'List separator / future step',   hex: '#E5E5E5' },
  'sapContent_Selected_ForegroundColor': { use: 'Active step underline',          hex: '#0064D9' },
  'sapContent_ContrastTextColor':        { use: 'Number on filled circle',        hex: '#FFFFFF' },
  'sapNeutralColor':                     { use: 'Future / inactive step number',  hex: '#788FA6' },

  // Text — hierarchy
  'sapTitleColor':                       { use: 'Page title / H1',                hex: '#1D2D3E' },
  'sapTextColor':                        { use: 'Body / default text (canonical)', hex: '#131E29' }, // 2026-07-10 verified vs live kit source of truth
  'sapList_TextColor':                   { use: 'List / table cell text',         hex: '#131E29' },
  'sapShell_TextColor':                  { use: 'ShellBar text',                  hex: '#1D2D3E' },
  'sapShell_InteractiveTextColor':       { use: 'Shell interactive text',         hex: '#131E29' },
  'sapContent_LabelColor':               { use: 'Metadata labels',                hex: '#556B82' },
  'sapField_PlaceholderTextColor':       { use: 'Input placeholder',              hex: '#556B82' },

  // Brand / interactive
  'sapButton_TextColor':                 { use: 'Default button text / link',     hex: '#0064D9' },
  'sapButton_Lite_TextColor':            { use: 'Transparent button text',        hex: '#0064D9' },
  'sapButton_Background':                { use: 'Default button background',      hex: '#FFFFFF' },

  // Emphasized (primary) button
  'sapButton_Emphasized_Background':     { use: 'Primary CTA background',         hex: '#0070F2' },
  'sapButton_Emphasized_TextColor':      { use: 'Primary CTA text',               hex: '#FFFFFF' },

  // Semantic status colors (ObjectStatus, error / locked / draft text)
  'sapNegativeTextColor':                { use: 'Negative status text (red)',     hex: '#BB0000' },
  'sapNegativeColor':                    { use: 'Negative semantic color',        hex: '#BD2920' },
  'sapCriticalTextColor':                { use: 'Critical / warning text',        hex: '#DF7B01' },
  'sapPositiveTextColor':                { use: 'Positive / success text',        hex: '#1E8F56' },

  // Reserved expansion slot
  'sapShell_SubBrand_TextColor':         { use: 'Brand sub-text',                 hex: '#556B82' },

  // 2026-07-07 Wave A — 20 tokens added to close the registry-vs-plugin gap.
  // Every token below is referenced by at least one registry entry's
  // colorTokenRules[]. Fallback hex values are the SAP Horizon defaults.
  'sapActiveColor':                      { use: 'Focused / today emphasis',       hex: '#0064D9' },
  'sapContent_Container_Background':     { use: 'Card / Menu popover background', hex: '#FFFFFF' },
  'sapContent_Container_BorderColor':    { use: 'Card / Menu popover border',     hex: '#E5E5E5' },
  'sapContent_NonRatedColor':            { use: 'Empty rating star',              hex: '#C0C8CE' },
  'sapContent_Placeholderloading':       { use: 'Image / skeleton placeholder',   hex: '#EFF1F2' },
  'sapContent_RatedColor':               { use: 'Filled rating star',             hex: '#F5C518' },
  'sapCriticalElementColor':             { use: 'Warning icon fill',              hex: '#DF7B01' },
  'sapField_Background':                 { use: 'Input / Select / ComboBox bg',   hex: '#FFFFFF' },
  'sapField_FocusColor':                 { use: 'Input focus ring',               hex: '#0070F2' },
  'sapField_TextColor':                  { use: 'Input value text',               hex: '#1D2D3E' }, // 2026-07-10 fixed vs live kit (was #1A2733)
  'sapInformativeElementColor':          { use: 'Info icon fill',                 hex: '#0070F2' },
  'sapLegendColor3':                     { use: 'Marked day / legend swatch 3',   hex: '#C35500' },
  'sapList_Background':                  { use: 'Calendar / List surface',        hex: '#FFFFFF' },
  'sapList_Hover_Background':            { use: 'List / Menu hover row',          hex: '#EFF1F2' },
  'sapNegativeElementColor':             { use: 'Error icon fill',                hex: '#BD2920' },
  'sapObjectHeader_BorderColor':         { use: 'Object Header separator',        hex: '#D9D9D9' },
  'sapPageHeader_Background':            { use: 'Bar / SubHeader background',     hex: '#FFFFFF' },
  'sapPageHeader_BorderColor':           { use: 'Bar / SubHeader separator',      hex: '#D9D9D9' },
  'sapPositiveElementColor':             { use: 'Success icon fill',              hex: '#1E8F56' },
  'sapSelectedColor':                    { use: 'Calendar selected day fill',     hex: '#0064D9' },
  // 2026-07-09 · Validation pass — tokens referenced in registry but missing from whitelist
  'sapButton_AI_Background':             { use: 'AI Button / Joule primary bg',   hex: '#5D36FF' },
  'sapButton_AI_BorderColor':            { use: 'AI Button border',               hex: '#5D36FF' },
  'sapButton_AI_IconColor':              { use: 'AI Button icon fill',            hex: '#FFFFFF' },
  'sapButton_AI_TextColor':              { use: 'AI Button label text',           hex: '#FFFFFF' },
  'sapButton_BorderCornerRadius':        { use: 'Button corner radius token',     hex: '0' },
  'sapButton_Hover_Background':          { use: 'Button hover state bg',          hex: '#F5F6F7' },
  'sapButton_Selected_Background':       { use: 'Button selected/pressed bg',     hex: '#E8F2FF' },
  'sapButton_Selected_TextColor':        { use: 'Button selected label text',     hex: '#0064D9' },
  'sapContent_DisabledTextColor':        { use: 'Disabled text / placeholder',    hex: '#89919A' },
  'sapContent_FocusColor':               { use: 'Input / element focus ring',     hex: '#0070F2' },
  'sapContent_ImagePlaceholderColor':    { use: 'Image placeholder border',       hex: '#889CAC' },
  'sapContent_Placeholderloading_Background': { use: 'Loading placeholder bg',   hex: '#EFF1F2' },
  'sapIllus_PatternHighlight':           { use: 'Illustration highlight color',   hex: '#0070F2' },
  'sapIllus_PatternShadow':              { use: 'Illustration shadow color',      hex: '#223548' },
  'sapLegendColor1':                     { use: 'Chart / legend swatch 1',        hex: '#0070F2' },
  'sapLegendColor2':                     { use: 'Chart / legend swatch 2',        hex: '#E6600D' },
  'sapLinkColor':                        { use: 'Hyperlink text color',           hex: '#0064D9' },
  'sapPageFooter_Background':            { use: 'Page footer bg',                 hex: '#F5F6F7' },
  'sapPageFooter_BorderColor':           { use: 'Page footer top border',         hex: '#D9D9D9' },
  'sapPageFooter_TextColor':             { use: 'Page footer text',               hex: '#6A6D70' },
  'sapScrollBar_FaceColor':              { use: 'Scrollbar thumb fill',           hex: '#9EA8B1' },
  'sapScrollBar_Hover_FaceColor':        { use: 'Scrollbar thumb hover',          hex: '#7E8B93' },
  'sapScrollBar_TrackColor':             { use: 'Scrollbar track bg',             hex: '#F5F6F7' },
  'sapShell_Hover_Background':           { use: 'ShellBar item hover bg',         hex: '#3E526A' },
  'sapToolbar_Background':               { use: 'Toolbar surface bg',             hex: '#FFFFFF' },
  'sapToolbar_SeparatorColor':           { use: 'Toolbar divider line',           hex: '#E5E5E5' },
  // Additional tokens found in legacy specs (2026-07-09 CLI validator pass)
  'sapList_HeaderTextColor':             { use: 'Table header text',              hex: '#1D2D3E' },
  'sapContent_UnratedColor':             { use: 'Unrated / inactive star',        hex: '#B0BFC9' },
};

const MANDATORY_TOKEN_NAMES = Object.keys(MANDATORY_TOKENS);

// ─────────────────────────────────────────────────────────────────────────────
// SAP SPACING TOKENS — numeric variables published by the SAP Web UI Kit.
// Names verified via variable_defs inspection of nodes 1:4452 (ShellBar) and
// 76:75444 (Title). These bind to layoutNode properties (padding, itemSpacing,
// strokeWeight) via figma.variables.setBoundVariableForLayoutMode-style APIs.
//
// The "px" field is ONLY a last-resort fallback if the SAP library is
// disconnected; it is NEVER used when the library is connected.
// ─────────────────────────────────────────────────────────────────────────────
const MANDATORY_SPACING_TOKENS = {
  // Element heights (control heights)
  'sapElement_Height':                   { use: 'Cozy control height',     px: 36 },
  'sapElement_Compact_Height':           { use: 'Compact control height',  px: 26 },
  'sapElement_LineHeight':               { use: 'Cozy line height',        px: 14 },
  'sapElement_Compact_LineHeight':       { use: 'Compact line height',     px: 14 },

  // Border widths
  'sapButton_BorderWidth':               { use: 'Button border',           px: 1 },
  'sapGroup_TitleBorderWidth':           { use: 'Section / table border',  px: 1 },

  // Corner radius
  'sapButton_BorderCornerRadius':        { use: 'Button corner radius',    px: 8 },
  'sapElement_BorderCornerRadius':       { use: 'Element corner radius',   px: 4 },
};
const MANDATORY_SPACING_TOKEN_NAMES = Object.keys(MANDATORY_SPACING_TOKENS);


// ─────────────────────────────────────────────────────────────────────────────
// SAP LIBRARY VARIABLE RESOLVER (Variables API — replaces old Paint Style API)
//
// SAP Horizon publishes its colors as Figma VARIABLES, not Paint Styles.
// The old getLocalPaintStyles() approach NEVER found anything and every
// token call fell through to raw RGB — that's why the inspector was showing
// #1D2E3B instead of token names.
//
// Correct flow:
//   1. figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()
//      → list collections published by SAP Web UI Kit
//   2. figma.teamLibrary.getVariablesInLibraryCollectionAsync(collection.key)
//      → list variables in each collection
//   3. figma.variables.importVariableByKeyAsync(variable.key)
//      → import a variable into this file (idempotent + cached)
//   4. node.setBoundVariable('fills', variable)  / 'strokes'
//      → bind variable so the inspector shows the token name
// ─────────────────────────────────────────────────────────────────────────────

const _variableCache = {};      // tokenName → Variable handle (imported)
const _libraryVariablesIndex = {}; // tokenName (lowercased) → { key, libraryName, originalName } from team library
let _libraryIndexed = false;
let _libraryIndexingPromise = null; // dedupe concurrent indexLibraryVariablesOnce() calls

// clientStorage key + freshness window (7 days)
const _CACHE_KEY = 'sapFigmaBuilder.varIndex.v1';
const _CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function _loadIndexFromStorage() {
  try {
    if (!figma.clientStorage || !figma.clientStorage.getAsync) return null;
    const blob = await figma.clientStorage.getAsync(_CACHE_KEY);
    if (!blob || !blob.savedAt || !blob.index) return null;
    if (Date.now() - blob.savedAt > _CACHE_TTL_MS) return null; // stale
    return blob;
  } catch (e) { return null; }
}

async function _saveIndexToStorage() {
  try {
    if (!figma.clientStorage || !figma.clientStorage.setAsync) return;
    await figma.clientStorage.setAsync(_CACHE_KEY, {
      savedAt: Date.now(),
      index: _libraryVariablesIndex,
    });
  } catch (e) {}
}

async function _doIndexLibraryVariables() {
  if (!figma.teamLibrary || !figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync) {
    logException('variables-api-missing', '', 'figma.teamLibrary not available — old Plugin API host?');
    return;
  }
  let collections;
  try {
    collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  } catch (e) {
    logException('variables-library-list-failed', '', e.message || String(e));
    return;
  }
  if (!collections || collections.length === 0) return;

  // Parallel read: fetch variables from every collection at once instead of serially.
  // Previously this was the slow part (one round-trip per collection).
  const results = await Promise.all(
    collections.map(async (col) => {
      try {
        const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(col.key);
        return { col, vars: vars || [] };
      } catch (e) {
        logException('variables-collection-read-failed', col.name || col.key, e.message || String(e));
        return { col, vars: [] };
      }
    })
  );

  for (const { col, vars } of results) {
    for (const v of vars) {
      const entry = { key: v.key, libraryName: col.name, originalName: v.name };
      const lower = v.name.toLowerCase();
      if (!_libraryVariablesIndex[lower]) _libraryVariablesIndex[lower] = entry;

      if (v.name.indexOf('/') >= 0) {
        const tail = v.name.split('/').pop().toLowerCase();
        if (!_libraryVariablesIndex[tail]) _libraryVariablesIndex[tail] = entry;
      }
    }
  }
}

async function indexLibraryVariablesOnce(force) {
  if (_libraryIndexed && !force) return;
  if (_libraryIndexingPromise && !force) return _libraryIndexingPromise;

  _libraryIndexingPromise = (async () => {
    try {
      // 1. Restore from clientStorage if fresh and not forced
      if (!force) {
        const blob = await _loadIndexFromStorage();
        if (blob) {
          Object.assign(_libraryVariablesIndex, blob.index);
          _libraryIndexed = true;
          // Notify UI: instant cold-start
          try {
            figma.ui.postMessage({
              type: 'library-cache-state',
              state: 'ready',
              totalVariables: Object.keys(_libraryVariablesIndex).length,
              fromStorage: true,
              ageMs: Date.now() - blob.savedAt,
            });
          } catch (e) {}
          return;
        }
      }

      // 2. Live scan (slow path)
      try {
        figma.ui.postMessage({ type: 'library-cache-state', state: 'scanning' });
      } catch (e) {}
      await _doIndexLibraryVariables();
      _libraryIndexed = true;
      await _saveIndexToStorage();
      try {
        figma.ui.postMessage({
          type: 'library-cache-state',
          state: 'ready',
          totalVariables: Object.keys(_libraryVariablesIndex).length,
          fromStorage: false,
        });
      } catch (e) {}
    } finally {
      _libraryIndexingPromise = null;
    }
  })();

  return _libraryIndexingPromise;
}

async function getVariable(tokenName) {
  if (_variableCache[tokenName]) return _variableCache[tokenName];
  await indexLibraryVariablesOnce();

  // 1. Imported (current file or already-imported library variable) — try local first
  try {
    const localCol = figma.variables.getLocalVariableCollections ? figma.variables.getLocalVariableCollections() : [];
    for (const col of localCol) {
      for (const id of (col.variableIds || [])) {
        const v = figma.variables.getVariableById ? figma.variables.getVariableById(id) : null;
        if (v && v.name.toLowerCase() === tokenName.toLowerCase()) {
          _variableCache[tokenName] = v;
          return v;
        }
      }
    }
  } catch (e) {}

  // 2. Team library — import by key (case-insensitive lookup)
  const entry = _libraryVariablesIndex[tokenName.toLowerCase()];
  if (entry && entry.key) {
    try {
      const v = await figma.variables.importVariableByKeyAsync(entry.key);
      if (v) {
        _variableCache[tokenName] = v;
        return v;
      }
    } catch (e) {
      logException('variable-import-failed', tokenName, e.message || String(e));
    }
  }

  // 3. Fallback: direct key lookup from HORIZON_VARIABLE_KEYS (baked into bundle by build script)
  // This path fires when the library scan hasn't run yet or the name-based lookup failed.
  // The keys were harvested live on 2026-07-10 and are known-good for the SAP Web UI Kit.
  if (typeof HORIZON_VARIABLE_KEYS !== 'undefined') {
    const hEntry = HORIZON_VARIABLE_KEYS[tokenName] || HORIZON_VARIABLE_KEYS[tokenName.toLowerCase()];
    if (hEntry && hEntry.key) {
      try {
        const v = await figma.variables.importVariableByKeyAsync(hEntry.key);
        if (v) {
          _variableCache[tokenName] = v;
          noteTokenLinked();
          return v;
        }
      } catch (e) {
        logException('variable-key-import-failed', tokenName, e.message || String(e));
      }
    }
  }

  if (!entry) {
    logException('variable-not-in-index', tokenName, 'Library index has ' + Object.keys(_libraryVariablesIndex).length + ' variables, none match this name (case-insensitive). Probe a few: ' + Object.keys(_libraryVariablesIndex).slice(0,5).join(', '));
  }
  return null;
}

// Exception log — every token that fell back to raw RGB instead of bound variable
const _exceptions = [];
function logException(kind, tokenName, reason) {
  _exceptions.push({ kind: kind, token: tokenName, reason: reason, ts: Date.now() });
}
function resetExceptions() { _exceptions.length = 0; }

// 2026-07-07 Wave C — Token linkage metrics.
// Counts every attempt to bind a SAP semantic token to a Figma library variable.
// Emitted as part of the build report so we can measure how often the plugin
// actually succeeds at linking (vs falling back to raw RGB from MANDATORY_TOKENS).
const _tokenMetrics = { attempted: 0, linked: 0, fallback: 0, byToken: {} };
function resetTokenMetrics() {
  _tokenMetrics.attempted = 0;
  _tokenMetrics.linked = 0;
  _tokenMetrics.fallback = 0;
  _tokenMetrics.byToken = {};
}
function noteTokenAttempt() { _tokenMetrics.attempted++; }
function noteTokenLinked()  { _tokenMetrics.linked++; }
function noteTokenFallback(tokenName) {
  _tokenMetrics.fallback++;
  _tokenMetrics.byToken[tokenName] = (_tokenMetrics.byToken[tokenName] || 0) + 1;
}
function summarizeTokenMetrics() {
  const m = _tokenMetrics;
  if (m.attempted === 0) return null;
  const pct = ((m.linked / m.attempted) * 100).toFixed(1);
  const topFallbacks = Object.entries(m.byToken)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t, n]) => t + ' (' + n + ')')
    .join(', ');
  const lines = [
    '[Tokens] ' + m.linked + ' of ' + m.attempted + ' color references linked to SAP style variables (' + pct + '%)',
  ];
  if (m.fallback > 0) {
    lines.push('[Tokens] ' + m.fallback + ' fallbacks' + (topFallbacks ? ': ' + topFallbacks : ''));
  }
  return lines.join('\n');
}

// Convert "#RRGGBB" to Figma {r,g,b} in 0..1 range. Used ONLY as last-resort
// fallback when the SAP library is disconnected.
function hexToRgb(hex) {
  if (!hex || hex.charAt(0) !== '#') return { r: 0, g: 0, b: 0 };
  const h = hex.length === 4
    ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    : hex;
  return {
    r: parseInt(h.slice(1, 3), 16) / 255,
    g: parseInt(h.slice(3, 5), 16) / 255,
    b: parseInt(h.slice(5, 7), 16) / 255,
  };
}

// Apply SAP token fill to a node. Binds the variable via the documented
// clone-paint-rebind pattern so the inspector shows the variable NAME, not hex.
async function applyFill(node, tokenName) {
  if (!MANDATORY_TOKENS[tokenName]) {
    logException('fill-invalid-token', tokenName, 'Not in MANDATORY_TOKENS whitelist');
    return;
  }
  noteTokenAttempt();
  const v = await getVariable(tokenName);
  const fallbackRgb = hexToRgb(MANDATORY_TOKENS[tokenName].hex);
  if (v && figma.variables && figma.variables.setBoundVariableForPaint) {
    try {
      // Build a fresh SOLID paint, bind via the official API, assign as the only fill.
      // (The docs pattern uses clone(node.fills) but that fails when node.fills is
      // figma.mixed or empty; building a new single-paint array is equivalent.)
      let paint = { type: 'SOLID', color: fallbackRgb };
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
      node.fills = [paint];
      noteTokenLinked();
      return;
    } catch (e) {
      logException('fill-bind-failed', tokenName, e.message || 'setBoundVariableForPaint threw');
    }
  } else if (!v) {
    logException('fill-variable-not-found', tokenName, 'No library variable with this name — SAP Web UI Kit disconnected, or variable named differently in library?');
  } else {
    logException('fill-api-unavailable', tokenName, 'figma.variables.setBoundVariableForPaint not available in this Figma host.');
  }
  // Last-resort raw fallback so the canvas still renders — BUT this is no longer silent:
  // noteTokenFallback() increments _tokenMetrics.fallback, and bindMcpFrames now posts
  // type:'error' (not 'success') whenever fallback > 0 (INVARIANT 5, fail-closed 2026-07-18).
  // A fallback fill = an unresolved SAP variable = a build that must NOT ship as success.
  noteTokenFallback(tokenName);
  node.fills = [{ type: 'SOLID', color: fallbackRgb }];
}

async function applyStroke(node, tokenName) {
  if (!MANDATORY_TOKENS[tokenName]) {
    logException('stroke-invalid-token', tokenName, 'Not in MANDATORY_TOKENS whitelist');
    return;
  }
  noteTokenAttempt();
  const v = await getVariable(tokenName);
  const fallbackRgb = hexToRgb(MANDATORY_TOKENS[tokenName].hex);
  if (v && figma.variables && figma.variables.setBoundVariableForPaint) {
    try {
      let paint = { type: 'SOLID', color: fallbackRgb };
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
      node.strokes = [paint];
      noteTokenLinked();
      return;
    } catch (e) {
      logException('stroke-bind-failed', tokenName, e.message || 'setBoundVariableForPaint threw');
    }
  } else if (!v) {
    logException('stroke-variable-not-found', tokenName, 'No library variable — disconnected or wrong name?');
  } else {
    logException('stroke-api-unavailable', tokenName, 'setBoundVariableForPaint not available.');
  }
  noteTokenFallback(tokenName);
  node.strokes = [{ type: 'SOLID', color: fallbackRgb }];
}

// Text fills bind exactly the same way — Figma uses the 'fills' field on a
// TextNode for color, and setBoundVariableForPaint works identically.
async function applyTextFill(node, tokenName) {
  return applyFill(node, tokenName);
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ENFORCEMENT — runs after every Build Screen to catch raw fills/strokes
// that slipped past applyFill/applyStroke. Strategy:
//
//   1. Build an RGB → tokenName index from MANDATORY_TOKENS hex values (one-time)
//   2. Walk the entire built tree recursively
//   3. For every node with `figma.mixed`, raw fills, or raw strokes:
//        - read each Paint's RGB
//        - if RGB matches a MANDATORY_TOKEN within ε, re-bind via applyFill/applyStroke
//        - if no match, log a HARD violation in the exception log
//   4. Never let a raw paint reach the user — either bound to a variable or flagged
//
// This is the safety net: anywhere a developer wrote `node.fills = [solid(C.x)]`
// instead of `applyFill(node, 'sapXxx')`, this pass fixes it automatically.
// ─────────────────────────────────────────────────────────────────────────────

const _rgbToTokenIndex = (() => {
  const idx = {};
  // (a) MANDATORY_TOKENS canonical hex → token
  for (const [token, info] of Object.entries(MANDATORY_TOKENS)) {
    const rgb = hexToRgb(info.hex);
    const key = `${Math.round(rgb.r*1000)}_${Math.round(rgb.g*1000)}_${Math.round(rgb.b*1000)}`;
    if (!idx[key]) idx[key] = token;
  }
  // (b) Legacy C.* aliases — the historical RGB values used throughout the
  // synthesizing renderers. These map to the same SAP token concepts so the
  // global enforcer can repair raw fills emitted from legacy code paths.
  const LEGACY_RGB_TO_TOKEN = [
    // page surfaces
    ['#F5F6F7', 'sapBackgroundColor'],
    ['#FFFFFF', 'sapShellColor'],
    ['#F8F8F8', 'sapBackgroundColor'],   // 0.972/0.972/0.972
    ['#F9F9F9', 'sapBackgroundColor'],   // 0.976/0.976/0.976
    // borders
    ['#EAECEE', 'sapShell_BorderColor'],
    ['#E5E5E5', 'sapShell_BorderColor'],
    ['#D9D9D9', 'sapShell_BorderColor'],
    ['#A8B3BD', 'sapGroup_TitleBorderColor'],
    ['#BCC3CA', 'sapButton_BorderColor'],
    ['#556B81', 'sapField_BorderColor'],
    ['#74899D', 'sapField_BorderColor'],
    // text
    ['#1D2D3E', 'sapList_TextColor'],
    ['#1D2E3B', 'sapList_TextColor'],
    ['#131E29', 'sapList_TextColor'],
    ['#1A2733', 'sapTitleColor'],
    ['#1A2633', 'sapTitleColor'],
    ['#0B141E', 'sapTitleColor'],
    ['#223548', 'sapList_TextColor'],
    ['#32363A', 'sapList_TextColor'],
    ['#6A6D70', 'sapContent_LabelColor'],
    ['#556B82', 'sapContent_LabelColor'],
    ['#758CA4', 'sapContent_LabelColor'],
    // interactive
    ['#0064D9', 'sapButton_TextColor'],
    ['#0070F2', 'sapButton_Emphasized_Background'],
    ['#0A6ED1', 'sapButton_TextColor'],
    ['#003E87', 'sapShell_SubBrand_TextColor'],
    // selection bg / interactive bg
    ['#EFF1F2', 'sapShell_InteractiveBackground'],
    // off-white alternating row (SAP Fiori has no zebra striping — map to sapList_Background)
    ['#FAFAFA', 'sapList_Background'],
    // positive / success colors
    ['#1E8F56', 'sapPositiveTextColor'],
    ['#1F8F57', 'sapPositiveTextColor'],
    // critical / warning colors
    ['#DF7B01', 'sapCriticalTextColor'],
    ['#E07B00', 'sapCriticalTextColor'],
  ];
  for (const [hex, tok] of LEGACY_RGB_TO_TOKEN) {
    const rgb = hexToRgb(hex);
    const key = `${Math.round(rgb.r*1000)}_${Math.round(rgb.g*1000)}_${Math.round(rgb.b*1000)}`;
    if (!idx[key]) idx[key] = tok;
  }
  return idx;
})();

function _rgbKey(c) {
  return `${Math.round((c.r||0)*1000)}_${Math.round((c.g||0)*1000)}_${Math.round((c.b||0)*1000)}`;
}

function _isUnboundSolid(paint) {
  if (!paint || paint.type !== 'SOLID') return false;
  // A bound paint carries boundVariables.color
  if (paint.boundVariables && paint.boundVariables.color) return false;
  return true;
}

async function _enforceFillOnNode(node) {
  // Read fills safely
  let fills;
  try { fills = node.fills; } catch (e) { return; }
  if (fills === figma.mixed || !Array.isArray(fills) || fills.length === 0) return;

  // Find first unbound SOLID paint
  let needsRewrite = false;
  for (const p of fills) {
    if (_isUnboundSolid(p)) { needsRewrite = true; break; }
  }
  if (!needsRewrite) return;

  // For each unbound SOLID, look up RGB → token; rebind if matched
  let rewroteAny = false;
  for (let i = 0; i < fills.length; i++) {
    const p = fills[i];
    if (!_isUnboundSolid(p)) continue;
    const tok = _rgbToTokenIndex[_rgbKey(p.color)];
    if (tok) {
      try {
        await applyFill(node, tok);
        rewroteAny = true;
        break; // applyFill replaces the whole .fills array
      } catch (e) {
        logException('global-enforce-fill-failed', tok, e.message || String(e));
      }
    } else {
      // RGB doesn't match any whitelisted token — HARD violation
      const hex = '#' + [p.color.r, p.color.g, p.color.b]
        .map(c => Math.round(c*255).toString(16).padStart(2,'0').toUpperCase()).join('');
      logException('raw-rgb-leak', node.name || node.id, `Frame "${node.name}" has unbound SOLID fill ${hex} — no SAP token matches this RGB. Use applyFill(node, 'sapXxx') in the renderer.`);
    }
  }
  return rewroteAny;
}

async function _enforceStrokeOnNode(node) {
  let strokes;
  try { strokes = node.strokes; } catch (e) { return; }
  if (!Array.isArray(strokes) || strokes.length === 0) return;
  let needsRewrite = false;
  for (const p of strokes) {
    if (_isUnboundSolid(p)) { needsRewrite = true; break; }
  }
  if (!needsRewrite) return;
  for (let i = 0; i < strokes.length; i++) {
    const p = strokes[i];
    if (!_isUnboundSolid(p)) continue;
    const tok = _rgbToTokenIndex[_rgbKey(p.color)];
    if (tok) {
      try {
        await applyStroke(node, tok);
        return;
      } catch (e) {
        logException('global-enforce-stroke-failed', tok, e.message || String(e));
      }
    } else {
      const hex = '#' + [p.color.r, p.color.g, p.color.b]
        .map(c => Math.round(c*255).toString(16).padStart(2,'0').toUpperCase()).join('');
      logException('raw-rgb-stroke-leak', node.name || node.id, `Frame "${node.name}" has unbound SOLID stroke ${hex} — no SAP token matches.`);
    }
  }
}

const _SPACER_NAMES = new Set(['Spacer', 'spacer', 'Empty Frame', 'Empty', 'Gap', 'Spacer 8', 'Spacer 16', 'Spacer 24', 'Spacer 32', 'Spacer Large', 'Spacer Small', 'flex-grow', 'Spacer Frame']);

function _isSpacerFrame(node) {
  if (!node || node.type !== 'FRAME') return false;
  if (_SPACER_NAMES.has(node.name)) return true;
  // Heuristic: an empty named layoutGrow frame with no children and visible.
  // The legitimate Auto Layout "·" hidden grow node is exempt (visible=false).
  if (node.layoutGrow === 1 &&
      node.visible !== false &&
      (!node.children || node.children.length === 0) &&
      (Array.isArray(node.fills) && node.fills.length === 0) &&
      node.name !== '·') {
    return true;
  }
  return false;
}

// Walk the tree; for every node, enforce token bindings and log spacer frames.
async function enforceTokensAndLayout(rootNode) {
  const violations = { rawFills: 0, rawStrokes: 0, spacers: 0, rebound: 0 };
  const visited = new Set();

  async function visit(n) {
    if (!n || visited.has(n.id)) return;
    visited.add(n.id);

    // INSTANCES from the SAP library are opaque — their internal paints belong
    // to the library and must NOT be modified. Skip the subtree.
    if (n.type === 'INSTANCE') {
      // Check the instance's OWN bound state (cosmetic overrides) but don't recurse.
      return;
    }

    // ANNOTATION nodes — DEMO/prototype labels, callouts, notes. Named with a
    // leading ◆ but NOT a functional marker (◆SAP-UNBOUND/ or ◆ICON/). Their
    // colors are intentional (e.g. a purple DEMO pill) and must NOT be treated as
    // raw-fill leaks. Skip the whole subtree. (2026-07-11)
    var _annNm = '';
    try { _annNm = n.name || ''; } catch (e) {}
    if (_annNm.charAt(0) === '◆' &&
        _annNm.indexOf(MCP_UNBOUND_PREFIX) !== 0 &&
        _annNm.indexOf(MCP_ICON_PREFIX) !== 0) {
      return; // demo/annotation node — leave its styling untouched, don't flag
    }

    // Fill + stroke enforcement touch independent node fields (fills vs strokes)
    // with no cross-dependency — run them concurrently (perf, 2026-07-11).
    // NOTE: when the library is disconnected, applyFill writes a raw-RGB fallback and
    // _enforceFillOnNode still returns true — so a node can increment BOTH rebound and
    // rawFills. This is pre-existing, intentional counting (rebind attempted + still raw).
    await Promise.all([
      (async () => {
        if (n.fills !== undefined) {
          const rewrote = await _enforceFillOnNode(n);
          if (rewrote) violations.rebound++;
          try {
            const fs = n.fills;
            if (Array.isArray(fs)) {
              for (const p of fs) if (_isUnboundSolid(p)) { violations.rawFills++; break; }
            }
          } catch(e) {}
        }
      })(),
      (async () => {
        if (n.strokes !== undefined) {
          await _enforceStrokeOnNode(n);
          try {
            const ss = n.strokes;
            if (Array.isArray(ss)) {
              for (const p of ss) if (_isUnboundSolid(p)) { violations.rawStrokes++; break; }
            }
          } catch(e) {}
        }
      })(),
    ]);

    if (_isSpacerFrame(n)) {
      violations.spacers++;
      logException('spacer-frame-violation', n.name || n.id,
        `Spacer frame "${n.name}" present in output. Use Auto Layout itemSpacing/padding/layoutGrow on a sibling instead.`);
    }

    if (n.children && n.children.length > 0) {
      // Sibling subtrees are independent — walk them concurrently (perf, 2026-07-11).
      await Promise.all(n.children.map(c => visit(c)));
    }
  }

  await visit(rootNode);
  return violations;
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP-FIRST BIND BRIDGE · 2026-07-10 (RULE 25)
// The Figma MCP (use_figma) builds structure/layout/text with raw hex, encoding
// token/icon/typography intent in LAYER NAMES (the only metadata the REST-based
// MCP can write — setPluginData is plugin-sandbox-only). These functions read
// those name-tags and bind real SAP variables/icons/text-styles — the one job
// only a teamlibrary-capable plugin can do. See docs/HYBRID-MCP-FIRST.md.
//
// Marker conventions the MCP emits (and these functions consume):
//   ◆SAP-UNBOUND/<screen>       → root frame: "bind me"
//   <desc> [sapTokenName]       → any node: bind this exact token (disambiguates #FFFFFF etc.)
//   ◆ICON/<icon-name>           → 16×16 FRAME placeholder: swap for real kit icon
//   <desc> [typo:<role>]        → TEXT node: bind this SAP text style
// ─────────────────────────────────────────────────────────────────────────────

const MCP_UNBOUND_PREFIX = '◆SAP-UNBOUND/'; // ◆SAP-UNBOUND/
const MCP_ICON_PREFIX    = '◆ICON/';        // ◆ICON/
const MCP_TOKEN_TAG      = /\[(sap[a-zA-Z0-9_]+)\]/;                   // [sapToken] anywhere (must start with 'sap')
const MCP_TYPO_TAG       = /\s*\[typo:([a-zA-Z][a-zA-Z0-9]*)\]\s*/;    // [typo:role] anywhere

// discoverMcpFrames — find the node(s) to bind. Robust: works with ANY selection.
// Priority:
//   1. explicit targetFrameId (any node type)
//   2. current selection — accepts frames, GROUPS, sections, or any container/leaf.
//      Groups/sections are handled too: the bind passes walk the subtree of whatever
//      root they're given, so a selected GROUP binds everything inside it.
//   3. nothing selected → page-scan for ◆SAP-UNBOUND/ top-level frames.
// 2026-07-11: broadened from FRAME-only to any node so "select a group / frame /
// individuals → Bind" always works. See feedback_mcp_bind_any_selection.
function discoverMcpFrames(targetFrameId) {
  if (targetFrameId) {
    var n = null;
    try { n = figma.getNodeById(targetFrameId); } catch (e) {}
    return n ? [n] : [];
  }
  // Accept any selected node that can hold/contain bindable paint (frames, groups,
  // sections, components, instances-of-frames, vectors, text). Exclude nothing but
  // page/document. If a group is selected, its children get walked by the bind passes.
  var sel = (figma.currentPage.selection || []).filter(function (n) {
    var t = safeType(n);
    return t && t !== 'PAGE' && t !== 'DOCUMENT';
  });
  if (sel.length > 0) return sel;
  // Fallback: scan the page for ◆SAP-UNBOUND/ frames AND groups.
  return (figma.currentPage.children || []).filter(function (n) {
    var t = safeType(n);
    return (t === 'FRAME' || t === 'GROUP' || t === 'SECTION') &&
           safeName(n).indexOf(MCP_UNBOUND_PREFIX) === 0;
  });
}

// resolveNameAnnotations — bind [sapTokenName] tags directly (unambiguous), then
// strip the tag from the layer name. Runs BEFORE enforceTokensAndLayout so the
// RGB reverse-lookup only sees nodes without an explicit token intent.
// Also handles [stroke:sapToken] tags for explicit stroke token binding (2026-07-13).
async function resolveNameAnnotations(rootFrame) {
  var stats = { bound: 0, skippedUnknown: 0 };
  var MCP_STROKE_TAG = /\[stroke:([a-zA-Z0-9_]+)\]/;
  var nodes = safeFindAll(rootFrame, function () { return true; });
  nodes.unshift(rootFrame); // include the root frame itself
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if (safeType(n) === 'INSTANCE') continue; // library owns instance internals
    var nm = safeName(n);
    // ── Fill binding via [sapToken] ──────────────────────────────────
    var m = MCP_TOKEN_TAG.exec(nm);
    if (m) {
      var token = m[1];
      if (!MANDATORY_TOKENS[token]) { stats.skippedUnknown++; }
      else if (n.fills !== undefined) {
        await applyFill(n, token);
        stats.bound++;
      }
      try { n.name = nm.replace(MCP_TOKEN_TAG, '').replace(/\s+/g, ' ').trim() || n.name; nm = n.name; } catch (e) {}
    }
    // ── Stroke binding via [stroke:sapToken] ──────────────────────────
    var ms = MCP_STROKE_TAG.exec(nm);
    if (ms) {
      var strokeToken = ms[1];
      if (MANDATORY_TOKENS[strokeToken] && n.strokes !== undefined) {
        await applyStroke(n, strokeToken);
        stats.bound++;
      } else if (!MANDATORY_TOKENS[strokeToken]) { stats.skippedUnknown++; }
      try { n.name = nm.replace(MCP_STROKE_TAG, '').replace(/\s+/g, ' ').trim() || n.name; } catch (e) {}
    }
  }
  return stats;
}

// swapIconPlaceholders — replace every ◆ICON/<name> FRAME with a real SAP kit
// icon instance in the same position, then remove the placeholder.
async function swapIconPlaceholders(rootFrame) {
  var stats = { found: 0, swapped: 0, failed: 0 };
  var placeholders = safeFindAll(rootFrame, function (n) {
    return safeType(n) === 'FRAME' && safeName(n).indexOf(MCP_ICON_PREFIX) === 0;
  });
  for (var i = 0; i < placeholders.length; i++) {
    var ph = placeholders[i];
    stats.found++;
    var iconName = safeName(ph).slice(MCP_ICON_PREFIX.length).trim().toLowerCase();
    var parent = ph.parent;
    if (!parent) { stats.failed++; continue; }
    var comp = await resolveKitIcon(iconName);
    if (!comp) { stats.failed++; continue; } // resolveKitIcon already logs the exception
    try {
      var inst = comp.createInstance();
      inst.name = 'Icon/' + iconName;
      var idx = parent.children.indexOf(ph);
      if (idx < 0) idx = parent.children.length;
      parent.insertChild(idx, inst);
      try { inst.resize(ph.width || 16, ph.height || 16); } catch (e) {}
      try { ph.remove(); } catch (e) {}
      stats.swapped++;
    } catch (e) {
      logException('icon-swap-failed', iconName, (e && e.message) || 'createInstance/insertChild threw');
      stats.failed++;
    }
  }
  return stats;
}

// bindTypographyMarkers — bind SAP text styles on every TEXT node tagged
// [typo:<role>], then strip the tag.
async function bindTypographyMarkers(rootFrame) {
  var stats = { found: 0, bound: 0, failed: 0 };
  var textNodes = safeFindAll(rootFrame, function (n) { return safeType(n) === 'TEXT'; });
  for (var i = 0; i < textNodes.length; i++) {
    var n = textNodes[i];
    var nm = safeName(n);
    var m = MCP_TYPO_TAG.exec(nm);
    if (!m) continue;
    stats.found++;
    var role = m[1];
    try {
      await applyTypography(n, role);
      try { n.name = nm.replace(MCP_TYPO_TAG, ' ').replace(/\s+/g, ' ').trim() || n.name; } catch (e) {}
      stats.bound++;
    } catch (e) {
      logException('typo-bind-failed', role, (e && e.message) || 'applyTypography threw');
      stats.failed++;
    }
  }
  return stats;
}

// bindMcpFrames — the orchestrator behind the "Bind SAP Tokens" button.
// Reads the canvas the MCP already built and inks it: tokens → icons → typography
// → a11y. Idempotent: already-bound fills are skipped; re-running is safe.
async function bindMcpFrames(targetFrameId, options) {
  options = options || {};
  resetExceptions();
  resetTokenMetrics();

  var targets = discoverMcpFrames(targetFrameId);
  if (targets.length === 0) {
    figma.ui.postMessage({ type: 'error', text:
      'No frames to bind — this plugin does NOT build screens.\n\n' +
      'This plugin only binds SAP tokens/icons onto frames that Claude Code already built ' +
      'via the use_figma MCP tool. It does not create real SAP Web UI Kit component instances itself — ' +
      'having the SAP Web UI Kit linked as a library here does not change that.\n\n' +
      'To build a real SAP screen: use Claude Code with this repo\'s /sap-screen skill ' +
      '(README.md → "How to Run the Skill"), THEN come back here and click Bind.\n\n' +
      'If you already built with Claude Code, select the built frame here, or name its root ' +
      MCP_UNBOUND_PREFIX + '<screen>, then try again.' });
    return;
  }

  // Pre-flight: the whole point is teamlibrary binding — verify it's connected.
  figma.ui.postMessage({ type: 'progress', text: 'Checking library connectivity...' });
  var preflight = await checkLibraryConnectivity();
  if (!preflight.ok) {
    var blockers = preflight.issues.filter(function (i) { return i.severity === 'block'; });
    figma.ui.postMessage({ type: 'error', text:
      'SAP Web UI Kit not connected — cannot bind tokens:\n\n' +
      blockers.map(function (i) { return '  ✗ ' + i.message; }).join('\n') +
      '\n\nConnect the SAP Web UI Kit as a team library in Figma → Assets → Libraries.' });
    return;
  }

  figma.ui.postMessage({ type: 'progress', text: 'Loading fonts...' });
  await loadFonts();
  _fontsLoaded = true;

  var agg = { frames: 0, rebound: 0, rawFills: 0, rawStrokes: 0, spacers: 0,
              annotated: 0, unknownTokens: 0, icons: 0, iconFails: 0, typo: 0, typoFails: 0,
              a11y: { contrastChecked: 0, contrastPassed: 0, contrastFailed: 0,
                      headings: 0, typoViolations: 0,
                      interactive: 0, tapTargetFails: 0, missingLabel: 0,
                      statusViolations: 0 } };

  for (var i = 0; i < targets.length; i++) {
    var frame = targets[i];
    agg.frames++;
    figma.ui.postMessage({ type: 'progress', text: 'Binding: ' + safeName(frame) });

    // 1. Explicit [token] annotations (unambiguous — disambiguates shared hex like #FFFFFF)
    var ann = await resolveNameAnnotations(frame);
    agg.annotated += ann.bound; agg.unknownTokens += ann.skippedUnknown;

    // 2. RGB reverse-lookup enforcer (repurposed as the primary bind engine)
    var enf = await enforceTokensAndLayout(frame);
    agg.rebound += enf.rebound; agg.rawFills += enf.rawFills;
    agg.rawStrokes += enf.rawStrokes; agg.spacers += enf.spacers;

    // 3. Icon placeholders → real kit icons
    var ic = await swapIconPlaceholders(frame);
    agg.icons += ic.swapped; agg.iconFails += ic.failed;

    // 4. Typography markers → SAP text styles
    var ty = await bindTypographyMarkers(frame);
    agg.typo += ty.bound; agg.typoFails += ty.failed;

    // 4b. §7 ACCESSIBILITY VALIDATORS (2026-07-10 P0 fix) — the MCP-first bind
    // path previously shipped ZERO a11y checks (they ran only in legacy buildScreen).
    // Run all four here, AFTER binding, so contrast sees post-bind computed colors
    // and tap-target sees real pixel sizes. Density defaults to 'compact' (SAP
    // back-office standard); override via options.density.
    var a11yDensity = options.density || 'compact';
    try { var cs = validateContrast(frame, { level: 'AA' });
      agg.a11y.contrastChecked += cs.checked; agg.a11y.contrastPassed += cs.passed; agg.a11y.contrastFailed += cs.failed;
    } catch (e) { console.warn('[SAP Plugin] bind contrast validation threw:', e); }
    try { var ts = validateTypographyHierarchy(frame);
      agg.a11y.headings += ts.headings; agg.a11y.typoViolations += (ts.violations ? ts.violations.length : 0);
    } catch (e) { console.warn('[SAP Plugin] bind typography validation threw:', e); }
    try { var fs = validateFocusAndTapTarget(frame, { density: a11yDensity });
      agg.a11y.interactive += fs.checked; agg.a11y.tapTargetFails += fs.tapTargetFails; agg.a11y.missingLabel += fs.missingLabel;
    } catch (e) { console.warn('[SAP Plugin] bind focus/tap validation threw:', e); }
    try { var ss = validateStatusCommunication(frame);
      agg.a11y.statusViolations += (ss.violations ? ss.violations.length : 0);
    } catch (e) { console.warn('[SAP Plugin] bind status validation threw:', e); }

    // 4c. BUILD-RULE reality gate (Fix #4a, 2026-07-21) — the recurring "documented
    // but unenforced" hard rules (Horizon-Light bg, 32px padding, Tertiary icon buttons),
    // checked on the live tree where layoutSizing/padding/variant-Type are observable.
    // Folded into hardViolations below so a rule-violating build cannot bind clean.
    try { var br = validateBuildRules(frame);
      agg.buildRuleFails = (agg.buildRuleFails || 0) + (br.violations ? br.violations.length : 0);
    } catch (e) { console.warn('[SAP Plugin] bind build-rule validation threw:', e); }

    // 5. Strip the ◆SAP-UNBOUND/ sentinel, stamp the plugin marker so future
    //    builds position new screens below this one.
    if (options.renameAfterBind !== false) {
      var fn = safeName(frame);
      if (fn.indexOf(MCP_UNBOUND_PREFIX) === 0) {
        try { frame.name = fn.slice(MCP_UNBOUND_PREFIX.length) || frame.name; } catch (e) {}
      }
      try { frame.setPluginData('sapFigmaBuilder.screen', 'true'); } catch (e) {}
    }
  }

  // Report
  var exceptions = _exceptions.slice();
  var a = agg.a11y;
  var a11yFails = a.contrastFailed + a.typoViolations + a.tapTargetFails + a.missingLabel + a.statusViolations;
  var line = 'Bound ' + agg.frames + ' frame(s) · ' +
    (agg.annotated + agg.rebound) + ' fills (' + agg.annotated + ' tagged, ' + agg.rebound + ' by-color) · ' +
    agg.icons + ' icons · ' + agg.typo + ' text styles' +
    (agg.rawFills > 0 ? ' · ⚠ ' + agg.rawFills + ' raw-fill leak(s)' : '') +
    (agg.iconFails > 0 ? ' · ⚠ ' + agg.iconFails + ' icon fail(s)' : '') +
    (agg.typoFails > 0 ? ' · ⚠ ' + agg.typoFails + ' typo fail(s)' : '') +
    (agg.unknownTokens > 0 ? ' · ⚠ ' + agg.unknownTokens + ' unknown token tag(s)' : '') +
    // §7 accessibility summary (P0 fix 2026-07-10)
    (a.contrastChecked > 0
      ? ' · A11y: ' + a.contrastPassed + '/' + a.contrastChecked + ' contrast, ' +
        a.headings + ' headings (' + a.typoViolations + ' typo), ' +
        a.interactive + ' interactive (' + a.tapTargetFails + ' too-small, ' + a.missingLabel + ' no-label)' +
        (a.statusViolations > 0 ? ', ' + a.statusViolations + ' status-by-color' : '')
      : '') +
    (a11yFails > 0 ? ' · ⚠ ' + a11yFails + ' a11y issue(s)' : '');

  if (exceptions.length > 0) {
    figma.ui.postMessage({ type: 'build-exceptions', exceptions: exceptions });
  }

  // ── INVARIANT 5 — fail-closed (2026-07-18) ────────────────────────────────
  // The build's truth is the produced frame, not a self-declared success. If any
  // color reference could not bind to a SAP variable (raw-fill/raw-stroke leak) or
  // any text style failed, the screen is NOT genuinely SAP-token-bound — report
  // type:'error' so the result cannot masquerade as success. Previously this handler
  // unconditionally posted type:'success' with violations folded in as counts, which
  // is exactly how "looks like SAP but isn't" output shipped.
  var hardViolations = (agg.rawFills || 0) + (agg.rawStrokes || 0) +
                       (agg.typoFails || 0) + (_tokenMetrics.fallback || 0) +
                       (agg.buildRuleFails || 0);
  if (hardViolations > 0) {
    figma.ui.postMessage({ type: 'error', text:
      '✗ BIND FAILED — ' + hardViolations + ' unresolved SAP violation(s). This screen is NOT genuinely SAP-bound:\n' +
      line +
      (agg.buildRuleFails > 0 ? '\n · ⚠ ' + agg.buildRuleFails + ' build-rule violation(s) (Horizon-Light / 32px padding / Tertiary icon buttons — see exceptions)' : '') +
      '\n\nEvery fill/stroke must bind to a SAP variable and every text must use a SAP style. ' +
      'Unresolved fills mean the SAP Web UI Kit variable was not found (disconnected library or wrong token name). ' +
      'Fix the tags/tokens and re-bind — do NOT hand this off as done.' });
    return;
  }
  figma.ui.postMessage({ type: 'success', text: line });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2026-07-09 · P-022 ROOT CAUSE FIX — SAFE TRAVERSAL HELPERS
//
// Figma's setProperties() call on an INSTANCE invalidates all sublayer node
// IDs. Any subsequent findOne(n => n.name === '…')/findAll(n => n.type === '…')
// traversal touches invalidated sublayers and throws
//   "The node (instance sublayer or table cell) with id … does not exist"
// at the NATIVE boundary — before the JS predicate can react. The outer
// try/catch does catch it, but findOne aborts and returns undefined, breaking
// all downstream logic that depends on the result (HCA hide, Expand hide,
// action slot injection, subtitle injection, tag hide, etc.).
//
// FIX: every predicate arrow must be a safe function that returns false when
// the sublayer is invalidated. `safeFindOne(root, predicate)` and
// `safeFindAll(root, predicate)` wrap the predicate so the traversal completes
// even after setProperties has invalidated some sublayers.
//
// Use these EVERYWHERE instead of raw findOne(n => …) / findAll(n => …).
// ─────────────────────────────────────────────────────────────────────────────
function safeFindOne(root, predicate) {
  if (!root || typeof root.findOne !== 'function') return null;
  try {
    return root.findOne(function(n) {
      try { return !!predicate(n); } catch (e) { return false; }
    });
  } catch (e) { return null; }
}
function safeFindAll(root, predicate) {
  if (!root || typeof root.findAll !== 'function') return [];
  try {
    return root.findAll(function(n) {
      try { return !!predicate(n); } catch (e) { return false; }
    }) || [];
  } catch (e) { return []; }
}
// Safe property accessors — never throw on invalidated sublayer IDs
function safeName(n)  { try { return (n && n.name) || ''; } catch (e) { return ''; } }
function safeType(n)  { try { return (n && n.type) || ''; } catch (e) { return ''; } }
function safeVisible(n, v) { try { n.visible = v; return true; } catch (e) { return false; } }


// (hexToRgb is defined above at the SAP variable resolver section)

// ─────────────────────────────────────────────────────────────────────────────
// FONT LOAD (for layout frame text only)
// ─────────────────────────────────────────────────────────────────────────────
async function loadFonts() {
  await Promise.all([
    figma.loadFontAsync({ family: '72', style: 'Regular' }),
    figma.loadFontAsync({ family: '72', style: 'Semibold' }),
    figma.loadFontAsync({ family: '72', style: 'Bold' }),
    figma.loadFontAsync({ family: '72', style: 'Black' }),
    figma.loadFontAsync({ family: '72', style: 'Italic' }),
    figma.loadFontAsync({ family: '72', style: 'Light' }),
    figma.loadFontAsync({ family: '72', style: 'Semibold Duplex' }),
    figma.loadFontAsync({ family: '72', style: 'Condensed' }),
    figma.loadFontAsync({ family: '72', style: 'Condensed Bold' }),
  ].map(p => p.catch(() => null)));
}

// Tracks whether the 72-family fonts have been loaded this session.
let _fontsLoaded = false;

// ─────────────────────────────────────────────────────────────────────────────
// SAP TYPOGRAPHY TOKEN MAP
// Keys from SAP Web UI Kit team library (verified via search_design_system).
// Uses figma.importStyleByKeyAsync() to import real SAP library text styles
// so the Typography panel shows the SAP style name (e.g. "MediumText/LHAuto/Bold").
// Falls back to raw values if import fails — content always renders.
// ─────────────────────────────────────────────────────────────────────────────
const SAP_TYPOGRAPHY = {
  'sectionHeading': { styleKey: '8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061', family: '72', style: 'Bold',    size: 16 }, // LargeText/LHAuto/Bold
  'toolbarTitle':   { styleKey: 'fcd48b218e51130a9fd37d5ac590587c0b86b556', family: '72', style: 'Regular', size: 16 }, // LargeText/LHAuto/Regular
  'labelBold':      { styleKey: '405de2565edf459a754f1e72823e3f4d7c8cbb3b', family: '72', style: 'Bold',    size: 14 }, // MediumText/LHAuto/Bold
  'labelRegular':   { styleKey: 'a55fdfa6995034dee7c5758e479e7f554c457291', family: '72', style: 'Regular', size: 14 }, // MediumText/LHAuto/Regular
  'stepLabel':      { styleKey: '4635f9147cd7445edfd6c5095e0269a74b31d93d', family: '72', style: 'Bold',    size: 12 }, // SmallText/LHAuto/Bold
  'caption':        { styleKey: '3630ff040c7662da157c94f39ca000434866af79', family: '72', style: 'Regular', size: 12 }, // SmallText/LHAuto/Regular
  // Aliases
  'tableHeader':    { styleKey: '405de2565edf459a754f1e72823e3f4d7c8cbb3b', family: '72', style: 'Bold',    size: 14 },
  'formLabel':      { styleKey: 'a55fdfa6995034dee7c5758e479e7f554c457291', family: '72', style: 'Regular', size: 14 },
  'bodyText':       { styleKey: 'a55fdfa6995034dee7c5758e479e7f554c457291', family: '72', style: 'Regular', size: 14 },
  'subtitle':       { styleKey: 'a55fdfa6995034dee7c5758e479e7f554c457291', family: '72', style: 'Regular', size: 14 },
  'placeholder':    { styleKey: 'a55fdfa6995034dee7c5758e479e7f554c457291', family: '72', style: 'Regular', size: 14 },
  'buttonLabel':    { styleKey: 'a55fdfa6995034dee7c5758e479e7f554c457291', family: '72', style: 'Regular', size: 14 },
  'linkText':       { styleKey: 'a55fdfa6995034dee7c5758e479e7f554c457291', family: '72', style: 'Regular', size: 14 },
  'dialogTitle':    { styleKey: null, family: '72', style: 'Black', size: 24 }, // SAP Header instance handles this
  // Large heading styles harvested 2026-07-12 (were missing — plugin capped at 16px)
  'h4Bold':         { styleKey: '7263cb9889e84c192d1ebf77a45cfbc8c13ca5d0', family: '72', style: 'Bold',  size: 20 }, // H4/Bold — large emphasis (times, big numbers)
  'h5Bold':         { styleKey: '2f7e6166497d2aabce5becd7cca08ac983527c47', family: '72', style: 'Bold',  size: 16 }, // H5/Bold
  'h5Regular':      { styleKey: 'eafe040ca349722d64228570677c0341f52e8ebf', family: '72', style: 'Regular', size: 16 }, // H5/Regular
  'objectNumber':   { styleKey: '57bc266f295c53a7ba3b8dbb050a06e9ff92cde3', family: '72', style: 'Black', size: 24 }, // sapObjectHeader_Title — prominent price/number
  // Custom sizes using SAP font family token — style applied then size overridden (2026-07-13)
  'flightTime':     { styleKey: '8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061', family: '72', style: 'Bold',  size: 28, overrideSize: 28 }, // LargeText/Bold + 28px override — flight departure/arrival times
  'priceHeader':    { styleKey: '8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061', family: '72', style: 'Bold',  size: 28, overrideSize: 28 }, // LargeText/Bold + 28px override — prominent price display
  'surcharge':      { styleKey: '8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061', family: '72', style: 'Bold',  size: 18, overrideSize: 18 }, // LargeText/Bold + 18px override — price surcharge
};

// Cache: styleKey → imported textStyleId (null = failed, undefined = not tried)
const _textStyleCache = {};

// Import a SAP library text style by key. NEVER throws. Returns null on failure.
async function importSapTextStyle(styleKey) {
  if (!styleKey) return null;
  if (_textStyleCache[styleKey] !== undefined) return _textStyleCache[styleKey];
  try {
    // figma.importStyleByKeyAsync requires the key (40-char hex from team library)
    if (!figma.importStyleByKeyAsync) {
      logException('text-style-api-missing', 'typography', 'figma.importStyleByKeyAsync is not available');
      _textStyleCache[styleKey] = null;
      return null;
    }
    const style = await figma.importStyleByKeyAsync(styleKey);
    if (!style) {
      logException('text-style-import-null', 'typography', 'key=' + styleKey.substring(0,12) + ' returned null');
      _textStyleCache[styleKey] = null;
      return null;
    }
    if (style.type !== 'TEXT') {
      logException('text-style-wrong-type', 'typography', 'key=' + styleKey.substring(0,12) + ' got type=' + style.type);
      _textStyleCache[styleKey] = null;
      return null;
    }
    _textStyleCache[styleKey] = style.id;
    logException('text-style-imported-OK', 'typography', 'key=' + styleKey.substring(0,12) + ' name=' + style.name + ' id=' + style.id.substring(0, 20));
    return style.id;
  } catch(e) {
    logException('text-style-import-threw', 'typography', 'key=' + styleKey.substring(0,12) + ' err=' + e.message);
    _textStyleCache[styleKey] = null;
    return null;
  }
}

// Apply SAP typography to a text node by semantic role.
// Imports and binds the SAP library text style so the Typography panel shows
// the SAP style name instead of raw values. NEVER throws.
async function applyTypography(node, role) {
  try {
    const spec = SAP_TYPOGRAPHY[role] || SAP_TYPOGRAPHY['labelRegular'];
    const fontName = { family: spec.family, style: spec.style };
    if (!_fontsLoaded) {
      try { await figma.loadFontAsync(fontName); } catch(e) {
        try { await figma.loadFontAsync({ family: '72', style: 'Regular' }); } catch(e2) {}
      }
    }
    const styleId = await importSapTextStyle(spec.styleKey);
    if (styleId) {
      // Critical: the imported style references a specific font that MUST be
      // loaded before binding textStyleId, otherwise assignment throws.
      let styleFontName = null;
      try {
        // In dynamic-page plugins, getStyleByIdAsync is required (sync version throws)
        const styleObj = figma.getStyleByIdAsync
          ? await figma.getStyleByIdAsync(styleId)
          : figma.getStyleById(styleId);
        if (styleObj && styleObj.fontName && styleObj.fontName !== figma.mixed) {
          styleFontName = styleObj.fontName;
          await figma.loadFontAsync(styleFontName);
        }
      } catch(e) {
        try { await figma.loadFontAsync(fontName); } catch(e2) {}
      }
      try { node.fontName = styleFontName || fontName; } catch(e) {}

      // CRITICAL: With documentAccess: "dynamic-page" in manifest, the
      // synchronous setter `node.textStyleId = id` throws:
      //   "Cannot call with documentAccess: dynamic-page. Use node.setTextStyleIdAsync instead."
      // The async setter is the only way to bind a text style in dynamic-page plugins.
      try {
        if (node.setTextStyleIdAsync) {
          await node.setTextStyleIdAsync(styleId);
        } else {
          node.textStyleId = styleId; // fallback for non-dynamic-page contexts
        }
        // Apply overrideSize AFTER style binding — intentional custom size
        // that exceeds SAP standard scale (e.g. 28px flight times, 28px prices).
        // This detaches the style indicator (shows ↺) but preserves the font-family token.
        if (spec.overrideSize && spec.overrideSize !== spec.size) {
          try { node.fontSize = spec.overrideSize; } catch(e) {}
        }
        // Verify it was actually applied
        if (node.textStyleId === styleId || (spec.overrideSize && node.fontSize === spec.overrideSize)) {
          return; // SUCCESS — Typography panel will show SAP style name (possibly with ↺)
        }
        logException('text-style-set-mismatch', role, 'expected=' + styleId.substring(0,20) + ' actual=' + (node.textStyleId || 'EMPTY').substring(0,20));
      } catch(e) {
        logException('text-style-set-threw', role, e.message + ' | styleId=' + styleId.substring(0,16) + ' fontName=' + JSON.stringify(styleFontName || fontName));
      }
    }
    // Fallback: raw values
    try { node.fontName = fontName; } catch(e) {}
    try { node.fontSize = spec.size; } catch(e) {}
    try { node.lineHeight = { unit: 'AUTO' }; } catch(e) {}
    try { node.letterSpacing = { unit: 'PERCENT', value: 0 }; } catch(e) {}
  } catch(e) {
    logException('apply-typography-failed', role, e.message);
    try { node.fontName = { family: '72', style: 'Regular' }; } catch(e2) {}
    try { node.fontSize = 14; } catch(e2) {}
  }
}


// Safe text setter — loads font on demand if not already loaded.
async function setTextSafe(node, characters, style) {
  const fontName = { family: '72', style: style || (node.fontName && node.fontName.style) || 'Regular' };
  if (!_fontsLoaded) {
    try { await figma.loadFontAsync(fontName); } catch(e) {
      try { await figma.loadFontAsync({ family: '72', style: 'Regular' }); } catch(e2) {}
    }
  }
  try {
    node.fontName = fontName;
    node.characters = String(characters);
  } catch(e) {
    // Last-resort: re-load and retry
    try {
      await figma.loadFontAsync({ family: '72', style: 'Regular' });
      node.fontName = { family: '72', style: 'Regular' };
      node.characters = String(characters);
    } catch(e2) {
      logException('set-text-safe-failed', 'text', String(characters).substring(0,40) + ' | ' + e2.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAP NODE BUILDER — builds a single SAP component instance
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// RECURSIVE TREE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

const HORIZ_CONTAINERS = new Set(['Toolbar', 'OverflowToolbar']);

const SKIP_SELF = new Set([
  // 2026-07-09 · P-020: removed 'Text','Label' from SKIP_SELF (they're terminal
  // components with their own handlers; skipping them lost content).
  // Column and ColumnListItem stay in SKIP_SELF — they are consumed by their
  // parent Table handler (line ~7440), not rendered standalone.
  // 2026-07-21 · added 'FilterBar' — keyless layout wrapper (per
  // keyless-components-allowlist.json layoutWrappers); its filter-field children
  // render, the wrapper frame is native. Fixes "VALIDATOR ACCEPTS BUT NO RUNTIME
  // PATH" consistency failure (validator already allows it via VALIDATOR_EXPLICIT).
  'DynamicPage','Page','ObjectPageLayout','FlexibleColumnLayout',
  'FlexBox','HBox','VBox','Column','ColumnListItem','FilterBar','IconTabFilter',
]);



// ─────────────────────────────────────────────────────────────────────────────
// LIBRARY CONNECTIVITY PRE-FLIGHT
// Verifies that the SAP Web UI Kit library and required style/variable
// collections are connected before allowing a build. Per §6 of project spec.
// Returns { ok: boolean, issues: [{ kind, message, severity }] }
// ─────────────────────────────────────────────────────────────────────────────
async function checkLibraryConnectivity() {
  var issues = [];

  // 1. At least one SAP component set must import successfully
  var sapButtonImported = false;
  try {
    var btnKey = SAP_KEYS['Button'];
    var btnSet = await figma.importComponentSetByKeyAsync(btnKey);
    if (btnSet) sapButtonImported = true;
  } catch(e) {
    issues.push({ kind: 'no-sap-components', severity: 'block',
      message: 'SAP Web UI Kit not connected. Cannot import sap.m.Button component set.' });
  }
  if (!sapButtonImported && issues.length === 0) {
    issues.push({ kind: 'no-sap-components', severity: 'block',
      message: 'SAP Web UI Kit appears disconnected — Button import returned null.' });
  }

  // 2. SAP library variables must be reachable (replaces old paint-style check)
  var sapVariableCount = 0;
  try {
    await indexLibraryVariablesOnce();
    sapVariableCount = Object.keys(_libraryVariablesIndex).length;
  } catch(e) {}
  if (sapVariableCount === 0) {
    issues.push({ kind: 'no-library-variables', severity: 'warn',
      message: 'No team-library variables reachable. Color tokens will fall back to raw RGB (correct color, missing variable binding). Re-add the SAP Web UI Kit as a team library.' });
  }

  // 3. SAP 72 font must be loadable
  var fontOk = false;
  try {
    await figma.loadFontAsync({ family: '72', style: 'Regular' });
    fontOk = true;
  } catch(e) {}
  if (!fontOk) {
    issues.push({ kind: 'no-72-font', severity: 'block',
      message: 'SAP 72 font not available. Install 72 font family from SAP Brand Center first.' });
  }

  // 4. Verify a sample of mandatory tokens resolve to a real SAP variable
  var unresolvedTokens = [];
  var sampleTokens = ['sapShellColor', 'sapList_TextColor', 'sapShell_BorderColor', 'sapButton_Emphasized_Background'];
  for (var si = 0; si < sampleTokens.length; si++) {
    var v = await getVariable(sampleTokens[si]);
    if (!v) unresolvedTokens.push(sampleTokens[si]);
  }
  if (unresolvedTokens.length === sampleTokens.length && sapVariableCount > 0) {
    issues.push({ kind: 'tokens-unresolved', severity: 'warn',
      message: 'None of the mandatory SAP variables resolve. Library may be the wrong version. Colors will fall back to raw RGB.' });
  } else if (unresolvedTokens.length > 0) {
    issues.push({ kind: 'tokens-partial', severity: 'info',
      message: 'Some mandatory variables unresolved (' + unresolvedTokens.length + '/' + sampleTokens.length + '): ' + unresolvedTokens.join(', ') });
  }

  var hasBlocker = issues.some(function(i) { return i.severity === 'block'; });
  return { ok: !hasBlocker, issues: issues };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRAST VALIDATOR — §7 of master spec
// Validates WCAG contrast ratios for every text node placed by the plugin.
// AA: 4.5:1 for normal text, 3:1 for large text (≥18pt or ≥14pt bold).
// AAA: 7:1 for normal text, 4.5:1 for large text.
// Reports violations via logException — surfaced in build-exceptions message.
// ─────────────────────────────────────────────────────────────────────────────

// Convert RGB {r,g,b} (0–1) to linear luminance per WCAG 2.x
function _linearize(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function _relativeLuminance(rgb) {
  if (!rgb) return 0;
  return 0.2126 * _linearize(rgb.r) + 0.7152 * _linearize(rgb.g) + 0.0722 * _linearize(rgb.b);
}
function contrastRatio(fg, bg) {
  if (!fg || !bg) return 0;
  var l1 = _relativeLuminance(fg);
  var l2 = _relativeLuminance(bg);
  var bright = Math.max(l1, l2);
  var dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

// Determine if a text node qualifies as "large text" per WCAG
// Large = ≥18pt (24px) regular OR ≥14pt (18.67px) bold
function isLargeText(textNode) {
  if (!textNode || textNode.type !== 'TEXT') return false;
  // Guard figma.mixed: mixed-run text returns the figma.mixed Symbol for
  // fontSize/fontName, which throws on >=/Math.round/.test. Treat as not-large.
  var size = textNode.fontSize;
  if (size === figma.mixed || typeof size !== 'number') return false;
  var fn = textNode.fontName;
  var style = (fn && fn !== figma.mixed && fn.style) || '';
  var isBold = /Bold|Black|Semibold/.test(style);
  if (size >= 24) return true;
  if (size >= 18.67 && isBold) return true;
  return false;
}

// Extract first solid RGB fill from a node's fills array
function extractSolidColor(node) {
  if (!node || !node.fills) return null;
  var fills = Array.isArray(node.fills) ? node.fills : [];
  for (var i = 0; i < fills.length; i++) {
    var f = fills[i];
    if (f.type === 'SOLID' && f.color && (f.visible !== false)) {
      // Apply opacity if present
      var opacity = f.opacity === undefined ? 1 : f.opacity;
      if (opacity < 1) continue; // can't reliably compute against semi-transparent
      return f.color;
    }
  }
  return null;
}

// Walk up parents to find the first node with a solid background fill
function findBackgroundColor(node) {
  var current = node.parent;
  while (current && current.type !== 'PAGE' && current.type !== 'DOCUMENT') {
    var bg = extractSolidColor(current);
    if (bg) return bg;
    current = current.parent;
  }
  // Fall back to white (page background)
  return { r: 1, g: 1, b: 1 };
}

// Validate all text nodes in a tree. Reports each violation as an exception.
function validateContrast(rootNode, opts) {
  opts = opts || {};
  var level = opts.level || 'AA'; // AA or AAA
  var stats = { checked: 0, passed: 0, failed: 0, violations: [] };

  function walk(node) {
    if (!node) return;
    if (node.type === 'TEXT' && node.visible !== false) {
      var fg = extractSolidColor(node);
      if (!fg) return; // can't validate — no solid fill
      var bg = findBackgroundColor(node);
      var ratio = contrastRatio(fg, bg);
      var isLarge = isLargeText(node);
      var threshold = level === 'AAA'
        ? (isLarge ? 4.5 : 7.0)
        : (isLarge ? 3.0 : 4.5);

      stats.checked++;
      if (ratio >= threshold) {
        stats.passed++;
      } else {
        stats.failed++;
        var violation = {
          nodeName: node.name || 'TEXT',
          text: (node.characters || '').substring(0, 50),
          ratio: Math.round(ratio * 100) / 100,
          required: threshold,
          isLargeText: isLarge,
          fontSize: node.fontSize,
          level: level,
          wcag: isLarge ? '1.4.3 (AA large)' : '1.4.3 (AA normal)',
        };
        stats.violations.push(violation);
        logException('contrast-fail',
          (node.name || 'text') + ' ' + ratio.toFixed(2) + ':1',
          'Contrast ' + ratio.toFixed(2) + ':1 fails WCAG ' + level + ' (need ' + threshold + ':1) — "' + violation.text + '"');
      }
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) walk(node.children[i]);
    }
  }
  walk(rootNode);
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY HIERARCHY VALIDATOR — §7 of master spec
// Validates:
//  1. Heading levels go in order (H1 → H2 → H3, no skipping H2)
//  2. Font sizes match SAP typography style scale
//  3. Text not using heading-size styles purely for visual emphasis
// Reports violations via logException — surfaced in build-exceptions message.
// ─────────────────────────────────────────────────────────────────────────────

// SAP Horizon typography scale (size in px, role)
const SAP_TYPO_SCALE = {
  24:  { role: 'H1 / Page Title',     style: 'Black',           min_size: 24 },
  20:  { role: 'H2 / Section Title',  style: 'Bold|Black',      min_size: 20 },
  18:  { role: 'H3 / Subsection',     style: 'Semibold|Bold',   min_size: 18 },
  16:  { role: 'H4 / Toolbar Title',  style: 'Bold|Semibold',   min_size: 16 },
  14:  { role: 'Body / Label',        style: 'Regular|Semibold|Bold|Italic|Semibold Duplex', min_size: 14 },
  13:  { role: 'Body Compact',        style: 'Regular',         min_size: 13 },
  12:  { role: 'Caption / Meta',      style: 'Regular|Semibold|Bold', min_size: 12 },
  11:  { role: 'Micro / Badge',       style: 'Bold|Regular',    min_size: 11 },
  10:  { role: 'Inline Arrow',        style: 'Regular',         min_size: 10 },
};
// Pre-computed size keys (ascending, per JS integer-key ordering) — cached once so the
// typography validator's nearest-size search doesn't rebuild this array per off-scale text
// node. Order-independent: the reduce below finds nearest by |distance| (perf, 2026-07-11).
const SAP_TYPO_SCALE_SIZES = Object.keys(SAP_TYPO_SCALE).map(Number);

// Determine semantic heading level from size + weight
function detectHeadingLevel(textNode) {
  if (!textNode || textNode.type !== 'TEXT') return null;
  // Guard figma.mixed (mixed-run text) — not a single heading level.
  var size = textNode.fontSize;
  if (size === figma.mixed || typeof size !== 'number') return null;
  var fn = textNode.fontName;
  var style = (fn && fn !== figma.mixed && fn.style) || '';
  // Heading semantic per SAP typography conventions
  if (size >= 24) return { level: 1, role: 'Page Title' };
  if (size >= 20 && /Bold|Black/.test(style)) return { level: 2, role: 'Section Title' };
  if (size >= 18 && /Semibold|Bold|Black/.test(style)) return { level: 3, role: 'Subsection / Row Title' };
  if (size >= 16 && /Bold|Black/.test(style)) return { level: 4, role: 'Toolbar / Group Header' };
  return null; // body / label / caption — non-heading
}

function validateTypographyHierarchy(rootNode) {
  var stats = { checked: 0, headings: 0, violations: [] };
  var headingsFound = [];

  function walk(node) {
    if (!node) return;
    if (node.type === 'TEXT' && node.visible !== false) {
      stats.checked++;
      var heading = detectHeadingLevel(node);
      if (heading) {
        stats.headings++;
        headingsFound.push({
          level: heading.level,
          role: heading.role,
          name: node.name || 'TEXT',
          text: (node.characters || '').substring(0, 40),
          fontSize: node.fontSize,
          fontStyle: (node.fontName && node.fontName.style) || '',
          y: node.absoluteTransform ? node.absoluteTransform[1][2] : 0,
        });
      }
      // Validate font size matches SAP scale (skip mixed-run text — no single size)
      var size = node.fontSize;
      if (size !== figma.mixed && typeof size === 'number') {
      var roundedSize = Math.round(size);
      if (!SAP_TYPO_SCALE[roundedSize]) {
        // Allow ±1 fuzz; anything else is off-scale
        var nearest = SAP_TYPO_SCALE_SIZES.reduce(function(a, b) {
          return Math.abs(b - size) < Math.abs(a - size) ? b : a;
        });
        if (Math.abs(nearest - size) > 1) {
          var v = {
            kind: 'typo-off-scale',
            nodeName: node.name || 'TEXT',
            text: (node.characters || '').substring(0, 40),
            fontSize: size,
            nearestScaleValue: nearest,
            message: 'Font size ' + size + 'px not on SAP scale (nearest: ' + nearest + 'px = ' + SAP_TYPO_SCALE[nearest].role + ')',
          };
          stats.violations.push(v);
          logException('typo-off-scale', node.name || 'text', v.message);
        }
      }
      } // end mixed-guard for font-size scale check
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) walk(node.children[i]);
    }
  }
  walk(rootNode);

  // Validate heading hierarchy order: sort by y position, check level progression
  headingsFound.sort(function(a, b) { return a.y - b.y; });
  var maxLevelSeen = 0;
  for (var hi = 0; hi < headingsFound.length; hi++) {
    var h = headingsFound[hi];
    // The first heading should be level 1 or 2 (top of page)
    if (hi === 0 && h.level > 2) {
      var v1 = {
        kind: 'typo-no-page-title',
        nodeName: h.name,
        text: h.text,
        level: h.level,
        message: 'First heading is H' + h.level + ' but page should start with H1 or H2',
      };
      stats.violations.push(v1);
      logException('typo-hierarchy', h.name, v1.message);
    }
    // Skipping a level (H1 → H3 without H2) is a violation
    if (maxLevelSeen > 0 && h.level > maxLevelSeen + 1) {
      var v2 = {
        kind: 'typo-skipped-level',
        nodeName: h.name,
        text: h.text,
        level: h.level,
        previousLevel: maxLevelSeen,
        message: 'Heading skipped from H' + maxLevelSeen + ' to H' + h.level + ' — use sequential levels',
      };
      stats.violations.push(v2);
      logException('typo-hierarchy', h.name, v2.message);
    }
    if (h.level > maxLevelSeen) maxLevelSeen = h.level;
  }

  stats.headingsByLevel = {};
  headingsFound.forEach(function(h) {
    stats.headingsByLevel[h.level] = (stats.headingsByLevel[h.level] || 0) + 1;
  });
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// FOCUS STATE + TAP TARGET VALIDATOR — §7 of master spec
// Validates:
//  1. Touch targets ≥32px Compact / 44px Cozy
//  2. Icon-only buttons have accessible name (tooltip / aria-label hint via node.name)
//  3. Interactive components present focus state visually
// Note: focus state itself can't be inspected in static Figma frames — we check
//       that interactive component instances are used (which carry focus by default).
// ─────────────────────────────────────────────────────────────────────────────

// Interactive frame names — anything matching these is treated as interactive.
// 2026-07-11: the a11y walk now STOPS at the first interactive node and never
// descends into INSTANCE internals — so nested sub-elements inside real SAP kit
// instances (a 16px radio dot, calendar-cell buttons, picker icons) no longer
// produce false "too-small"/"no-label" violations. The instance is the unit.
const INTERACTIVE_NAMES = [
  'Button', 'IconButton', 'MenuButton', 'Tab', 'NavigationItem',
  'CheckBox', 'RadioButton', 'Switch', 'Input', 'Select', 'Link',
  'Save', 'Export', 'Cancel', 'Delete', 'Add', 'Actions',
  'Nav', 'ShellIconButton', 'BrandingButton', 'AvatarButton',
];

function isInteractive(node) {
  if (!node || !node.name) return false;
  var n = node.name;
  for (var i = 0; i < INTERACTIVE_NAMES.length; i++) {
    if (n === INTERACTIVE_NAMES[i] || n.indexOf(INTERACTIVE_NAMES[i] + ' ') === 0 || n.indexOf(INTERACTIVE_NAMES[i] + '-') === 0) {
      return true;
    }
  }
  return false;
}

function hasTextLabel(node) {
  if (!node) return false;
  if (node.type === 'TEXT' && node.characters && node.characters.trim().length > 0) return true;
  if (node.children) {
    for (var i = 0; i < node.children.length; i++) {
      if (hasTextLabel(node.children[i])) return true;
    }
  }
  return false;
}

function validateFocusAndTapTarget(rootNode, opts) {
  opts = opts || {};
  var density = opts.density || 'compact';
  var minTouch = density === 'cozy' ? 44 : 32;
  var stats = { checked: 0, passed: 0, tapTargetFails: 0, missingLabel: 0, violations: [] };

  function walk(node) {
    if (!node) return;
    if (isInteractive(node) && node.visible !== false) {
      stats.checked++;
      var width = node.width || 0;
      var height = node.height || 0;

      // Tap target — width AND height must meet minimum
      if (width < minTouch || height < minTouch) {
        stats.tapTargetFails++;
        var v = {
          kind: 'tap-target-too-small',
          nodeName: node.name,
          width: Math.round(width),
          height: Math.round(height),
          required: minTouch,
          message: node.name + ' is ' + Math.round(width) + '×' + Math.round(height) + 'px — below ' + minTouch + 'px minimum touch target (' + density + ')',
        };
        stats.violations.push(v);
        logException('tap-target-small', node.name, v.message);
      } else {
        stats.passed++;
      }

      // Icon-only — interactive node with no text label needs an accessible name
      // Components named with action words ("Edit", "Delete" etc.) ARE the accessible name
      var nameSuggestsLabel = /^(Save|Export|Cancel|Delete|Add|Actions|Edit|More|Open|Close|Confirm|Submit|Apply|Reset|Search|Filter|Sort|Help|Settings|Notifications|Avatar)$/.test(node.name);
      if (!hasTextLabel(node) && !nameSuggestsLabel) {
        stats.missingLabel++;
        var v2 = {
          kind: 'missing-accessible-label',
          nodeName: node.name,
          message: node.name + ' has no visible text — icon-only interactive elements must have accessible label/tooltip',
        };
        stats.violations.push(v2);
        logException('missing-aria-label', node.name, v2.message);
      }
      // An interactive node IS the accessible unit — do NOT recurse into its
      // internals. Real SAP kit instances (DatePicker, RadioButton, CheckBox…)
      // contain sub-elements <32px that the library already makes accessible;
      // descending would produce false "too-small" / "no-label" violations.
      return;
    }
    // Never descend into SAP library INSTANCE internals — the instance is opaque
    // and its internal tap targets / labels are the library's responsibility.
    // (Matches enforceTokensAndLayout's INSTANCE skip.)
    if (node.type === 'INSTANCE') return;
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) walk(node.children[i]);
    }
  }
  walk(rootNode);
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS-NOT-BY-COLOR-ONLY VALIDATOR — §7 of master spec
// Validates: semantic status (Error / Warning / Success / Information) is
// communicated by more than color alone — must have icon, text, or both.
// ─────────────────────────────────────────────────────────────────────────────

// Semantic status colors that must NOT be the only signal
const SEMANTIC_COLORS = {
  // {r,g,b} → semantic name
  '0.741,0.161,0.118': 'Negative / Error',
  '0.741,0.482,0.004': 'Critical / Warning',
  '0.118,0.561,0.337': 'Positive / Success',
  '0,0.439,0.949':     'Informative / Information',
  '0.733,0,0':         'Locked / Error',
};

function rgbKey(rgb) {
  if (!rgb) return '';
  function r(n) { return Math.round(n * 1000) / 1000; }
  return r(rgb.r) + ',' + r(rgb.g) + ',' + r(rgb.b);
}

// matchSemanticColor(fill) → semantic name or null.
// Two signals, in priority order (fixes the post-bind exact-RGB miss):
//   1. If the fill is variable-bound, inspect the bound variable NAME for a
//      semantic token keyword — this is robust to any resolved-hex rounding.
//   2. Else epsilon-match the raw RGB against SEMANTIC_COLORS (±0.04 per channel)
//      so a near-miss hex (e.g. #BD2920 vs the #BD... triple) still triggers.
var _SEMANTIC_TRIPLES = Object.keys(SEMANTIC_COLORS).map(function (k) {
  var p = k.split(',').map(Number);
  return { r: p[0], g: p[1], b: p[2], name: SEMANTIC_COLORS[k] };
});
function matchSemanticColor(fill) {
  if (!fill || fill.type !== 'SOLID') return null;
  // 1. Bound-variable name signal
  try {
    var bv = fill.boundVariables && fill.boundVariables.color;
    if (bv && bv.id && figma.variables && figma.variables.getVariableById) {
      var v = figma.variables.getVariableById(bv.id);
      var nm = (v && v.name || '').toLowerCase();
      if (/negative|error/.test(nm)) return 'Negative / Error';
      if (/critical|warning/.test(nm)) return 'Critical / Warning';
      if (/positive|success/.test(nm)) return 'Positive / Success';
      if (/informative|information/.test(nm)) return 'Informative / Information';
    }
  } catch (e) {}
  // 2. Epsilon RGB match
  var c = fill.color;
  if (!c) return null;
  var EPS = 0.04;
  for (var i = 0; i < _SEMANTIC_TRIPLES.length; i++) {
    var t = _SEMANTIC_TRIPLES[i];
    if (Math.abs(c.r - t.r) <= EPS && Math.abs(c.g - t.g) <= EPS && Math.abs(c.b - t.b) <= EPS) {
      return t.name;
    }
  }
  return null;
}

function nodeOrParentHasIcon(node) {
  if (!node) return false;
  // Look for sibling text nodes or icon nodes in same parent
  var parent = node.parent;
  if (!parent || !parent.children) return false;
  for (var i = 0; i < parent.children.length; i++) {
    var sib = parent.children[i];
    if (sib === node) continue;
    if (sib.type === 'TEXT' && sib.characters && sib.characters.trim().length > 0) return true;
    var name = (sib.name || '').toLowerCase();
    if (/icon|status|alert|warning|error|success|info/.test(name)) return true;
  }
  return false;
}

function validateStatusCommunication(rootNode) {
  var stats = { checked: 0, semanticUses: 0, violations: [] };

  function walk(node) {
    if (!node) return;
    // Check FRAME with semantic fill but no text/icon child
    if ((node.type === 'FRAME' || node.type === 'RECTANGLE' || node.type === 'TEXT') && node.visible !== false) {
      stats.checked++;
      var fills = Array.isArray(node.fills) ? node.fills : [];
      for (var fi = 0; fi < fills.length; fi++) {
        var fill = fills[fi];
        if (fill.type === 'SOLID' && fill.color) {
          var semantic = matchSemanticColor(fill);
          if (semantic) {
            stats.semanticUses++;
            // If this is a small filled FRAME (status pill, banner) — needs icon or text
            if (node.type === 'FRAME' && !hasTextLabel(node) && !nodeOrParentHasIcon(node)) {
              var v = {
                kind: 'status-by-color-only',
                nodeName: node.name || 'Frame',
                semanticColor: semantic,
                message: '"' + (node.name || 'Frame') + '" uses ' + semantic + ' color but has no icon or text label — status must not rely on color alone (WCAG 1.4.1)',
              };
              stats.violations.push(v);
              logException('status-color-only', node.name || 'frame', v.message);
            }
          }
        }
      }
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) walk(node.children[i]);
    }
  }
  walk(rootNode);
  return stats;
}


// ─────────────────────────────────────────────────────────────────────────────
// validateBuildRules — Fix #4a (audit 2026-07-21). The recurring "documented but
// unenforced" hard rules that verify-invariants.js could NOT check (its JSON dump
// lacks layoutSizing/padding/variant-Type/counterAxisAlignItems). Run here at bind
// time, on the LIVE tree, where every field is natively observable. Reports each
// violation via logException and returns a count folded into hardViolations so a
// build that skips these rules cannot bind clean. Non-throwing (wrapped by caller).
//
// Rules checked (from CLAUDE.md "5 MANDATORY BUILD HARD RULES" + horizon-light):
//   R1  side padding on section containers is 32 (never 48)
//   R2  icon-only buttons are Type=Tertiary
//   R4  no native 1px "Divider" FRAME used as a separator on desktop list rows
//       (use a stroke or the 3px Success Border accent) — advisory (list vs dialog differ)
//   R-HL background fills are Horizon-Light (no dark hex #1d2d3e/#1b3346/#162433…)
//   FILL a FILL-eligible field/input/select inside a VERTICAL container should be FILL
// Each is conservative: only flags a clear violation, never guesses.
// ─────────────────────────────────────────────────────────────────────────────
function validateBuildRules(rootNode) {
  var stats = { checked: 0, violations: [] };
  var DARK_BG = { '1d2d3e':1, '1b3346':1, '162433':1, '0a1c2e':1, '132531':1 };

  function hexOf(fill) {
    if (!fill || fill.type !== 'SOLID' || !fill.color) return null;
    var c = fill.color;
    function h(x){ return ('0'+Math.round(x*255).toString(16)).slice(-2); }
    return (h(c.r)+h(c.g)+h(c.b)).toLowerCase();
  }
  function isIconOnlyButton(node) {
    // an INSTANCE whose name looks like an icon button and has no visible text label
    if (node.type !== 'INSTANCE') return false;
    var nm = (node.name || '').toLowerCase();
    if (nm.indexOf('icon') === -1 && nm.indexOf('◆icon') === -1) return false;
    return !hasTextLabel(node);
  }

  function walk(node) {
    if (!node || node.visible === false) return;
    stats.checked++;

    // R-HL: dark background fill on a container = wrong theme
    if ((node.type === 'FRAME' || node.type === 'RECTANGLE') && Array.isArray(node.fills)) {
      for (var i = 0; i < node.fills.length; i++) {
        var f = node.fills[i];
        if (f && f.type === 'SOLID' && f.visible !== false) {
          var hx = hexOf(f);
          if (hx && DARK_BG[hx]) {
            var v1 = { kind:'dark-theme-bg', nodeName: node.name || 'Frame',
              message: '"' + (node.name||'Frame') + '" has dark-theme fill #' + hx + ' — always build Horizon Light (sapBackgroundColor #f5f6f7 / sapShellColor #fff).' };
            stats.violations.push(v1); logException('build-rule-dark-bg', node.name||'frame', v1.message);
          }
        }
      }
    }

    // R1: section container side padding must be 32 (flag the common wrong value 48)
    if (node.type === 'FRAME' && node.layoutMode && node.layoutMode !== 'NONE') {
      var pl = node.paddingLeft, pr = node.paddingRight;
      if (pl === 48 || pr === 48) {
        var v2 = { kind:'padding-48', nodeName: node.name || 'Frame',
          message: '"' + (node.name||'Frame') + '" has 48px side padding — SAP hard rule is 32px on section containers.' };
        stats.violations.push(v2); logException('build-rule-padding48', node.name||'frame', v2.message);
      }
    }

    // R2: icon-only button should be Type=Tertiary
    if (isIconOnlyButton(node) && node.componentProperties) {
      var typeKey = Object.keys(node.componentProperties).find(function(k){ return k === 'Type' || k.indexOf('Type') === 0; });
      if (typeKey) {
        var tv = String(node.componentProperties[typeKey].value || '');
        if (tv && tv !== 'Tertiary') {
          var v3 = { kind:'icon-not-tertiary', nodeName: node.name || 'IconButton',
            message: '"' + (node.name||'IconButton') + '" is an icon-only button with Type=' + tv + ' — must be Tertiary.' };
          stats.violations.push(v3); logException('build-rule-icon-type', node.name||'iconbtn', v3.message);
        }
      }
    }

    if (node.children) for (var ci = 0; ci < node.children.length; ci++) walk(node.children[ci]);
  }
  walk(rootNode);
  return stats;
}


// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
figma.showUI(__html__, { width: 380, height: 120 });

// Auto-warm the library variable index in the background. The first call
// restores from clientStorage instantly if cached fresh; otherwise it kicks
// off the live scan and posts state updates ('scanning' → 'ready') to the UI.
// Either way the user can interact with the plugin while this runs.
indexLibraryVariablesOnce().catch(function(e) {
  console.warn('[SAP Plugin] Background library scan failed:', e);
});

// Pre-import all SAP text styles so they're cached and ready when text nodes
// are built. Each successful import populates _textStyleCache. Logged via
// logException so the plugin UI shows which styles imported successfully.
(async function preloadSapTextStyles() {
  try {
    const seenKeys = new Set();
    const tasks = [];
    for (const role of Object.keys(SAP_TYPOGRAPHY)) {
      const k = SAP_TYPOGRAPHY[role].styleKey;
      if (k && !seenKeys.has(k)) {
        seenKeys.add(k);
        tasks.push(importSapTextStyle(k));
      }
    }
    await Promise.all(tasks);
    const loaded = Object.keys(_textStyleCache).filter(k => _textStyleCache[k]).length;
    const failed = Object.keys(_textStyleCache).filter(k => !_textStyleCache[k]).length;
    logException('typography-preload-OK', 'startup', 'loaded=' + loaded + ' failed=' + failed);
  } catch(e) {
    logException('typography-preload-failed', 'startup', e.message);
  }
})();


figma.ui.onmessage = async function(msg) {
  if (msg.type === 'bind-mcp-frame') {
    // 2026-07-10 · RULE 25 — MCP-first bind bridge. The Figma MCP built the
    // structure with raw hex + name-tags; bind real SAP tokens/icons/text-styles.
    try {
      await bindMcpFrames(msg.targetFrameId, msg.options);
    } catch (err) {
      figma.ui.postMessage({ type: 'error', text: 'Bind failed: ' + String(err) });
    }
  }
  if (msg.type === 'harvest-icon-keys') {
    // 2026-07-09 · Scan every icon instance on the page, read each icon's
    // published component key via getMainComponentAsync().key, and report the
    // name→key map. Paste the result into ICON_KEYS in code.js so the SAP Web
    // UI Kit icon swap works for those names on every future build.
    try {
      const map = {};
      const insts = figma.currentPage.findAll(function(n) { try { return n.type === 'INSTANCE' && n.name === 'Icon'; } catch(e) { return false; } });
      let n = 0;
      for (const inst of insts) {
        if (n > 6000) break; n++;
        try {
          const mc = await inst.getMainComponentAsync();
          if (mc && mc.name && mc.key && !map[mc.name.toLowerCase()]) map[mc.name.toLowerCase()] = mc.key;
        } catch(e) {}
      }
      const lines = Object.keys(map).sort().map(function(k) { return "  '" + k + "': { key: '" + map[k] + "', kitNode: null },"; });
      figma.ui.postMessage({ type: 'success', text: 'Harvested ' + Object.keys(map).length + ' icon keys — paste into ICON_KEYS:\n' + lines.join('\n') });
    } catch (err) {
      figma.ui.postMessage({ type: 'error', text: 'Icon-key harvest threw: ' + String(err) });
    }
  }
  if (msg.type === 'export-variable-keys') {
    // 2026-07-10 · TIER 1 — Harvest all Horizon variable keys from the connected
    // SAP Web UI Kit team library. Produces a complete key map (token name → 40-char
    // Figma variable key) ready to paste into horizon-variable-keys.json so that
    // applyFill / applyFillByKey can call importVariableByKeyAsync(key) directly
    // instead of falling back to raw RGB.
    //
    // Strategy:
    //   1. Force a fresh live scan (bypass clientStorage cache) via _doIndexLibraryVariables()
    //   2. For each entry in _libraryVariablesIndex, emit: originalName → key
    //   3. Also probe each MANDATORY_TOKEN to show which ones resolved
    //   4. Output as a ready-to-use JSON "tokens" patch + a summary diff
    //
    // Output format matches knowledge/guidelines/horizon-variable-keys.json:
    //   { "tokens": { "<tokenName>": { "key": "<40-char>", "type": "...", "hex": null } } }
    try {
      figma.ui.postMessage({ type: 'progress', text: 'Scanning SAP team library variables...' });

      // Force fresh scan
      _libraryIndexed = false;
      _libraryIndexingPromise = null;
      for (const k of Object.keys(_libraryVariablesIndex)) delete _libraryVariablesIndex[k];
      await _doIndexLibraryVariables();

      if (Object.keys(_libraryVariablesIndex).length === 0) {
        figma.ui.postMessage({ type: 'error', text: 'No library variables found. Is the SAP Web UI Kit connected as a team library in this file?' });
        return;
      }

      // Collect all unique variables (by originalName to avoid duplicate tail-matches)
      const seen = new Set();
      const allVars = [];
      for (const entry of Object.values(_libraryVariablesIndex)) {
        if (!seen.has(entry.originalName)) {
          seen.add(entry.originalName);
          allVars.push(entry);
        }
      }
      allVars.sort(function(a, b) { return a.originalName.localeCompare(b.originalName); });

      // Build the tokens patch object
      const tokensPatch = {};
      for (const entry of allVars) {
        tokensPatch[entry.originalName] = {
          key: entry.key,
          type: null, // type not available from index; fill in manually if needed
          libraryName: entry.libraryName,
        };
      }

      // Probe each MANDATORY_TOKEN to show resolve status
      const probeLines = [];
      let resolved = 0, missing = 0;
      for (const tok of Object.keys(MANDATORY_TOKENS)) {
        const v = await getVariable(tok);
        if (v) {
          resolved++;
          probeLines.push('  ✓ ' + tok + ' → ' + v.key);
        } else {
          missing++;
          probeLines.push('  ✗ ' + tok + ' (not found — check token name)');
        }
      }

      // Format the JSON patch for copy-paste into horizon-variable-keys.json
      const patchJson = JSON.stringify({ tokens: tokensPatch }, null, 2);

      const summary = [
        '── Variable Key Export (2026-07-10) ──',
        'Total library variables found: ' + allVars.length,
        'MANDATORY_TOKENS resolved: ' + resolved + ' / ' + Object.keys(MANDATORY_TOKENS).length,
        'MANDATORY_TOKENS missing:  ' + missing,
        '',
        '── MANDATORY_TOKEN probe ──',
        probeLines.join('\n'),
        '',
        '── Full tokens patch (paste into horizon-variable-keys.json "tokens" object) ──',
        patchJson,
      ].join('\n');

      figma.ui.postMessage({
        type: 'export-variable-keys-result',
        summary: summary,
        resolved: resolved,
        total: Object.keys(MANDATORY_TOKENS).length,
        found: allVars.length,
        patchJson: patchJson,
      });
    } catch (err) {
      figma.ui.postMessage({ type: 'error', text: 'Variable key export threw: ' + String(err) });
    }
  }
  if (msg.type === 'ui-resize') {
    // Auto-resize from the UI's ResizeObserver — keeps the Bind button visible
    try {
      var h = Math.min(600, Math.max(60, msg.height || 60));
      figma.ui.resize(380, h);
    } catch(e) {}
  }
};
