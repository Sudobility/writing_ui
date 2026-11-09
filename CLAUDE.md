# @sudobility/writing_ui

React web editor components for Fadewright, over a `@sudobility/writing_core` document:
`ScriptEditor` (speed view), read-only `PageView`, `ElementStylePicker`, structure panels
(`Navigator`/`IndexCards`). **Generic**: never import `screenwriter_lib`, `screenwriter_client` or
`screenwriter_api`. Published to GitHub Packages (`.npmrc` scopes `@sudobility` there; `0.1.x`).

## Tech stack

React 19 (peer), TypeScript strict, Vite (demo only — this is a library, no lib build step), Vitest +
jsdom + Testing Library. **Bun only**; run tests via `bunx vitest run`, never `bun test`.

## Commands (all verified)

- `bun run typecheck` — `tsc --noEmit` over src, demo, tests.
- `bun run test:unit` — `bunx vitest run` (jsdom; ~91 tests across 6 files).
- `bun run demo` — Vite dev server on http://localhost:5183 with a seeded screenplay.
- `bun run build` — typecheck + demo bundle into `dist-demo/`.

No lint script. CI (`.github/workflows/ci-cd.yml`) calls a reusable workflow and publishes on push to
`main`.

## Dependency resolution (keep three files in sync)

`tsconfig.json` `paths`, `vitest.config.ts` and `demo/vite.config.ts` all encode the same aliases.
When the sibling repos `../writing_core` / `../writing_formats` are checked out (local dev) they alias
`@sudobility/writing_core`, the `@sudobility/writing_formats/fountain-classify` subpath, and
`yjs`/`lib0` straight to sibling source. When absent (CI), they fall through to the published npm
dependencies. Any change to one file must be mirrored in the other two.

- **Single Yjs rule**: `writing_core`, the host and this package must load ONE Yjs. The aliases point
  `yjs`/`lib0` at `writing_core`'s copy; configs set `resolve.dedupe: ['yjs','lib0','react','react-dom']`.
  `tests/editor.test.tsx` asserts `instanceof Y.Doc`.
- Only `writing_formats`' `./fountain-classify` subpath is used (by `paste-classify.ts`), to avoid
  pulling in the FDX/.fadein parsers' `fast-xml-parser`/`fflate` deps. Aliasing it to sibling source
  means classifier changes are picked up without republishing `writing_formats`.

## Architecture

The only outside dependency is `ScriptEditorHost` (`src/host.ts`), mirroring `screenwriter_lib`'s
`DocumentSession`: `model`, `execute(commands, {kind, groupKey})`, `undo()/redo()`,
`subscribe(listener)` (a `null` batch = model rebuilt), `remoteCursors`, `setLocalCursor(cursor)`,
optional `noteCaret(id)` / `on('presence', fn)`. Cursor payload: `EditorCursor = {anchor, head}` of
`PlainPos {elementId, offset}`.

