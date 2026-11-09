# @sudobility/writing_ui

React web editor components for Fadewright screenplays: a `ScriptEditor` that renders a
`@sudobility/writing_core` document as template-styled lines (speed view — live-styled, not paginated)
and edits it through core commands, a read-only paginated `PageView`, an `ElementStylePicker`, and
structure panels (`Navigator`, `IndexCards`).

The package is generic over any `@sudobility/writing_core` document and never imports app packages
(`screenwriter_lib`, `screenwriter_client`, `screenwriter_api`).

Published to GitHub Packages as `@sudobility/writing_ui` (currently `0.1.12`). React 19 is a peer
dependency. License: BUSL-1.1.

## Install

The package and its `@sudobility/*` dependencies live on GitHub Packages. `.npmrc` already points the
`@sudobility` scope at `https://npm.pkg.github.com`, so you need a GitHub token with `read:packages`
available to your package manager (e.g. `GH_PACKAGES_READ_TOKEN`).

```sh
bun install
```

For local multi-repo development, check out the sibling repos `../writing_core` and
`../writing_formats`. When present, `tsconfig.json`, `vitest.config.ts` and `demo/vite.config.ts`
transparently alias `@sudobility/writing_core`, the `@sudobility/writing_formats/fountain-classify`
subpath and `yjs`/`lib0` straight to that source; when absent (e.g. CI), they fall through to the
published dependencies. Exactly one copy of Yjs must load either way.

## Usage

```tsx
import { ScriptEditor, ElementStylePicker, type ScriptEditorHost } from '@sudobility/writing_ui';

function Editor({ host }: { host: ScriptEditorHost }) {
  return (
    <>
      <ElementStylePicker host={host} />
      <ScriptEditor host={host} />
    </>
  );
}
```

`ScriptEditorHost` (`src/host.ts`) mirrors a `screenwriter_lib` document session: `model`, `execute`,
`undo`/`redo`, `subscribe`, `remoteCursors`, `setLocalCursor` (plus optional `noteCaret`, `on`). Pass
the session directly or a thin adapter. The in-memory `demo/memory-host.ts` is a complete reference
implementation (the tests reuse it).

## API

Exported from `src/index.ts`:

- Components: `ScriptEditor`, `ElementStylePicker`, `PageView`, `Navigator`, `IndexCards`.
- Hooks: `useEditorSelection(host)`, `useLayout(host)`, `useScenes(host)`.
- Helpers: `cycleStyles` / `nextStyle`, `knownCueNames` / `matchCueNames`,
  `plainToYIndex` / `yIndexToPlain`, `emuToIn` / `pageGeometry` / `blockStyle` / `cssFontFamily`,
  `ensureStructureCommands` / `setSynopsis`, `getSelectionStore`, `loadLayoutEngine`,
  `defaultSpellingPolicy`.

Key `ScriptEditor` props: `host`, `readOnly?`, `className?`, `placeholder?`, `spellCheck?`,
`spellingPolicy?`, `typeHint?`, `initialCaret?`, `onOpenComments?`.
`ElementStylePicker` props: `host`, `className?`, `disabled?`.

## Development

Uses Bun. Run tests with `bunx vitest run` (the `test:unit` script), never `bun test`.

- `bun install`
- `bun run demo` — Vite dev server with a seeded screenplay at http://localhost:5183
- `bun run typecheck` — `tsc --noEmit` over `src`, `demo` and `tests`
- `bun run test:unit` — Vitest (jsdom) unit tests
- `bun run build` — typecheck plus a demo bundle in `dist-demo/`

See `CLAUDE.md` for architecture, conventions and gotchas.

Courier Prime is bundled under the SIL Open Font License (`assets/fonts/OFL.txt`).

## License

BUSL-1.1
