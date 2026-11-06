# Sleeping Empire — Durable Story Saves

This folder stores a portable story state and a growing history outside any single chat. It does not remove context or usage limits, install an always-running background listener, or grant a chat tools it lacks.

## Start or resume

Use [the master prompt](../prompts/MASTER_PROMPT.md) in the story chat. A tool-enabled narrator should read [CURRENT_STATE.md](CURRENT_STATE.md), [INDEX.md](INDEX.md) and the relevant recent turn records before continuing. Load topic lore only as needed. If a chat cannot open the repository, attach the actual prompt and latest state files.

The initial verified save is **000000**, a reconstructed Chapter XLVII baseline. Future exact turn archiving starts at 000001 when a narrator with write access uses the protocol. Merely adding these files does not retrofit autosave into another already-running chat.

## Files

| File | Purpose |
|---|---|
| `CURRENT_STATE.md` | Compact working memory, latest sequence, current scene and unfinished beat |
| `turns/NNNNNN.md` | Immutable public player/narrator exchange and canonical changes |
| `checkpoints/NNNNNN.md` | Immutable compact snapshot at milestones/every 20 turns |
| `INDEX.md` | Searchable navigation and sequence history |
| `chapters/` | Chapter/interval summaries linking to exact turn ranges, created as play proceeds |
| `../characters/` | Individual character continuity, updated when materially changed |
| `../prompts/MASTER_PROMPT.md` | Narration, mandatory visuals/menus and save instructions |

## Routine procedure

After every narrative turn, record the actual public exchange, update the compact state/index and affected canon, commit them together, and verify the result before displaying a saved indicator. Preserve the prior turn records. Read the current branch head first; reject conflicting updates rather than force-pushing over someone else's continuation. Save numbers are archive sequence numbers, not historical chat turn counts.

Every 20 turns or at a chapter boundary, add an immutable checkpoint and interval summary. The latest state should usually stay under 1,800 words. Do not keep expanding it until it becomes another context problem: use links and retrieve older evidence on demand.

Story changes belong to the active save even if a static chapter summary lags. Retcons must identify the affected prior events and current correction, preserving the original archival record. If live chat has newer unsaved content, preserve it before resuming an older checkpoint.

Store only the actual public story messages and relevant continuity. Do not save hidden reasoning, credentials or unrelated personal conversation. This repository is public, so files committed here are publicly readable, like the existing lore archive.

## Honest status

- **Saved:** external write and remote revision verified.
- **Local only:** written to an actual local file, not remotely backed up.
- **Unsaved:** no confirmed external write; expose the gap and provide a portable save rather than claiming success.

The narrator's save status appears before the mandatory six-choice menu. If no write tool exists, provide a portable checkpoint at least every five narrative turns and whenever asked to save or hand off. Text in a chat is not itself a verified GitHub save.

## New-chat handoff

Use [RESUME_STORY.md](../RESUME_STORY.md). A new narrator loads the latest verified save rather than treating the entire original chat as required context. Retrieve exact prior turns for precise callbacks. This supports an ongoing adventure across chats while retaining context limits, possible tool failures and the need to report gaps honestly.