- `ScriptEditor.tsx` — rendering, native event wiring, caret restoration, local-cursor publishing.
- `input.ts` — `createInputController`: `beforeinput`/keydown/composition → `writing_core` commands.
- `ElementBlock.tsx` — one memoised block per element, keyed `(id, textVersion.attrsVersion.templateEpoch)`.
- `dom-positions.ts` — DOM point ↔ (element id, plain offset) ↔ Y.Text index.
- `geometry.ts` — template EMU → CSS inches; `ResolvedStyle` → inline style.
- `PageView.tsx` / `useLayout.ts` / `layout-engine.ts` — read-only page view. `layoutDocument` lays
  out 8.5×11 sheets, one absolutely-positioned element per line; click → `onRequestEdit(id, offset)`.
  `useLayout` debounces (150 ms trailing), skips unchanged versions, and dynamic-`import`s the engine
  (writing_core's font tables are ~10 MB — kept out of the initial chunk). Editing in page view is
  deferred (hidden-sink design).
- `Navigator.tsx` / `IndexCards.tsx` / `useScenes.ts` / `structure-ops.ts` — thin structure panels
  from `host.model.scenes()`: click-to-jump, inline synopsis/heading edit, HTML5 drag reorder.
- `selection-store.ts` — shares selection with the picker via a per-host WeakMap; registers
  `focusEditor` / `applyStyle` for toolbars to hand the keyboard back.
- `demo/memory-host.ts` — in-memory host (executor + session undo + subscription); tests reuse it.
- `assets/fonts/` — Courier Prime (SIL OFL); 12 pt advances exactly 0.1 in (10 cpi).

## Core design decisions (non-obvious)

**Controlled contenteditable (speed view).** Each element is a real editable block. Every
`beforeinput` is `preventDefault`ed and turned into a command; the DOM is re-rendered from the read
model. Use native listeners (`addEventListener('beforeinput')`) — React's `onBeforeInput` is a
different event. The hidden-sink/custom-caret design is the deferred end state for paginated editing;
expect this layer to be replaced/wrapped then.

**Caret restoration rule.** React re-renders destroy the browser caret, so every input path calls
`env.setCaret(anchor, head)` with the model-space caret; `ScriptEditor` stores it in `pendingSel` and a
`useLayoutEffect` (no deps) writes the DOM selection after each commit. Model changes from elsewhere
capture the DOM selection in `subscribe` before render. Undo/redo infer caret from the text diff.
Never re-render an element mid-IME composition (`frozen` prop); on `compositionend` the element is
remounted (nonce in React key) and composed text applied via `text.replaceRange`. **A new input path
that forgets `setCaret` makes the caret jump.**

**Positions.** `WireDocPos.offset` is a Y.Text index (embeds count); the DOM and `PlainPos` use plain
UTF-16 offsets. Convert with `plainToYIndex` / `yIndexToPlain` using `element.text.embeds[].at`.

## Keyboard / element-type behaviors (explicit user requirements, all in-package)

- `style-cycle.ts` — **Tab / Shift+Tab cycle the element type** at the caret through the template's
  numbered styles (Scene Heading, Action, Character, Parenthetical, Dialogue, Transition, Shot),
  wrapping, on empty and non-empty lines alike; text/caret stay, Tab never inserts a line. This
  **replaced** the Final Draft-style per-type Tab flow (did nothing on many lines). Enter still follows
  the template's flow.
- `parenthetical.ts` — an EMPTY element becoming a Parenthetical gets `()` with the caret between;
  a parenthetical holding only `()` loses it when it becomes another type. Writer-typed text is never
  wrapped/stripped. One batch with `element.setStyle` (one undo). All type-change paths go through
  `styleChange` (Tab, Cmd/Ctrl+number, Enter flow, and `ElementStylePicker` via
  `SelectionStore.applyStyle`).
- `clipboard.ts` — copy/cut/paste **keep each element's type**. Payload goes on the clipboard as
  `application/x-wui-elements+json`, a `data-wui-elements` attr in `text/html`, and Fountain-shaped
  `text/plain`. Paste is handled on the `paste` event (only there are all flavours readable).
- `paste-classify.ts` — `classifyPastedText` tags pasted plain-text lines with a screenplay role. Two
  modes: blank-line-delimited reuses `writing_formats`' `classifyBlock`; "flat paste" (no blank lines)
  uses a per-line heuristic. **Accepted limitation**: flat dialogue→action with no blank line and no
  all-caps cue reads as more dialogue (no syntactic signal). Fix-up path is Tab/Cmd+number. Documented
  as expected in `tests/editor.test.tsx` (`paste classification`).
- `TypeHint.tsx` — type name in a bubble under the caret on an EMPTY line and for 1.6 s after a
  keyboard type change. Overlay outside `.wui-page`, `aria-hidden`, no pointer events. `typeHint={false}`
  turns it off.
- `CueComplete.tsx` + `cue-names.ts` — character-name completion while typing a Character cue. Enter
  takes the highlight and advances a line (`completeCue`, one undo). Highlight follows `mousemove`, not
  `mouseenter` (a list opening under a resting pointer must not change the selection — a real bug a
  browser test caught).
- **Automatic `(CONT'D)`** in the edit view: `ScriptEditor` runs `writing_core`'s `contextPass` (same
  as pages/print) and `ElementBlock` shows it as `data-contd` + CSS `::after`. **Shown, never stored.**

## Gotchas

- `registerBuiltinCommands()` must have run (done in `src/input.ts`); the registry is a process-wide
  singleton.
- **`scene.setSynopsis` is not in `writing_core` yet** — `structure-ops.ts` registers it unless core
  already has it. Scene reorder does ONE `scene.move` per drop, **never batched** (`move`/`delete` read
  a stale `ctx.model` inside a batch).
- `ElementStylePicker` is a bare native `<select>`: a focused closed `<select>` responds to a plain
  letter keydown with the browser's own type-ahead (fires a real `change`, silently restyling the
  element). Its `onKeyDown` blocks every key except the ones needed to drive the dropdown and returns
  focus to the editor. See `tests/stylepicker.test.tsx`.
- Uppercase styles use CSS `text-transform`; stored text keeps its case.
- Empty blocks and blocks ending in a soft return carry a `<br data-sentinel>`; position mapping ignores it.
- Hidden-in-script styles render dimmed with a left rule, non-printing hatched, omitted scenes struck.

## Related projects

`writing_core` · `writing_formats` · `screenwriter_lib` · `screenwriter_app` · `writing_ui_rn` ·
`screenwriter_plans` (spec 08)
