/**
 * Metro's native recursive watcher is darwin-only, so Windows falls back to
 * watching every directory and hangs with "Failed to start watch mode."
 * Node's fs.watch({ recursive: true }) works on Windows, so enable it there.
 */
const fs = require('fs');
const path = require('path');

const watcherPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'metro-file-map',
  'src',
  'watchers',
  'NativeWatcher.js',
);

if (!fs.existsSync(watcherPath)) {
  return;
}

let source = fs.readFileSync(watcherPath, 'utf8');
const original = source;

source = source.replace(
  'return (0, _os.platform)() === "darwin";',
  'return (0, _os.platform)() === "darwin" || (0, _os.platform)() === "win32";',
);

source = source.replace(
  'if (!NativeWatcher.isSupported) {',
  'if (!NativeWatcher.isSupported()) {',
);

source = source.replace(
  'throw new Error("This watcher can only be used on macOS");',
  'throw new Error("This watcher can only be used on macOS or Windows");',
);

if (
  !source.includes('relativePath == null') &&
  source.includes('async _handleEvent(event, relativePath) {')
) {
  source = source.replace(
    'async _handleEvent(event, relativePath) {\n    const absolutePath = path.resolve(this.root, relativePath);',
    'async _handleEvent(event, relativePath) {\n    if (relativePath == null || relativePath === "") {\n      return;\n    }\n    relativePath = relativePath.replaceAll("\\\\", "/");\n    const absolutePath = path.resolve(this.root, relativePath);',
  );
}

if (
  !source.includes('error?.code === "EPERM"') &&
  source.includes('if (error?.code !== "ENOENT")')
) {
  source = source.replace(
    `    } catch (error) {
      if (error?.code !== "ENOENT") {
        this.emitError(error);
        return;
      }
      this.emitFileEvent({
        event: DELETE_EVENT,
        relativePath,
      });
    }`,
    `    } catch (error) {
      if (error?.code === "ENOENT") {
        this.emitFileEvent({
          event: DELETE_EVENT,
          relativePath,
        });
        return;
      }
      if (error?.code === "EPERM" || error?.code === "EACCES") {
        return;
      }
      this.emitError(error);
    }`,
  );
}

if (source !== original) {
  fs.writeFileSync(watcherPath, source);
}
