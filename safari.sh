mkdir build/safari
cd build/safari
xcrun safari-web-extension-converter ../safariraw --no-open
xcodebuild -workspace "./Plugin Loader/Plugin Loader.xcodeproj/project.xcworkspace" -scheme "Plugin Loader (macOS)" build
