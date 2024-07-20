import HotReloadPlugin from './plugin'

const clazz = new HotReloadPlugin({ baseDirectory: 'assets/mods/cc-hotreload/' } as any)
clazz.prestart()
