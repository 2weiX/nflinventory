#!/bin/bash
# nflinventory agent adapter (the zipbiz discussion-loop pattern): bin/overnight pipes the task brief to this script's
# stdin; hermes takes the prompt as an argument. One round per invocation.
cd "$(dirname "$0")/.." || exit 1
exec /home/dennis/.local/bin/hermes chat -q "$(cat)"
