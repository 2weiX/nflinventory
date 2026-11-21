#!/bin/bash
# Challenger adapter: OpenCode driving Kimi K3.1 Pro via numes.ai.
# Agentic CLI: it reads claim files, writes the round file and can run bin/sync.
# The brief arrives on stdin; opencode takes the prompt as an argument.
# The numes key comes from the environment outside this repo and is never committed.
# Model: moonshotai/kimi-k3.1-pro:free - the :free variant is the $0 tier
# (2026-11-20: numes moved free to a :free suffix; the bare kimi-k3.1-pro now
# bills $2.11/$10.55). Previously checked 2026-11-09, pricing 0/0);
# the paid moonshotai/kimi-k3 ($2.85/M) is retired from the roster.
set -e
BRIEF="$(cat)"
export OPENCODE_CONFIG=/home/dennis/.config/opencode/numes.json
# F4 fix (Fable): attribution is self-reported - inject the truth. The adapter knows the
# model it dispatched; the agent must write exactly this string in the round frontmatter.
BRIEF="${BRIEF}

ATTRIBUTION (binding, from the dispatching adapter): you are running as model
moonshotai/kimi-k3.1-pro:free. Write exactly 'model: moonshotai/kimi-k3.1-pro:free' in the round
frontmatter and use the filename tag kimi-k3-1-pro. Never copy a model name from an
earlier round - a misattributed round is refused by the gate."
exec /home/dennis/.hermes/tools/node-26.7.0-linux-x64/bin/opencode run "$BRIEF" \
  --model "numes/moonshotai/kimi-k3.1-pro:free" --auto
