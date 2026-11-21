#!/bin/bash
# Adjudicator adapter: Claude Code (Anthropic - a third model, not hermes/GLM,
# not GPT-6). The brief arrives on stdin and is piped to -p; agentic with file
# and bash tools so it can read claim files, write the round file, run bin/sync.
# NOTE: --allowedTools is array-valued and would swallow a prompt argument -
# so the prompt goes through stdin, never as a positional.
set -e
BRIEF="$(cat)"
printf '%s' "$BRIEF" | exec /home/dennis/.hermes/tools/node-26.7.0-linux-x64/bin/claude -p \
  --allowedTools "Read Write Edit Glob Grep Bash"
