import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import { Mod1 } from './types'
import { registeredMethods } from './decorators'
import { reloadFile } from './reloader'

const fs: typeof import('fs') = (0, eval)("require('fs')")
// const fs: typeof import('fs') = require('fs')

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
        reloadFile(rawJs, registeredMethods)
    }
}

export default class HotReloadPlugin implements PluginClass {
    static dir: string
    static mod: Mod1

    constructor(mod: Mod1) {
        HotReloadPlugin.dir = mod.baseDirectory
        HotReloadPlugin.mod = mod
        HotReloadPlugin.mod.isCCL3 = mod.findAllAssets ? true : false
        HotReloadPlugin.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')

        new HotReload()

        if (!HotReloadPlugin.mod.isCCModPacked) {
            hotreload.listen(mod.baseDirectory + 'plugin.js')
        }
    }

    async prestart() {}

    async poststart() {}
}
