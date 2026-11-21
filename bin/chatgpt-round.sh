#!/bin/bash
# Challenger adapter: OpenCode driving GPT-6.1-sol via OpenRouter.
# Agentic CLI: it reads claim files, writes the round file and can run bin/sync.
# The brief arrives on stdin; opencode takes the prompt as an argument.
# The API key comes from a file OUTSIDE this repo and is never committed.
set -e
BRIEF="$(cat)"
KEY="$(sed -n 's/^OPENROUTER_API_KEY=//p' /home/dennis/.hermes/.env | tr -d '"\r')"
export OPENROUTER_API_KEY="$KEY"
# F4 fix (Fable): the adapter knows the dispatched model - inject it (see numes-round.sh)
BRIEF="${BRIEF}

ATTRIBUTION (binding, from the dispatching adapter): you are running as model
openai/gpt-6.1-sol. Write exactly 'model: openai/gpt-6.1-sol' in the round frontmatter
and use the filename tag gpt-6-1-sol. Never copy a model name from an earlier round - a
misattributed round is refused by the gate."
exec /home/dennis/.hermes/tools/node-26.7.0-linux-x64/bin/opencode run "$BRIEF" \
  --model openrouter/openai/gpt-6.1-sol --auto
