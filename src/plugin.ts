import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import { Mod1 } from './types'
import { MethodInfo, } from './decorators'
import { reloadFile } from './reloader'

const fs: typeof import('fs') = (0, eval)("require('fs')")
// const fs: typeof import('fs') = require('fs')

declare global {
    var hotreload: HotReload
}

class HotReload {
    registeredMethods: MethodInfo[] = []

    constructor() {
        globalThis.hotreload = this
        if ('window' in global) {
            window.hotreload = this
        }
    }

    listen(pluginPath: string, interval: number = 100) {
        fs.watchFile(
            pluginPath,
            {
                persistent: false,
                interval,
            },
            () => this.hotReload(pluginPath)
        )
    }

    async hotReload(pluginPath: string) {
        const rawJs = (await fs.promises.readFile(pluginPath)).toString()
        reloadFile(rawJs, this.registeredMethods)
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

        if (!HotReloadPlugin.mod.isCCModPacked) {
            hotreload.listen(mod.baseDirectory + 'plugin.js')
        }
    }

    async prestart() {}

    async poststart() {}
}
