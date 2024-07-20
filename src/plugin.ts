import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import { Mod1 } from './types'
import { MethodInfo } from './decorators'
import { reloadFile } from './reloader'

const fs: typeof import('fs') = (0, eval)("require('fs')")

declare global {
    var hotreload: HotReload
}

class HotReload {
    constructor() {
        globalThis.hotreload = this
        if ('window' in global) {
            window.hotreload = this
        }
    }

    listen(pluginPath: string, methodInfo: MethodInfo[], interval: number = 100) {
        fs.watchFile(
            pluginPath,
            {
                persistent: false,
                interval,
            },
            () => this.hotReload(pluginPath, methodInfo)
        )
    }

    async hotReload(pluginPath: string, methods: MethodInfo[]) {
        const rawJs = (await fs.promises.readFile(pluginPath)).toString()
        reloadFile(rawJs, methods)
    }
}
new HotReload()

export default class HotReloadPlugin implements PluginClass {
    static dir: string
    static mod: Mod1

    constructor(mod: Mod1) {
        HotReloadPlugin.dir = mod.baseDirectory
        HotReloadPlugin.mod = mod
        HotReloadPlugin.mod.isCCL3 = mod.findAllAssets ? true : false
        HotReloadPlugin.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    async prestart() {}

    async poststart() {}
}
