# Learning Inbox

Human corrections and recurring failures become reviewed learning proposals here.
They do not change project rules automatically.

Lifecycle:

```text
correction -> proposed -> reviewed -> promoted | rejected
```

Create proposals with:

```sh
agentic-workflow learn --from learning.json
```

Required input fields:

- `id`
- `correction`
- `observedPattern`
- `generalizedRule`
- `scope`
- `proposedOwner`
- `mechanism`
- `evidence`
- `limitations`
- `regression`

Valid scopes: `one-off`, `project`, `tool-binding`, `toolkit`, `methodology`.

Promotion is manual. A promoted proposal must identify the resulting doc, template,
gate, test, permission, or eval.
