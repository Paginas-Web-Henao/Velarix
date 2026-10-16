# Provenance: Obsidian agent skills (vendored)

- **Upstream:** https://github.com/kepano/obsidian-skills.git
- **Pinned commit:** `3ccff5338ea700537839b21900aa5358a0402c98` (main, 2026-09-15)
- **License:** MIT, Copyright (c) 2026 Steph Ango (@kepano). Copy: [LICENSE](LICENSE)
- **Added to Velarix:** 2026-10-16
- **Modifications:** none. Byte-identical copies of upstream `skills/<name>/`.

## Vendored skills

| Upstream path | Velarix path | SHA256 |
|---|---|---|
| `skills/obsidian-markdown/SKILL.md` | `.claude/skills/obsidian-markdown/SKILL.md` | `7ad72e1f0a9081ed325e76b6402ad5de50a00e63e2341fd403a92f147234a007` |
| `skills/obsidian-markdown/references/CALLOUTS.md` | `.claude/skills/obsidian-markdown/references/CALLOUTS.md` | `9912ec2e3f8711f65b8ceb82cc19cbffc5e6f8ccf2ab627e18926c522c383d8b` |
| `skills/obsidian-markdown/references/EMBEDS.md` | `.claude/skills/obsidian-markdown/references/EMBEDS.md` | `63b6205507e28fb58cf200bc348a2b139e50ae739743e2e6316732148973cb7a` |
| `skills/obsidian-markdown/references/PROPERTIES.md` | `.claude/skills/obsidian-markdown/references/PROPERTIES.md` | `392953b5838c3ab3df135b5a914f100ae7b95e4501b6a2e5c8dc63da3ac7558b` |
| `skills/obsidian-bases/SKILL.md` | `.claude/skills/obsidian-bases/SKILL.md` | `c0037f20926c7d8591cdd040365e4c0e4c0c4146386a506f28f241faee9a27d9` |
| `skills/obsidian-bases/references/FUNCTIONS_REFERENCE.md` | `.claude/skills/obsidian-bases/references/FUNCTIONS_REFERENCE.md` | `208fd63aead9bca1975626fea52605e6ab9434dc0529d923feb36b18b8877d3b` |
| `LICENSE` | `.claude/vendor/obsidian-skills/LICENSE` | `64c64d48361edfe8610016441bf593256ea9b67f133b00f47c55aa29ee878567` |

## Deferred (not vendored; not permanently rejected)

`json-canvas`, `obsidian-cli`, `defuddle`, `knap`.

## Rules

Velarix rules for these skills live in `docs/obsidian-guia.md` (section "Skills de Obsidian para agentes"), not here and not inside the skills. Velarix conventions take precedence over the skills' generic examples.

## Updating

Never edit the vendored files in place. To update: pick a new upstream commit, review the upstream diff, copy the files again byte for byte, and update the commit, date and SHA256 values above in the same commit.
