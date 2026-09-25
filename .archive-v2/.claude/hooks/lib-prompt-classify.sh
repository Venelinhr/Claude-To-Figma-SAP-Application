#!/bin/bash
# lib-prompt-classify.sh — the SINGLE definition of "does this user prompt reference an
# image or a build/design request?"
#
# WHY THIS EXISTS (audit 2026-09-14, finding B):
# enforce-wireframe-first.sh and recall-vdi.sh each independently ran their own
# `grep -qiE "image|screenshot|..."` against the same lowercased prompt, hand-copied and
# already drifted apart: recall-vdi.sh's pattern was a superset (it also matched
# build|create.*screen|design.*screen|clone|floorplan) while enforce-wireframe-first.sh's
# image-only check didn't. A prompt could trigger the VDI-cache hint without triggering the
# wireframe gate, or vice versa, for what a person would call the same kind of message.
#
# One definition now, sourced by both. Change it here and every hook agrees.
#
# Usage:
#   source "$(dirname "$0")/lib-prompt-classify.sh"
#   is_image_or_build_prompt "$LOWERCASED_PROMPT" || exit 0

# Image/reference tokens — a screenshot, photo, sketch or file-extension reference.
IMAGE_PROMPT_TOKENS='image|screenshot|reference|photo|sketch|wireframe|\.png|\.jpg|\.jpeg|\.webp'

# Build/design-request tokens — verbs that mean "make me a screen" without necessarily
# attaching an image.
BUILD_PROMPT_TOKENS='build|create.*screen|design.*screen|clone|floorplan'

# is_image_or_build_prompt <lowercased prompt> → 0 (true) if either token set matches.
is_image_or_build_prompt() {
  printf '%s' "$1" | grep -qiE "${IMAGE_PROMPT_TOKENS}|${BUILD_PROMPT_TOKENS}"
}

# is_image_prompt <lowercased prompt> → 0 (true) for the narrower image-only check
# (enforce-wireframe-first.sh's original "reference image present" hard-rule trigger).
is_image_prompt() {
  printf '%s' "$1" | grep -qiE "$IMAGE_PROMPT_TOKENS"
}
