export { ScriptEditor, type ScriptEditorProps } from './ScriptEditor';
export { ElementStylePicker, type ElementStylePickerProps } from './ElementStylePicker';
export { useEditorSelection, type EditorSelection } from './selection-store';
export type {
  ScriptEditorHost, HostExecuteOptions, RemoteCursorInfo, EditorCursor, PlainPos, Unsubscribe,
} from './host';
export { emuToIn, pageGeometry, blockStyle, cssFontFamily } from './geometry';
export { PageView, type PageViewProps } from './PageView';
export { useLayout, loadLayoutEngine, type UseLayoutResult, type UseLayoutOptions, type LayoutStatus } from './useLayout';
export { Navigator, type NavigatorProps } from './Navigator';
export { IndexCards, type IndexCardsProps } from './IndexCards';
export { useScenes } from './useScenes';
export { ensureStructureCommands, setSynopsis } from './structure-ops';
export { defaultSpellingPolicy, type SpellingPolicy } from './spelling';
export { cycleStyles, nextStyle } from './style-cycle';
export { WUI_MIME, type ClipElement, type ClipPayload } from './clipboard';
export { knownCueNames, matchCueNames } from './cue-names';
/** For a toolbar that must hand the keyboard back to the editor after acting (`getSelectionStore(host).focusEditor?.()`). */
export { getSelectionStore } from './selection-store';
/** Plain-offset <-> Y.Text-index conversion for building `text.*` command ranges (find/replace, etc.). */
export { plainToYIndex, yIndexToPlain } from './dom-positions';
