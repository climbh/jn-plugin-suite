import chokidar from 'chokidar'

export function watchFiles(
  watchPath: string,
  onChange: (file: string) => void,
) {
  const watcher = chokidar.watch(watchPath, {
    persistent: true,
    ignoreInitial: false,
    followSymlinks: false,
  })

  watcher.on('raw', (_, fileChangeName: string) => {
    onChange(fileChangeName)
  })

  watcher.on('error', (error) => {
    console.error(`[File Watcher Error]: ${error}`)
  })

  return watcher
}
