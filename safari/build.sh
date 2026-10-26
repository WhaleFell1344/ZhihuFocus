#!/bin/bash
set -euo pipefail

safari_root="$(cd "$(dirname "$0")/.." && pwd)"
safari_target="${1:-macos}"

if [[ -z "${DEVELOPER_DIR:-}" && -d /Applications/Xcode.app/Contents/Developer ]]; then
    export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
fi

case "$safari_target" in
    macos)
        safari_scheme='ZhihuFocus (macOS)'
        safari_destination='platform=macOS'
        ;;
    ios)
        safari_scheme='ZhihuFocus (iOS)'
        safari_destination='generic/platform=iOS'
        ;;
    simulator)
        safari_scheme='ZhihuFocus (iOS)'
        safari_destination='generic/platform=iOS Simulator'
        ;;
    *)
        echo 'Usage: bash safari/build.sh [macos|ios|simulator]' >&2
        exit 2
        ;;
esac

safari_signing=(CODE_SIGNING_ALLOWED=NO)
if [[ -n "${ZF_DEVELOPMENT_TEAM:-}" ]]; then
    safari_signing=("DEVELOPMENT_TEAM=$ZF_DEVELOPMENT_TEAM" CODE_SIGNING_ALLOWED=YES -allowProvisioningUpdates)
fi
if [[ "$safari_target" == ios && -n "${ZF_DEVICE_ID:-}" ]]; then
    safari_destination="id=$ZF_DEVICE_ID"
    safari_signing+=(-allowProvisioningDeviceRegistration)
fi

python3 "$safari_root/safari/update-resources.py"
xcodebuild \
    -project "$safari_root/safari/ZhihuFocus/ZhihuFocus.xcodeproj" \
    -scheme "$safari_scheme" \
    -configuration Debug \
    -destination "$safari_destination" \
    -derivedDataPath "$safari_root/build/safari-$safari_target" \
    "${safari_signing[@]}" \
    build
