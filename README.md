# claude-test

A personal Claude Code plugin marketplace.

| Plugin | What it does | Upstream |
|---|---|---|
| `anatomy` | Interactive isometric SVG figures that explain a technical idea as a physical machine | [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (MIT) |
| `text-to-cad` | Parametric CAD parts and assemblies (build123d), exports, manufacturing checks, drawings, FEA, PCBs, renders, robot descriptions. Pulled from GitHub, pinned to v0.11.10 | [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) (MIT) |

## Install (Claude Code)

```
/plugin marketplace add edisontie/claude-test
/plugin install anatomy@edisontie-plugins
/plugin install text-to-cad@edisontie-plugins
```

Then start a new session and ask for an isometric explainer, or run `/anatomy:anatomy`.

Anatomy needs Node.js 20.10+ and Chrome/Chromium for its visual checks.

text-to-cad's skills drive a local `cad` command (and its CAD viewer), which the plugin does
not install. Install it once with the upstream installer, then restart Claude Code:

```
curl -fsSL https://texttocad.dev/install.sh | sh
```

By default text-to-cad sends anonymous usage stats and crash reports; its
[privacy policy](https://www.texttocad.dev/privacy-policy) says how to turn that off.
